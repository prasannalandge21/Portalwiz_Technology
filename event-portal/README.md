# Seatly: Event & Workshop Management Portal

A responsive web app where visitors can browse upcoming events and register for a seat,
and an admin can create, edit, delete and monitor events from a dashboard.

Built for the Portalwiz Technologies intern assignment (full stack version).

## Tech stack

| Layer | Used |
| --- | --- |
| Front end | React 18 (Vite), React Router, plain CSS, lucide-react icons |
| Back end | Node.js + Express 5 (REST API) |
| Database | MySQL (`mysql2`) |

## What's included

**Module A, public events page** (`/`)
- Event cards with image, title, category, date, time, venue and seats left
- Search by name, category filters, and sort by date (soonest or latest first)
- "View details" on every card
- Empty state when nothing matches, with a "Clear filters" button

**Module B, event details and registration** (`/events/:id`)
- Form with Full Name, Email, Contact Number and an Event dropdown
- Validation for required fields, email format and contact number (checked in the browser and again on the server)
- Duplicate registrations (same email, same event) are rejected
- Seats update right after registering, and registering for a full event is blocked
- Clear success and error messages

**Module C, admin dashboard** (`/admin`)
- Summary cards: Total Events, Upcoming Events, Total Registrations, Completed Events
- Create, view, edit and delete events (delete asks for confirmation)
- Registration count per event, and a popup listing who registered
- Change status to Upcoming, Ongoing or Completed straight from the table
- All data comes from the database through the API, nothing is hardcoded in the UI

**Module D, UI/UX**
- Same fonts, colours, spacing and button styles on every page
- Works on desktop, tablet and mobile (the admin table turns into stacked cards on phones)
- Loading, empty, success and error states throughout
- Icons from lucide-react and event photos (with a placeholder if an image link is broken)

## How to run it

You need **Node.js 18+** and **MySQL** running on your computer.

### 1. Get the code and set up the backend

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `server/.env` and put in your MySQL username and password:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=event_portal
```

Start the server:

```bash
npm start
```

On the first run the server creates the `event_portal` database, creates the tables
(from `server/schema.sql`) and adds a few sample events so the app isn't empty.
You should see `API running at http://localhost:5000`.

### 2. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. The admin dashboard is at **/admin** (there's a link in the top bar).

## API

| Method | Route | What it does |
| --- | --- | --- |
| GET | `/api/events` | List events. Query: `search`, `category`, `sort` (asc/desc), `scope=public` |
| GET | `/api/events/:id` | One event |
| POST | `/api/events` | Create an event |
| PUT | `/api/events/:id` | Edit an event |
| PATCH | `/api/events/:id/status` | Change status |
| DELETE | `/api/events/:id` | Delete an event (and its registrations) |
| GET | `/api/events/:id/registrations` | Who registered |
| POST | `/api/events/:id/register` | Register for an event |
| GET | `/api/stats` | Numbers for the dashboard cards |

## Project structure

```
event-portal/
├── server/
│   ├── index.js          # starts Express
│   ├── db.js             # MySQL connection, setup and sample data
│   ├── schema.sql        # the two tables
│   ├── validators.js     # validation rules
│   └── routes/
│       ├── events.js     # events + registration
│       └── stats.js      # dashboard numbers
└── client/
    └── src/
        ├── pages/        # EventsPage, EventDetailsPage, AdminPage
        ├── components/   # EventCard, EventForm, Modal, Notice, ...
        ├── api.js        # all fetch calls in one place
        ├── utils.js      # date formatting + form validation
        └── styles.css
```

## Decisions worth explaining

- **Seats are never stored as a number that can drift.** Available seats = total seats minus the
  number of rows in `registrations`, calculated each time.
- **Last seat safety.** Registration runs inside a transaction that locks the event row
  (`SELECT ... FOR UPDATE`), so two people can't both take the last seat.
- **Duplicates** are checked in code and also blocked by a unique key on `(event_id, email)` in the database.
- **Completed events** are hidden from the public page and can't take registrations, but the admin still sees them.
- **Seats can't be lowered** below the number of people already registered.
- **Emails are saved in lowercase**, so `Asha@x.com` and `asha@x.com` count as the same person.
- **No admin login.** The assignment doesn't ask for one, so `/admin` is open. Adding login (for example JWT) would be the next step.
