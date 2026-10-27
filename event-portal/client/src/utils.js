export const CATEGORIES = ['Technology', 'Business', 'Design', 'Workshop'];
export const STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

// "2026-11-05" -> "Thu, 5 Nov 2026"
export function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// "2026-11-05" -> { day: "5", month: "Nov" } for the little date badge on cards
export function dateBadge(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
  };
}

// "18:00:00" -> "6:00 PM"
export function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function seatsText(event) {
  if (event.available_seats === 0) return 'Event full';
  if (event.available_seats === 1) return '1 seat left';
  return `${event.available_seats} seats left`;
}

// Same rules as the server, so people get instant feedback before anything is sent.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[0-9]{10,15}$/;

export function validateRegistration(values) {
  const errors = {};
  const name = values.full_name.trim();
  const email = values.email.trim();
  const phone = values.contact_number.replace(/[\s-]/g, '');

  if (!name) errors.full_name = 'Full name is required.';
  else if (name.length < 2) errors.full_name = 'Please enter your full name.';

  if (!email) errors.email = 'Email address is required.';
  else if (!emailPattern.test(email)) errors.email = 'Please enter a valid email address.';

  if (!phone) errors.contact_number = 'Contact number is required.';
  else if (!phonePattern.test(phone)) errors.contact_number = 'Enter a valid number (10 to 15 digits).';

  return errors;
}

export function validateEventForm(values) {
  const errors = {};
  const seats = Number(values.total_seats);

  if (values.title.trim().length < 3) errors.title = 'Title must be at least 3 characters.';
  if (!values.category) errors.category = 'Please pick a category.';
  if (!values.description.trim()) errors.description = 'Please add a short description.';
  if (!values.event_date) errors.event_date = 'Please choose a date.';
  if (!values.event_time) errors.event_time = 'Please choose a time.';
  if (!values.venue.trim()) errors.venue = 'Venue is required.';
  if (!Number.isInteger(seats) || seats < 1 || seats > 10000) {
    errors.total_seats = 'Seats must be a whole number between 1 and 10000.';
  }
  if (values.image_url.trim() && !/^https?:\/\//i.test(values.image_url.trim())) {
    errors.image_url = 'Image link must start with http:// or https://';
  }
  return errors;
}
