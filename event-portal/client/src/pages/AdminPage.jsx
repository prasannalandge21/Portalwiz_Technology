import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, CalendarDays, Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../api.js';
import { STATUSES, formatDate, formatTime } from '../utils.js';
import EventForm from '../components/EventForm.jsx';
import EventImage from '../components/EventImage.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import Notice from '../components/Notice.jsx';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null); // { type, text }

  // Which popup is open?
  const [formEvent, setFormEvent] = useState(undefined); // undefined = closed, null = adding, object = editing
  const [deleting, setDeleting] = useState(null); // the event waiting for delete confirmation
  const [viewing, setViewing] = useState(null); // the event whose registrations we are looking at
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Admin dashboard | Seatly';
    loadAll();
  }, []);

  // Fetch the summary numbers and the event list together
  async function loadAll() {
    try {
      const [statsData, eventsData] = await Promise.all([api.getStats(), api.getEvents({ sort: 'asc' })]);
      setStats(statsData);
      setEvents(eventsData);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Called by the form. If the API fails, the error goes back to the form so it can show it.
  async function saveEvent(values) {
    if (formEvent) {
      await api.updateEvent(formEvent.id, values);
      setNotice({ type: 'success', text: 'Event updated.' });
    } else {
      await api.createEvent(values);
      setNotice({ type: 'success', text: 'Event created.' });
    }
    setFormEvent(undefined);
    loadAll();
  }

  async function changeStatus(event, status) {
    try {
      await api.updateStatus(event.id, status);
      setNotice({ type: 'success', text: `"${event.title}" is now ${status}.` });
      loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  async function confirmDelete() {
    try {
      await api.deleteEvent(deleting.id);
      setNotice({ type: 'success', text: `"${deleting.title}" was deleted.` });
      loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
    setDeleting(null);
  }

  async function openRegistrations(event) {
    setViewing(event);
    setRegistrations([]);
    setRegsLoading(true);
    try {
      setRegistrations(await api.getRegistrations(event.id));
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
      setViewing(null);
    } finally {
      setRegsLoading(false);
    }
  }

  if (loading) {
    return <div className="container page-pad"><Loader text="Loading dashboard..." /></div>;
  }

  const cards = stats
    ? [
        { label: 'Total events', value: stats.totalEvents, icon: CalendarDays, tone: 'cobalt' },
        { label: 'Upcoming events', value: stats.upcomingEvents, icon: CalendarClock, tone: 'sun' },
        { label: 'Total registrations', value: stats.totalRegistrations, icon: Users, tone: 'mint' },
        { label: 'Completed events', value: stats.completedEvents, icon: CalendarCheck, tone: 'grey' },
      ]
    : [];

  return (
    <div className="container page-pad">
      <div className="page-header">
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted">Create events, track registrations and keep statuses up to date.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormEvent(null)}>
          <Plus size={18} /> Add event
        </button>
      </div>

      {loadError && <Notice type="error">{loadError}</Notice>}
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <section className="stats-grid" aria-label="Summary">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="stat-card">
            <span className={`stat-icon tone-${tone}`}><Icon size={22} /></span>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="table-card">
        {events.length === 0 ? (
          <div className="empty-state flat">
            <h2>No events yet</h2>
            <p>Add your first event and it will appear on the public events page.</p>
            <button type="button" className="btn btn-primary" onClick={() => setFormEvent(null)}>
              <Plus size={18} /> Add event
            </button>
          </div>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date and time</th>
                <th>Registrations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td data-label="Event">
                    <div className="event-cell">
                      <EventImage src={event.image_url} alt="" className="thumb" />
                      <div>
                        <strong>{event.title}</strong>
                        <span className="muted">{event.category}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Date and time">
                    {formatDate(event.event_date)}
                    <span className="muted block">{formatTime(event.event_time)}</span>
                  </td>
                  <td data-label="Registrations">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => openRegistrations(event)}
                      title="See who registered"
                    >
                      {event.registered_count} of {event.total_seats} seats
                    </button>
                  </td>
                  <td data-label="Status">
                    <select
                      className={`status-select status-${event.status.toLowerCase()}`}
                      value={event.status}
                      onChange={(e) => changeStatus(event, e.target.value)}
                      aria-label={`Status for ${event.title}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <Link to={`/events/${event.id}`} className="icon-button" title="View event page" aria-label={`View ${event.title}`}>
                        <Eye size={18} />
                      </Link>
                      <button type="button" className="icon-button" title="Edit event" aria-label={`Edit ${event.title}`} onClick={() => setFormEvent(event)}>
                        <Pencil size={18} />
                      </button>
                      <button type="button" className="icon-button danger" title="Delete event" aria-label={`Delete ${event.title}`} onClick={() => setDeleting(event)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Add / edit popup */}
      {formEvent !== undefined && (
        <Modal title={formEvent ? 'Edit event' : 'Add a new event'} onClose={() => setFormEvent(undefined)} wide>
          <EventForm event={formEvent} onSubmit={saveEvent} onCancel={() => setFormEvent(undefined)} />
        </Modal>
      )}

      {/* Delete confirmation popup */}
      {deleting && (
        <Modal title="Delete this event?" onClose={() => setDeleting(null)}>
          <p>
            You are about to delete <strong>{deleting.title}</strong>
            {deleting.registered_count > 0 && ` and its ${deleting.registered_count} registrations`}.
            This can't be undone.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>Keep event</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete event</button>
          </div>
        </Modal>
      )}

      {/* Registrations popup */}
      {viewing && (
        <Modal title={`Registrations: ${viewing.title}`} onClose={() => setViewing(null)} wide>
          {regsLoading && <Loader text="Loading registrations..." />}
          {!regsLoading && registrations.length === 0 && (
            <p className="muted">Nobody has registered for this event yet.</p>
          )}
          {!regsLoading && registrations.length > 0 && (
            <ul className="reg-list">
              {registrations.map((person) => (
                <li key={person.id}>
                  <strong>{person.full_name}</strong>
                  <span>{person.email}</span>
                  <span>{person.contact_number}</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
