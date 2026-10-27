import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventDetailsPage from './pages/EventDetailsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function NotFound() {
  return (
    <div className="container page-pad">
      <div className="empty-state">
        <h2>We couldn't find that page</h2>
        <p>The link may be wrong or the page may have moved.</p>
        <Link to="/" className="btn btn-primary">Back to events</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container">Seatly, an Event &amp; Workshop Management Portal</div>
      </footer>
    </>
  );
}
