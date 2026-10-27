const express = require('express');
const { pool } = require('../db');
const { STATUSES, validateEvent, validateRegistration } = require('../validators');

const router = express.Router();

// A small error type so we can stop early with a status code and a message
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Every event comes back with how many people registered and how many seats are left
const EVENT_QUERY = `
  SELECT e.*,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
  FROM events e
`;

function withSeats(event) {
  const registered = Number(event.registered_count);
  return {
    ...event,
    registered_count: registered,
    available_seats: Math.max(event.total_seats - registered, 0),
  };
}

// GET /api/events?scope=public&search=react&category=Workshop&sort=asc
router.get('/', async (req, res) => {
  const { search = '', category = '', sort = 'asc', scope = '' } = req.query;

  const conditions = [];
  const values = [];

  // The public site hides finished events, the admin dashboard sees everything
  if (scope === 'public') conditions.push("e.status <> 'Completed'");

  if (search.trim()) {
    conditions.push('e.title LIKE ?');
    values.push(`%${search.trim()}%`);
  }
  if (category && category !== 'All') {
    conditions.push('e.category = ?');
    values.push(category);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const direction = sort === 'desc' ? 'DESC' : 'ASC';

  const [rows] = await pool.query(
    `${EVENT_QUERY} ${where} ORDER BY e.event_date ${direction}, e.event_time ${direction}`,
    values
  );
  res.json(rows.map(withSeats));
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${EVENT_QUERY} WHERE e.id = ?`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Event not found.' });
  res.json(withSeats(rows[0]));
});

// POST /api/events  (create)
router.post('/', async (req, res) => {
  const { errors, clean } = validateEvent(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }

  const [result] = await pool.query(
    `INSERT INTO events
      (title, category, description, event_date, event_time, venue, image_url, total_seats, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clean.title, clean.category, clean.description, clean.event_date, clean.event_time,
      clean.venue, clean.image_url || null, clean.total_seats, clean.status,
    ]
  );

  const [rows] = await pool.query(`${EVENT_QUERY} WHERE e.id = ?`, [result.insertId]);
  res.status(201).json(withSeats(rows[0]));
});

// PUT /api/events/:id  (edit)
router.put('/:id', async (req, res) => {
  const [rows] = await pool.query(`${EVENT_QUERY} WHERE e.id = ?`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Event not found.' });

  const { errors, clean } = validateEvent(req.body);

  // You can't shrink an event below the number of people who already signed up
  const alreadyRegistered = Number(rows[0].registered_count);
  if (!errors.total_seats && clean.total_seats < alreadyRegistered) {
    errors.total_seats = `${alreadyRegistered} people have already registered, so seats can't go below that.`;
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }

  await pool.query(
    `UPDATE events
        SET title = ?, category = ?, description = ?, event_date = ?, event_time = ?,
            venue = ?, image_url = ?, total_seats = ?, status = ?
      WHERE id = ?`,
    [
      clean.title, clean.category, clean.description, clean.event_date, clean.event_time,
      clean.venue, clean.image_url || null, clean.total_seats, clean.status, req.params.id,
    ]
  );

  const [updated] = await pool.query(`${EVENT_QUERY} WHERE e.id = ?`, [req.params.id]);
  res.json(withSeats(updated[0]));
});

// PATCH /api/events/:id/status  (quick status change from the dashboard)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Status must be Upcoming, Ongoing or Completed.' });
  }

  const [result] = await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found.' });

  res.json({ message: `Status changed to ${status}.` });
});

// DELETE /api/events/:id  (registrations are removed too, thanks to ON DELETE CASCADE)
router.delete('/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found.' });

  res.json({ message: 'Event deleted.' });
});

// GET /api/events/:id/registrations  (admin: who signed up)
router.get('/:id/registrations', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, contact_number, created_at FROM registrations WHERE event_id = ? ORDER BY created_at DESC, id DESC',
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/events/:id/register
router.post('/:id/register', async (req, res) => {
  const { errors, clean } = validateRegistration(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }

  const eventId = req.params.id;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // FOR UPDATE locks this event row until we finish. Without it, two people
    // clicking "Register" at the same moment could both grab the last seat.
    const [events] = await conn.query('SELECT * FROM events WHERE id = ? FOR UPDATE', [eventId]);
    const event = events[0];

    if (!event) throw new HttpError(404, 'Event not found.');
    if (event.status === 'Completed') {
      throw new HttpError(400, 'This event has finished, so registration is closed.');
    }

    const [duplicates] = await conn.query(
      'SELECT id FROM registrations WHERE event_id = ? AND email = ?',
      [eventId, clean.email]
    );
    if (duplicates.length > 0) {
      throw new HttpError(409, 'This email is already registered for this event.');
    }

    const [[{ taken }]] = await conn.query(
      'SELECT COUNT(*) AS taken FROM registrations WHERE event_id = ?',
      [eventId]
    );
    if (taken >= event.total_seats) {
      throw new HttpError(409, 'Sorry, this event is full. No seats are left.');
    }

    await conn.query(
      'INSERT INTO registrations (event_id, full_name, email, contact_number) VALUES (?, ?, ?, ?)',
      [eventId, clean.full_name, clean.email, clean.contact_number]
    );
    await conn.commit();

    res.status(201).json({
      message: `You're registered for ${event.title}!`,
      available_seats: event.total_seats - taken - 1,
    });
  } catch (err) {
    await conn.rollback();
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = router;
