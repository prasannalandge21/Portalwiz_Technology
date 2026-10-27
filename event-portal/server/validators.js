// Rules shared by the event routes. The React forms check the same things,
// but the server never trusts the browser, so we check again here.

const CATEGORIES = ['Technology', 'Business', 'Design', 'Workshop'];
const STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[0-9]{10,15}$/; // 10 to 15 digits, optional leading +
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;

// turns anything into a trimmed string so .length never crashes
const text = (value) => String(value ?? '').trim();

function validateEvent(body) {
  const errors = {};

  const clean = {
    title: text(body.title),
    category: text(body.category),
    description: text(body.description),
    event_date: text(body.event_date),
    event_time: text(body.event_time),
    venue: text(body.venue),
    image_url: text(body.image_url),
    total_seats: Number(body.total_seats),
    status: text(body.status) || 'Upcoming',
  };

  if (clean.title.length < 3) errors.title = 'Title must be at least 3 characters.';
  if (!CATEGORIES.includes(clean.category)) errors.category = 'Please pick a category.';
  if (!clean.description) errors.description = 'Please add a short description.';

  if (!datePattern.test(clean.event_date) || isNaN(new Date(clean.event_date))) {
    errors.event_date = 'Please choose a valid date.';
  }
  if (!timePattern.test(clean.event_time)) {
    errors.event_time = 'Please choose a valid time.';
  }
  if (!clean.venue) errors.venue = 'Venue is required.';

  if (!Number.isInteger(clean.total_seats) || clean.total_seats < 1 || clean.total_seats > 10000) {
    errors.total_seats = 'Seats must be a whole number between 1 and 10000.';
  }
  if (clean.image_url && !/^https?:\/\//i.test(clean.image_url)) {
    errors.image_url = 'Image link must start with http:// or https://';
  }
  if (!STATUSES.includes(clean.status)) errors.status = 'Invalid status.';

  return { errors, clean };
}

function validateRegistration(body) {
  const errors = {};

  const clean = {
    full_name: text(body.full_name),
    email: text(body.email).toLowerCase(),
    
    contact_number: text(body.contact_number).replace(/[\s-]/g, ''),
  };

  if (!clean.full_name) errors.full_name = 'Full name is required.';
  else if (clean.full_name.length < 2) errors.full_name = 'Please enter your full name.';

  if (!clean.email) errors.email = 'Email address is required.';
  else if (!emailPattern.test(clean.email)) errors.email = 'Please enter a valid email address.';

  if (!clean.contact_number) errors.contact_number = 'Contact number is required.';
  else if (!phonePattern.test(clean.contact_number)) {
    errors.contact_number = 'Enter a valid number (10 to 15 digits).';
  }

  return { errors, clean };
}

module.exports = { CATEGORIES, STATUSES, validateEvent, validateRegistration };
