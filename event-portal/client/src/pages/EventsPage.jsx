import { useEffect, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { api } from '../api.js';
import { CATEGORIES } from '../utils.js';
import EventCard from '../components/EventCard.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Seatly | Events & Workshops';
  }, []);

  // Fetch again whenever the search, category or sort changes.
  // The short timeout waits until the person stops typing, so we don't call the API on every letter.
  useEffect(() => {
    let ignore = false; // protects us from an older, slower response arriving late
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await api.getEvents({ scope: 'public', search, category, sort });
        if (ignore) return;
        setEvents(data);
        setError('');
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, category, sort]);

  function clearFilters() {
    setSearch('');
    setCategory('All');
  }

  const filtersActive = search !== '' || category !== 'All';

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Find a seat at your next event</h1>
          <p>Workshops, talks and meetups happening near you. Pick one, register in a minute, and show up.</p>
        </div>
      </section>

      <div className="container">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search events by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events by name"
            />
          </label>

          <div className="chips" role="group" aria-label="Filter by category">
            {['All', ...CATEGORIES].map((name) => (
              <button
                key={name}
                type="button"
                className={`chip ${category === name ? 'active' : ''}`}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <label className="sort-box">
            <span>Sort by date</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="asc">Soonest first</option>
              <option value="desc">Latest first</option>
            </select>
          </label>
        </div>

        <section className="results" aria-live="polite">
          {error && <Notice type="error">{error}</Notice>}

          {loading && <Loader text="Finding events..." />}

          {!loading && !error && events.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon"><SearchX size={28} /></span>
              <h2>{filtersActive ? 'No events match your search' : 'No events yet'}</h2>
              <p>
                {filtersActive
                  ? 'Try a different name, or clear the filters to see everything.'
                  : 'New events will show up here as soon as they are added.'}
              </p>
              {filtersActive && (
                <button type="button" className="btn btn-primary" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          )}

          {!loading && events.length > 0 && (
            <>
              <p className="result-count">
                {events.length} {events.length === 1 ? 'event' : 'events'} found
              </p>
              <div className="event-grid">
                {events.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
