const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'event_portal';

const connectionSettings = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const pool = mysql.createPool({
  ...connectionSettings,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

function dateFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;

function sampleEvents() {
  return [
    ['Full Stack Web Development Bootcamp', 'Workshop', 'A hands-on day building a small app with React, Node.js and MySQL. Bring your laptop and we will go from an empty folder to a deployed project.', dateFromToday(5), '10:00', 'Innovation Lab, Koregaon Park, Pune', photo('photo-1498050108023-c5249f4df085'), 40, 'Upcoming'],
    ['AI in Everyday Business', 'Technology', 'Practical ways small teams are using AI tools for support, reporting and planning, with live demos and time for questions.', dateFromToday(9), '11:30', 'Hall A, Hinjewadi Phase 1, Pune', photo('photo-1485827404703-89b55fcc595e'), 120, 'Upcoming'],
    ['Cloud & DevOps Meetup', 'Technology', 'Lightning talks on CI/CD, containers and keeping costs under control. Small room, so seats go fast.', dateFromToday(12), '18:00', 'Tech Hub, Baner, Pune', photo('photo-1551288049-bebda4e38f71'), 5, 'Upcoming'],
    ['UI/UX Design Sprint', 'Design', 'Work in small teams to take a real product problem from sketch to clickable prototype in one afternoon.', dateFromToday(15), '14:00', 'Studio 9, Viman Nagar, Pune', photo('photo-1561070791-2526d30994b5'), 30, 'Upcoming'],
    ['Startup Pitch Night', 'Business', 'Ten early-stage founders pitch to a panel of investors. Stay after for networking and chai.', dateFromToday(18), '17:30', 'The Foundry, Kalyani Nagar, Pune', photo('photo-1556761175-5973dc0f32e7'), 80, 'Upcoming'],
    ['Data Analytics with Power BI', 'Workshop', 'Learn to clean data, build a dashboard and tell a clear story with it. Beginners are welcome.', dateFromToday(22), '10:30', 'Computer Lab 3, MIT-WPU, Kothrud, Pune', photo('photo-1517245386807-bb43f82c33c4'), 35, 'Upcoming'],
    ['Product Design Portfolio Review', 'Design', 'Get honest, friendly feedback on your portfolio from working designers. Bring three projects you are proud of.', dateFromToday(27), '15:00', 'Design Loft, Aundh, Pune', photo('photo-1522202176988-66273c2fd55f'), 25, 'Upcoming'],
    ['Python for Data Engineering', 'Technology', 'A live session on building ETL pipelines with Python and Pandas. Happening right now, so walk in if there are seats left.', dateFromToday(0), '09:30', 'Seminar Hall, Shivajinagar, Pune', photo('photo-1540575467063-178a50c2df87'), 60, 'Ongoing'],
    ['Intro to Git & GitHub', 'Workshop', 'Branches, pull requests and merge conflicts explained without the jargon. This session has already finished.', dateFromToday(-10), '11:00', 'Room 204, Deccan, Pune', photo('photo-1515187029135-18ee286d815b'), 50, 'Completed'],
  ];
}

const sampleNames = [
  ['Aarav Sharma', 'aarav.sharma@example.com', '9876543210'],
  ['Diya Patil', 'diya.patil@example.com', '9822012345'],
  ['Rohan Kulkarni', 'rohan.k@example.com', '9890011223'],
  ['Sneha Joshi', 'sneha.joshi@example.com', '9765432109'],
  ['Kabir Mehta', 'kabir.mehta@example.com', '9988776655'],
];

async function seedIfEmpty(conn) {
  const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM events');
  if (total > 0) return;

  const ids = [];
  for (const event of sampleEvents()) {
    const [result] = await conn.query(
      `INSERT INTO events
        (title, category, description, event_date, event_time, venue, image_url, total_seats, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event
    );
    ids.push(result.insertId);
  }

  const plan = [
    [ids[0], 3],
    [ids[1], 2],
    [ids[2], 5],
    [ids[7], 4],
    [ids[8], 5],
  ];
  for (const [eventId, count] of plan) {
    for (const person of sampleNames.slice(0, count)) {
      await conn.query(
        'INSERT INTO registrations (event_id, full_name, email, contact_number) VALUES (?, ?, ?, ?)',
        [eventId, ...person]
      );
    }
  }
  console.log('Added sample events and registrations.');
}

async function initDb() {
  const conn = await mysql.createConnection({ ...connectionSettings, multipleStatements: true });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await conn.query(`USE \`${dbName}\``);
    await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    await seedIfEmpty(conn);
  } finally {
    await conn.end();
  }
}

module.exports = { pool, initDb };
