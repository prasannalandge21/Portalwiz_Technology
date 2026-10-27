import { NavLink, Link } from 'react-router-dom';
import { Ticket, CalendarDays, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="Seatly home">
          <span className="brand-mark"><Ticket size={20} /></span>
          Seatly
        </Link>

        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>
            <CalendarDays size={18} />
            <span>Events</span>
          </NavLink>
          <NavLink to="/admin">
            <LayoutDashboard size={18} />
            <span>Admin</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
