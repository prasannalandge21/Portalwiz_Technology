-- Tables for the Event & Workshop Management Portal.
-- The server runs this file automatically on start, so you don't have to import it by hand.

CREATE TABLE IF NOT EXISTS events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(150) NOT NULL,
  category     VARCHAR(30)  NOT NULL,
  description  TEXT         NOT NULL,
  event_date   DATE         NOT NULL,
  event_time   TIME         NOT NULL,
  venue        VARCHAR(200) NOT NULL,
  image_url    VARCHAR(500),
  total_seats  INT          NOT NULL,
  status       ENUM('Upcoming', 'Ongoing', 'Completed') NOT NULL DEFAULT 'Upcoming',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  event_id        INT          NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  contact_number  VARCHAR(20)  NOT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  -- the same email can only register once for a given event
  UNIQUE KEY one_email_per_event (event_id, email),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
