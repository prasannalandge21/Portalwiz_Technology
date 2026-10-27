
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Could not reach the server. Please check that the backend is running.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.errors = data.errors; // field-by-field messages, when the server sends them
    throw error;
  }
  return data;
}

export const api = {
  getEvents(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return request(`/events?${params.toString()}`);
  },
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (values) => request('/events', { method: 'POST', body: JSON.stringify(values) }),
  updateEvent: (id, values) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(values) }),
  updateStatus: (id, status) => request(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  getRegistrations: (id) => request(`/events/${id}/registrations`),
  register: (id, values) => request(`/events/${id}/register`, { method: 'POST', body: JSON.stringify(values) }),
  getStats: () => request('/stats'),
};
