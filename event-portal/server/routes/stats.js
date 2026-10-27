const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// Numbers for the four cards on the admin dashboard
router.get('/', async (req, res) => {
  const [[row]] = await pool.query(`
    SELECT
      COUNT(*)                                   AS totalEvents,
      COALESCE(SUM(status = 'Upcoming'), 0)      AS upcomingEvents,
      COALESCE(SUM(status = 'Completed'), 0)     AS completedEvents,
      (SELECT COUNT(*) FROM registrations)       AS totalRegistrations
    FROM events
  `);

  res.json({
    totalEvents: Number(row.totalEvents),
    upcomingEvents: Number(row.upcomingEvents),
    totalRegistrations: Number(row.totalRegistrations),
    completedEvents: Number(row.completedEvents),
  });
});

module.exports = router;
