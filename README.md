# Doctor Booking API

This project is a Node.js + Express backend for managing a clinic schedule and doctor appointments. It includes role-based authentication, a single-clinic configuration, recurring doctor availability, temporary unavailability windows, slot generation, and appointment booking with duplicate-slot protection.

## Overview

The application exposes both admin-only management endpoints and public/user endpoints:

- Admin users manage the clinic configuration, doctors, recurring availability, and unavailability windows.
- Public users can list active doctors and query slot availability for a date.
- Authenticated users can create and fetch their own appointments.
- The API uses PostgreSQL with Sequelize ORM and JWT-based authentication.

## Features

- JWT-based authentication with ADMIN and USER roles
- Admin clinic creation and updates with IANA timezone validation
- Doctor creation, update, and active/inactive state management
- Weekly recurring doctor availability with configurable slot length
- Doctor unavailability entries with BREAK, LEAVE, and OTHER types
- Clinic-timezone-aware slot generation for each doctor/day
- Appointment booking with duplicate-slot protection
- Request validation and rate limiting for auth, booking, and sensitive admin mutations
- Centralized error handling for validation and record conflicts

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT (jsonwebtoken)
- Luxon for timezone-aware date handling
- Express Validator
- Express Rate Limit
- Jest + Supertest
- swagger-ui-express

## Project Structure

- src/app.js — Express app setup and route mounting
- src/server.js — server startup and DB authentication
- src/config/ — environment and database configuration
- src/controllers/ — HTTP request handlers
- src/services/ — business logic and timezone/booking rules
- src/routes/ — route definitions
- src/validators/ — request validation rules
- src/middleware/ — auth, role checks, validation, rate limiting, error handling
- src/models/ — Sequelize models
- migrations/ — PostgreSQL schema migrations
- seeders/ — seed scripts
- tests/ — integration tests for auth, clinic/doctor, availability, and slot booking

## PostgreSQL / Database Setup

This project requires PostgreSQL and uses Sequelize with the database configuration from src/config/database.js and config/config.js.

1. Create a PostgreSQL database:

   ```sql
   CREATE DATABASE doctor_booking;
   ```

2. Ensure the database user has access to the database.
3. Update your .env file with the correct host, port, database name, username, and password.

The model and schema logic expects the following tables to exist:

- users
- clinics
- doctors
- doctor_availabilities
- doctor_unavailabilities
- appointments

## Environment Configuration

Copy .env.example to .env and fill in the values before running the server.

The current .env.example contains:

```env
NODE_ENV=development

PORT=5000

FRONTEND_ORIGINS=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=doctor_booking
DB_USER=postgres
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=1d
```

Important notes:

- NODE_ENV defaults to development if omitted.
- PORT defaults to 5000 if omitted.
- FRONTEND_ORIGINS is a comma-separated list of allowed origins for CORS.
- JWT_SECRET must be set or authentication will fail.
- DB_PASSWORD must match your local PostgreSQL password.
- clinic.timezone is validated as an IANA timezone like Asia/Kolkata or Europe/London.

## Installation and Initial Setup

From the project root:

```bash
npm install
cp .env.example .env
# update .env with your local PostgreSQL and JWT values
```

Then run the database migrations:

```bash
npx sequelize-cli db:migrate --config config/config.js --migrations-path migrations
```

Seed the default admin user:

```bash
npx sequelize-cli db:seed:all --config config/config.js --seeders-path seeders
```

The seeded admin user is:

- Email: admin@example.com
- Password: the value of `ADMIN_PASSWORD` supplied when running the seeder

For local or deployment seeding, set `ADMIN_PASSWORD` in the environment before running the seeder. The seeder does not contain a default password.

## Migration and Seeder Commands

The project includes migration files under migrations/ and a single seeder under seeders/001-create-admin-user.js.

Common commands from the project root:

```bash
npx sequelize-cli db:migrate --config config/config.js --migrations-path migrations
npx sequelize-cli db:migrate:undo --config config/config.js --migrations-path migrations
npx sequelize-cli db:seed:all --config config/config.js --seeders-path seeders
npx sequelize-cli db:seed:undo:all --config config/config.js --seeders-path seeders
```

