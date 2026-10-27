import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Tag } from 'lucide-react';
import { api } from '../api.js';
import { formatDate, formatTime, validateRegistration } from '../utils.js';
import EventImage from '../components/EventImage.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';

const emptyForm = { full_name: '', email: '', contact_number: '' };

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [openEvents, setOpenEvents] = useState([]); // for the "Event" dropdown in the form
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }
  const [submitting, setSubmitting] = useState(false);

  // Load this event (and the list for the dropdown) whenever the id in the URL changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setLoadError('');
    setForm(emptyForm);
    setErrors({});
    setNotice(null);
    window.scrollTo(0, 0);

    Promise.all([api.getEvent(id), api.getEvents({ scope: 'public' })])
      .then(([eventData, listData]) => {
        if (ignore) return;
        setEvent(eventData);
        setOpenEvents(listData);
        document.title = `${eventData.title} | Seatly`;
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    const foundErrors = validateRegistration(form);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await api.register(event.id, form);
      // Update the seat count right away, no page refresh needed
      setEvent((current) => ({
        ...current,
        available_seats: result.available_seats,
        registered_count: current.registered_count + 1,
      }));
      setNotice({ type: 'success', text: `${result.message} We saved your seat.` });
      setForm(emptyForm);
    } catch (err) {
      setErrors(err.errors || {});
      setNotice({ type: 'error', text: err.message });
      // A 409 means a duplicate or a full event, so refresh the seat numbers
      if (err.status === 409) {
        api.getEvent(event.id).then(setEvent).catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container page-pad"><Loader text="Loading event..." /></div>;
  }

  if (loadError) {
    return (
      <div className="container page-pad">
        <Notice type="error">{loadError}</Notice>
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to all events</Link>
      </div>
    );
  }

  const isFull = event.available_seats === 0;
  const isCompleted = event.status === 'Completed';
  const formLocked = isFull || isCompleted;
  const seatsTaken = event.total_seats - event.available_seats;
  const percentTaken = Math.round((seatsTaken / event.total_seats) * 100);

  // make sure the current event is always in the dropdown, even if it's not in the public list
  const dropdownEvents = openEvents.some((e) => e.id === event.id) ? openEvents : [event, ...openEvents];

  const meterClass = isFull ? 'meter-full' : percentTaken >= 80 ? 'meter-low' : '';

  return (
    <div className="container page-pad">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to all events</Link>

      <div className="details-layout">
        <article className="details-main">
          <EventImage src={event.image_url} alt={event.title} className="details-image" />

          <div className="details-body">
            <div className="badge-row">
              <span className="badge badge-category">{event.category}</span>
              <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
            </div>

            <h1>{event.title}</h1>

            <ul className="info-grid">
              <li><CalendarDays size={20} /><div><small>Date</small>{formatDate(event.event_date)}</div></li>
              <li><Clock size={20} /><div><small>Time</small>{formatTime(event.event_time)}</div></li>
              <li><MapPin size={20} /><div><small>Venue</small>{event.venue}</div></li>
              <li><Tag size={20} /><div><small>Category</small>{event.category}</div></li>
            </ul>

            <h2>About this event</h2>
            <p className="description">{event.description}</p>
          </div>
        </article>

        <aside className="register-card">
          <h2>Register for this event</h2>

          <div className="seat-info">
            <div className="seat-numbers">
              <strong>{event.available_seats}</strong> of {event.total_seats} seats left
            </div>
            <div className={`meter ${meterClass}`} aria-hidden="true">
              <div className="meter-fill" style={{ width: `${percentTaken}%` }} />
            </div>
          </div>

          {isCompleted && <Notice type="info">This event has finished, so registration is closed.</Notice>}
          {isFull && !isCompleted && <Notice type="error">This event is full. Please look at our other events.</Notice>}
          {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>
                <span>Event</span>
                <select value={event.id} onChange={(e) => navigate(`/events/${e.target.value}`)}>
                  {dropdownEvents.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({formatDate(item.event_date)})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field">
              <label>
                <span>Full name</span>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className={errors.full_name ? 'invalid' : ''}
                  autoComplete="name"
                  disabled={formLocked}
                />
              </label>
              {errors.full_name && <p className="field-error">{errors.full_name}</p>}
            </div>

            <div className="field">
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? 'invalid' : ''}
                  autoComplete="email"
                  disabled={formLocked}
                />
              </label>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="field">
              <label>
                <span>Contact number</span>
                <input
                  type="tel"
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  className={errors.contact_number ? 'invalid' : ''}
                  autoComplete="tel"
                  placeholder="e.g. 98765 43210"
                  disabled={formLocked}
                />
              </label>
              {errors.contact_number && <p className="field-error">{errors.contact_number}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={formLocked || submitting}>
              {submitting ? 'Registering...' : isFull ? 'Event full' : isCompleted ? 'Registration closed' : 'Register now'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
