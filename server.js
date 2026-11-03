const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataDirectory = path.join(__dirname, "data");

fs.mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(path.join(dataDirectory, "sports-availability.sqlite"));
database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY,
    confirmation_code TEXT NOT NULL UNIQUE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS reservations_equipment_schedule
    ON reservations (equipment_id, start_at, end_at);
`);

const equipmentCount = database.prepare("SELECT COUNT(*) AS count FROM equipment").get().count;
if (equipmentCount === 0) {
  const insertEquipment = database.prepare(`
    INSERT INTO equipment (name, category, description, total_quantity)
    VALUES (?, ?, ?, ?)
  `);
  const starterEquipment = [
    ["Football", "Field sports", "Standard size 5 footballs for practice and matches.", 8],
    ["Basketball", "Court sports", "Indoor and outdoor basketballs.", 6],
    ["Volleyball", "Court sports", "Volleyballs for training and friendly games.", 6],
    ["Badminton racket", "Racquet sports", "Student-use badminton rackets.", 10],
    ["Badminton shuttlecock set", "Racquet sports", "A set of shuttlecocks for a practice session.", 8],
    ["Cricket bat", "Field sports", "Practice cricket bats in a range of sizes.", 4],
    ["Cricket ball", "Field sports", "Practice cricket balls.", 6],
    ["Table tennis paddle", "Indoor sports", "Table tennis paddles for recreational play.", 8]
  ];

  for (const item of starterEquipment) {
    insertEquipment.run(...item);
  }
}

app.use(express.json({ limit: "10kb" }));

function parseSchedule(input) {
  const { date, time } = input;
  const durationMinutes = Number(input.duration_minutes);
  const timezoneOffsetMinutes = Number(input.timezone_offset_minutes);

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    return { error: "Choose a valid date and start time." };
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return { error: "Choose a valid date." };
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240) {
    return { error: "Reservation duration must be between 30 and 240 minutes." };
  }

  if (!Number.isInteger(timezoneOffsetMinutes) || timezoneOffsetMinutes < -720 || timezoneOffsetMinutes > 840) {
    return { error: "The time zone information is invalid. Refresh the page and try again." };
  }

  const startTimestamp = Date.parse(`${date}T${time}:00.000Z`) + timezoneOffsetMinutes * 60_000;
  const startAt = new Date(startTimestamp);
  const endAt = new Date(startTimestamp + durationMinutes * 60_000);

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString()
  };
}

function findEquipment(schedule) {
  if (!schedule) {
    return database.prepare(`
      SELECT id, name, category, description, total_quantity,
             total_quantity AS available_quantity
      FROM equipment
      ORDER BY category, name
    `).all();
  }

  return database.prepare(`
    SELECT e.id, e.name, e.category, e.description, e.total_quantity,
           e.total_quantity - COUNT(r.id) AS available_quantity
    FROM equipment AS e
    LEFT JOIN reservations AS r
      ON r.equipment_id = e.id
      AND r.start_at < ?
      AND r.end_at > ?
    GROUP BY e.id
    ORDER BY e.category, e.name
  `).all(schedule.endAt, schedule.startAt);
}

app.get("/api/equipment", (request, response) => {
  const hasSchedule = ["date", "time", "duration_minutes", "timezone_offset_minutes"]
    .some((key) => request.query[key] !== undefined);

  if (!hasSchedule) {
    return response.json({ equipment: findEquipment(null) });
  }

  const schedule = parseSchedule(request.query);
  if (schedule.error) {
    return response.status(400).json({ error: schedule.error });
  }

  return response.json({ equipment: findEquipment(schedule) });
});

// Add this route to your existing server.js file
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Fetch user profile matching the given email address
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    // 2. Perform credential match check
    // Note: For production systems, always use a hashing algorithm like bcrypt.
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password credential' });
    }

    // Sign in successful! Return authentication confirmation payload
    res.json({ success: true, message: 'Logged in successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