## Render Deployment

Configure the service with:

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Set `NODE_ENV=production`, `PORT` if required by the platform, `API_BASE_URL` to the public API URL, `FRONTEND_ORIGINS` to the deployed frontend origin, all `DB_*` variables for the production PostgreSQL database, and a strong `JWT_SECRET`.

Run migrations before starting the service:

```bash
npx sequelize-cli db:migrate --config config/config.js --migrations-path migrations
```

If an initial admin is required, set `ADMIN_PASSWORD` securely for the migration command environment and run:

```bash
npx sequelize-cli db:seed:all --config config/config.js --seeders-path seeders
```

The server listens on `0.0.0.0` using `PORT`, which defaults to `5000` when omitted. Swagger is available at `/api-docs` and uses `API_BASE_URL` for its server URL, falling back to the local port when that variable is omitted.

## Run and Test Commands

The scripts defined in package.json are:

```bash
npm run dev
npm start
npm test
npm run lint
```

Descriptions:

- npm run dev — runs the app with nodemon via src/server.js
- npm start — runs the app in production mode via src/server.js
- npm test — runs the Jest suite in-band
- npm run lint — runs ESLint across the project

## Roles and Access Control

The API supports two user roles:

- ADMIN
- USER

Role enforcement is handled by the middleware in src/middleware/auth.middleware.js and src/middleware/role.middleware.js.

- ADMIN can manage clinic and doctor administration, plus recurring availability and unavailability.
- USER can register, login, view their own profile, and book appointments.

The JWT payload includes:

```json
{
  "sub": "<user-uuid>",
  "role": "ADMIN"
}
```

Authentication is required via:

```http
Authorization: Bearer <token>
```

## Authentication Flow

### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123"
}
```

- Email is normalized to lowercase.
- Password must be at least 8 characters and include lowercase, uppercase, and number.
- New users are created as USER by default.
- Returns 201 on success.

### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "jane@example.com",
  "password": "Password@123"
}
```

Successful response includes a JWT token plus the serialized user object.

### Current User

```http
GET /api/auth/me
```

Requires valid Bearer token. Returns the currently authenticated user.

## Clinic Configuration and Timezone Handling

The project enforces a single clinic record. The clinic object includes:

```json
{
  "id": "uuid",
  "name": "Main Clinic",
  "timezone": "Asia/Kolkata"
}
```

Admin endpoints:

```http
POST /api/admin/clinic
GET /api/admin/clinic
PUT /api/admin/clinic
```

Rules enforced by code:

- Only one clinic can exist at a time.
- timezone must be a valid IANA timezone.
- The clinic timezone is used to interpret local scheduling inputs.
- DoctorUnavailability and appointment startAt values are accepted as local clinic datetimes without timezone offsets and converted to UTC internally.

The timezone logic is implemented in src/services/availability.service.js and src/services/slot.service.js using Luxon.

## Doctor Management

### Public endpoints

```http
GET /api/doctors
GET /api/doctors/:id
```

- Lists only doctors with isActive: true.
- Returns a serialized doctor object.
- A deactivated doctor cannot be fetched by public route.

### Admin endpoints

```http
POST /api/admin/doctors
PUT /api/admin/doctors/:id
```

Required fields for creation:

```json
{
  "name": "Dr. Alex Lee",
  "specialization": "Cardiology",
  "email": "alex@example.com",
  "phone": "+919876543210"
}
```

Update supports partial changes, including is_active.

Doctor email must be unique; duplicate email returns 409.

## Doctor Availability and Unavailability

### Recurring availability

Admin endpoints:

```http
POST /api/admin/doctors/:doctorId/availability
GET /api/admin/doctors/:doctorId/availability
PUT /api/admin/doctors/:doctorId/availability/:availabilityId
DELETE /api/admin/doctors/:doctorId/availability/:availabilityId
```

The payload for creating recurring availability is:

```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "13:00",
  "slotDurationMinutes": 30
}
```

Rules:

- dayOfWeek is an integer from 0 to 6, where 0 = Sunday and 6 = Saturday.
- startTime and endTime must be valid HH:mm values.
- startTime must be before endTime.
- slotDurationMinutes must be a positive integer.
- The interval must divide evenly into slot-sized chunks.
- Overlapping availability windows for the same doctor and day are rejected.

