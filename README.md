# Campus Sports equipment reservations

A student-facing web app for checking sports equipment availability and making reservations.

## Features

- Browse seeded sports equipment and see how many units are available for a selected time.
- Reserve an item using a student name and email address.
- Prevent overlapping reservations from exceeding the available quantity.
- Store equipment and reservations in a local SQLite database.
- Receive a confirmation code after a successful reservation.

## Requirements

- Node.js 22.13 or newer (the app uses Node's built-in `node:sqlite` module).
- npm.

## Run locally

```powershell
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use a different port.

The database is created automatically at `data/sports-availability.sqlite` and starter equipment is inserted on first run. The database is excluded from Git.

## API

- `GET /api/equipment` — list equipment and total quantities.
- `GET /api/equipment?date=YYYY-MM-DD&time=HH:MM&duration_minutes=60&timezone_offset_minutes=0` — check quantity available for a time range. The timezone offset is supplied by the browser.
- `POST /api/reservations` — create a reservation. The JSON body requires `equipment_id`, `student_name`, `student_email`, `date`, `time`, `duration_minutes`, and `timezone_offset_minutes`.

This starter app does not include student accounts or an admin interface. Add institutional sign-in and permission controls before using it with real student data.
