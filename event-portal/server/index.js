const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./db');
const eventRoutes = require('./routes/events');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventRoutes);
app.use('/api/stats', statsRoutes);

// anything under /api that we don't know about
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'That API route does not exist.' });
});

// Last stop for unexpected errors (Express 5 sends async errors here automatically)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not set up the database. Is MySQL running and is your .env correct?');
    console.error(err.message);
    process.exit(1);
  });