### Unavailability windows

Admin endpoints:

```http
POST /api/admin/doctors/:doctorId/unavailability
GET /api/admin/doctors/:doctorId/unavailability
PUT /api/admin/doctors/:doctorId/unavailability/:unavailabilityId
DELETE /api/admin/doctors/:doctorId/unavailability/:unavailabilityId
```

Payload example:

```json
{
  "type": "BREAK",
  "startAt": "2026-09-20T13:00:00",
  "endAt": "2026-09-20T14:00:00",
  "reason": "Lunch Break"
}
```

Allowed unavailability types:

- BREAK
- LEAVE
- OTHER

The API expects local clinic datetimes without an offset, converts them to UTC for storage, and rejects overlapping windows.

## Slot Generation

Public endpoint:

```http
GET /api/doctors/:doctorId/slots?date=YYYY-MM-DD
```

Example:

```http
GET /api/doctors/3f0a.../slots?date=2026-09-20
```

Behavior:

- Looks up the clinic timezone and the doctor.
- Maps the requested date to the correct weekday on that clinic schedule.
- Generates recurring slots from all matching availability windows.
- Excludes slots in the past.
- Excludes slots overlapping doctor unavailability windows.
- Excludes slots already booked for that doctor on that date.

Response shape:

```json
{
  "success": true,
  "message": "Available slots fetched successfully",
  "data": {
    "doctor": {
      "id": "uuid",
      "name": "Dr. Alex Lee",
      "specialization": "Cardiology"
    },
    "date": "2026-09-20",
    "timezone": "Asia/Kolkata",
    "slots": [
      {
        "startAt": "2026-09-20T09:00:00.000+05:30",
        "endAt": "2026-09-20T09:30:00.000+05:30"
      }
    ]
  }
}
```

## Appointment Booking

User endpoint:

```http
POST /api/appointments
GET /api/appointments
GET /api/appointments/:id
```

Requires a valid user token.

Create appointment request:

```json
{
  "doctorId": "<doctor-uuid>",
  "startAt": "2026-09-20T09:00:00"
}
```

- startAt must be a valid local clinic datetime string without offset.
- The appointment booking logic verifies the exact slot is still available in the relevant clinic-local date.
- If the slot is not in the generated availability set or already booked, the API returns 409.
- Successful response includes the appointment ID, doctor metadata, and ISO startAt/endAt values.

## Double-Booking and Concurrency Protection

The project uses both application-level checks and database-level protection:

- getAvailableSlots() filters out already booked slots for the selected doctor/day.
- bookAppointment() runs inside a Sequelize transaction.
- The database migration creates a unique index on appointments for (doctor_id, start_at).
- If a duplicate request arrives concurrently, the app catches the unique constraint violation and returns:

```http
409 Conflict
```

with the message:

```json
{
  "success": false,
  "message": "Selected appointment slot is no longer available."
}
```

This prevents two users from booking the same doctor slot at the same exact time.

## Health Check

```http
GET /api/health
```

Returns a basic service status response:

```json
{
  "success": true,
  "message": "Doctor Booking API is running"
}
```

## Swagger URL and Usage

Swagger UI is available at:

```text
http://localhost:5000/api-docs
```

The OpenAPI definition documents the implemented health, auth, clinic, doctor, availability, unavailability, slot, and appointment endpoints.

To test protected endpoints in Swagger UI:

1. Call `POST /api/auth/login` and copy the returned JWT.
2. Select **Authorize** in Swagger UI.
3. Enter the token in the bearer authentication field. Swagger UI adds the `Bearer` prefix automatically.
4. Use the protected endpoints according to the required role: `ADMIN` for clinic, doctor, availability, and unavailability administration; `USER` for appointment operations.

## Notes

- The OpenAPI definition is maintained in src/config/swagger.js.
- The app uses rate limiting for authentication, booking, and sensitive mutation routes.
- Validation errors return 400 with a Validation failed payload and field-level messages.
- Unauthenticated requests return 401.
- Insufficient role privileges return 403.

