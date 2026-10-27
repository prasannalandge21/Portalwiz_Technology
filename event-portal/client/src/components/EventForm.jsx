import { useState } from 'react';
import { CATEGORIES, STATUSES, validateEventForm } from '../utils.js';
import Notice from './Notice.jsx';

const emptyForm = {
  title: '',
  category: CATEGORIES[0],
  description: '',
  event_date: '',
  event_time: '',
  venue: '',
  image_url: '',
  total_seats: '50',
  status: 'Upcoming',
};

// One label + input + error message
function Field({ label, error, className = '', children }) {
  return (
    <div className={`field ${className}`}>
      <label>
        <span>{label}</span>
        {children}
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// Used for both "Add event" (event is null) and "Edit event"
export default function EventForm({ event, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    event
      ? {
          title: event.title,
          category: event.category,
          description: event.description,
          event_date: event.event_date,
          event_time: event.event_time.slice(0, 5), // "10:00:00" -> "10:00"
          venue: event.venue,
          image_url: event.image_url || '',
          total_seats: String(event.total_seats),
          status: event.status,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined })); // clear that field's error as they type
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const foundErrors = validateEventForm(values);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await onSubmit(values); // the parent closes the form when this succeeds
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  }

  const invalid = (name) => (errors[name] ? 'invalid' : '');

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <Notice type="error">{formError}</Notice>}

      <div className="form-grid">
        <Field label="Event title" error={errors.title} className="full">
          <input name="title" value={values.title} onChange={handleChange} className={invalid('title')} placeholder="e.g. React Workshop for Beginners" />
        </Field>

        <Field label="Category" error={errors.category}>
          <select name="category" value={values.category} onChange={handleChange} className={invalid('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Status" error={errors.status}>
          <select name="status" value={values.status} onChange={handleChange}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Date" error={errors.event_date}>
          <input type="date" name="event_date" value={values.event_date} onChange={handleChange} className={invalid('event_date')} />
        </Field>

        <Field label="Time" error={errors.event_time}>
          <input type="time" name="event_time" value={values.event_time} onChange={handleChange} className={invalid('event_time')} />
        </Field>

        <Field label="Venue" error={errors.venue}>
          <input name="venue" value={values.venue} onChange={handleChange} className={invalid('venue')} placeholder="Hall name, area, city" />
        </Field>

        <Field label="Total seats" error={errors.total_seats}>
          <input type="number" min="1" name="total_seats" value={values.total_seats} onChange={handleChange} className={invalid('total_seats')} />
        </Field>

        <Field label="Image link (optional)" error={errors.image_url} className="full">
          <input name="image_url" value={values.image_url} onChange={handleChange} className={invalid('image_url')} placeholder="https://..." />
        </Field>

        <Field label="Description" error={errors.description} className="full">
          <textarea name="description" rows="4" value={values.description} onChange={handleChange} className={invalid('description')} placeholder="What will people learn or do at this event?" />
        </Field>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : event ? 'Save changes' : 'Create event'}
        </button>
      </div>
    </form>
  );
}
