import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import EventImage from './EventImage.jsx';
import { dateBadge, formatDate, formatTime, seatsText } from '../utils.js';

export default function EventCard({ event }) {
  const badge = dateBadge(event.event_date);
  const isFull = event.available_seats === 0;

  return (
    <article className="event-card">
      <div className="event-card-media">
        <EventImage src={event.image_url} alt={event.title} />
        <span className="date-chip">
          <strong>{badge.day}</strong>
          {badge.month}
        </span>
        <span className="category-badge">{event.category}</span>
        {event.status === 'Ongoing' && <span className="live-badge">Happening now</span>}
      </div>

      <div className="event-card-body">
        <h3>{event.title}</h3>
        <ul className="meta-list">
          <li><CalendarDays size={16} />{formatDate(event.event_date)}</li>
          <li><Clock size={16} />{formatTime(event.event_time)}</li>
          <li><MapPin size={16} />{event.venue}</li>
        </ul>
      </div>

      {/* the dashed line with notches is the "ticket tear" */}
      <div className="ticket-tear" aria-hidden="true" />

      <div className="event-card-footer">
        <span className={`seats ${isFull ? 'seats-full' : ''}`}>
          <Users size={16} />
          {seatsText(event)}
        </span>
        <Link to={`/events/${event.id}`} className="btn btn-primary btn-small">View details</Link>
      </div>
    </article>
  );
}
