# API Documentation

This document covers the HTTP endpoints that are implemented in the current codebase. It reflects the real Express routes, validation middleware, auth requirements, and response patterns used by the app.

## Base URL

The app listens on the configured PORT (default 5000) and exposes all routes under /api or /api/admin.

Example base URL:

```text
http://localhost:5000
```

## Common Response Formats

Successful responses generally follow this shape:

```json
{
  "success": true,
  "message": "<human readable message>",
  "data": { ... }
}
```

Error responses generally follow this shape:

```json
{
  "success": false,
  "message": "<error message>"
}
```

Validation errors include another errors array with field-specific details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## Authentication and Roles

Authentication is JWT-based. Use:

```http
Authorization: Bearer <token>
```

The middleware validates that the JWT contains a valid sub and a role of either ADMIN or USER.

Role rules in the current code:

- ADMIN can access clinic, doctor, availability, and unavailability admin endpoints.
- USER can access user auth and appointment endpoints.
- If a route requires ADMIN and the caller is USER, the API returns 403.
- If no token is provided, the API returns 401.

## Health Check

### GET /api/health

- Authentication: none
- Description: Basic server health check
- Success response: 200

Example response:

```json
{
  "success": true,
  "message": "Doctor Booking API is running"
}
```

---

# Auth Endpoints

## POST /api/auth/register

- Authentication: none
- Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123"
}
```

- Validation:
  - name required, max 120
  - email must be a valid email, normalized lowercase
  - password must be at least 8 chars and include lower, upper, and number
- Success response: 201

Example success:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER"
  }
}
```

- Error responses:
  - 400 validation failed
  - 409 account already exists

## POST /api/auth/login

- Authentication: none
- Request body:

```json
{
  "email": "jane@example.com",
  "password": "Password@123"
}
```

- Validation:
  - email must be valid
  - password required
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER"
    }
  }
}
```

- Error responses:
  - 400 validation failed
  - 401 invalid email or password

## GET /api/auth/me

- Authentication: required (Bearer token)
- Role: any valid user (ADMIN or USER)
- Success response: 200

Example success:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER"
  }
}
```

- Error responses:
  - 401 if token missing or invalid
  - 404 if the authenticated user no longer exists

---

# Clinic Endpoints

## POST /api/admin/clinic

- Authentication: required
- Role: ADMIN
- Request body:

```json
{
  "name": "Main Clinic",
  "timezone": "Asia/Kolkata"
}
```

- Validation:
  - name required, max 160, non-blank
  - timezone required and must be a valid IANA timezone
- Success response: 201

Example success:

```json
{
  "success": true,
  "message": "Clinic created successfully",
  "data": {
    "id": "uuid",
    "name": "Main Clinic",
    "timezone": "Asia/Kolkata"
  }
}
```

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-admin
  - 409 clinic already exists

## GET /api/admin/clinic

- Authentication: required
- Role: ADMIN
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Clinic retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Main Clinic",
    "timezone": "Asia/Kolkata"
  }
}
```

- Error responses:
  - 401 unauthenticated
  - 403 non-admin
  - 404 clinic not found

## PUT /api/admin/clinic

- Authentication: required
- Role: ADMIN
- Request body:

```json
{
  "name": "Updated Main Clinic",
  "timezone": "Europe/London"
}
```

- Validation: same as create
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Clinic updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Main Clinic",
    "timezone": "Europe/London"
  }
}
```

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-admin
  - 404 clinic not found

---

# Doctor Endpoints

## GET /api/doctors

- Authentication: none
- Role: public
- Description: Lists active doctors only
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Dr. Alex Lee",
      "specialization": "Cardiology",
      "email": "alex@example.com",
      "phone": "+919876543210",
      "is_active": true
    }
  ]
}
```

- Error responses: none specific beyond server errors

## GET /api/doctors/:id

- Authentication: none
- Validation: id must be a valid UUID
- Description: Returns a single active doctor
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Dr. Alex Lee",
    "specialization": "Cardiology",
    "email": "alex@example.com",
    "phone": "+919876543210",
    "is_active": true
  }
}
```

- Error responses:
  - 400 invalid UUID
  - 404 doctor not found or inactive

## POST /api/admin/doctors

- Authentication: required
- Role: ADMIN
- Request body:

```json
{
  "name": "Dr. Alex Lee",
  "specialization": "Cardiology",
  "email": "alex@example.com",
  "phone": "+919876543210"
}
```

- Validation:
  - name required, specialization required, email valid
  - phone optional and must match a limited phone pattern
- Success response: 201

Example success:

```json
{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "id": "uuid",
    "name": "Dr. Alex Lee",
    "specialization": "Cardiology",
    "email": "alex@example.com",
    "phone": "+919876543210",
    "is_active": true
  }
}
```

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-admin
  - 409 duplicate doctor email

## PUT /api/admin/doctors/:id

- Authentication: required
- Role: ADMIN
- Path parameter:
  - id = doctor UUID
- Request body (partial updates allowed):

```json
{
  "specialization": "Neurology",
  "is_active": true
}
```

- Validation:
  - id must be a valid UUID
  - at least one of name, specialization, email, phone, is_active must be present
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctor updated successfully",
  "data": {
    "id": "uuid",
    "name": "Dr. Alex Lee",
    "specialization": "Neurology",
    "email": "alex@example.com",
    "phone": "+919876543210",
    "is_active": true
  }
}
```

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-admin
  - 404 doctor not found
  - 409 duplicate email if changing email to one already used

---

# Availability Endpoints

## POST /api/admin/doctors/:doctorId/availability

- Authentication: required
- Role: ADMIN
- Path parameter:
  - doctorId = doctor UUID
- Request body:

```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "13:00",
  "slotDurationMinutes": 30
}
```

- Validation:
  - dayOfWeek is 0..6
  - startTime/endTime must be HH:mm
  - slotDurationMinutes must be a positive integer
  - total availability period must divide evenly by slot size
- Success response: 201

Example success:

```json
{
  "success": true,
  "message": "Doctor availability created successfully",
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDurationMinutes": 30
  }
}
```

- Error responses:
  - 400 validation failed or invalid period
  - 401 unauthenticated
  - 403 non-admin
  - 404 doctor not found or inactive
  - 409 overlapping availability

## GET /api/admin/doctors/:doctorId/availability

- Authentication: required
- Role: ADMIN
- Path parameter:
  - doctorId = doctor UUID
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctor availability retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "13:00",
      "slotDurationMinutes": 30
    }
  ]
}
```

- Error responses:
  - 401 unauthenticated
  - 403 non-admin
  - 404 doctor not found

## PUT /api/admin/doctors/:doctorId/availability/:availabilityId

- Authentication: required
- Role: ADMIN
- Path parameters:
  - doctorId = doctor UUID
  - availabilityId = availability UUID
- Request body: partial updates allowed, any of dayOfWeek, startTime, endTime, slotDurationMinutes
- Success response: 200

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-admin
  - 404 availability record not found for that doctor
  - 409 overlap after update

## DELETE /api/admin/doctors/:doctorId/availability/:availabilityId

- Authentication: required
- Role: ADMIN
- Path parameters:
  - doctorId = doctor UUID
  - availabilityId = availability UUID
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctor availability deleted successfully"
}
```

- Error responses:
  - 401 unauthenticated
  - 403 non-admin
  - 404 availability not found

---

# Unavailability Endpoints

## POST /api/admin/doctors/:doctorId/unavailability

- Authentication: required
- Role: ADMIN
- Path parameter:
  - doctorId = doctor UUID
- Request body:

```json
{
  "type": "BREAK",
  "startAt": "2026-09-20T13:00:00",
  "endAt": "2026-09-20T14:00:00",
  "reason": "Lunch break"
}
```

- Validation:
  - type must be one of BREAK, LEAVE, OTHER
  - startAt and endAt must be ISO local date-time strings without timezone offset
  - endAt must be greater than startAt
- Success response: 201

Example success:

```json
{
  "success": true,
  "message": "Doctor unavailability created successfully",
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "type": "BREAK",
    "startAt": "2026-09-20T07:30:00.000Z",
    "endAt": "2026-09-20T08:30:00.000Z",
    "reason": "Lunch break"
  }
}
```

- Error responses:
  - 400 invalid type or date values
  - 401 unauthenticated
  - 403 non-admin
  - 404 doctor not found or inactive
  - 409 overlapping unavailability window

## GET /api/admin/doctors/:doctorId/unavailability

- Authentication: required
- Role: ADMIN
- Path parameter:
  - doctorId = doctor UUID
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctor unavailability retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "type": "BREAK",
      "startAt": "2026-09-20T07:30:00.000Z",
      "endAt": "2026-09-20T08:30:00.000Z",
      "reason": "Lunch break"
    }
  ]
}
```

- Error responses:
  - 401 unauthenticated
  - 403 non-admin
  - 404 doctor not found

## PUT /api/admin/doctors/:doctorId/unavailability/:unavailabilityId

- Authentication: required
- Role: ADMIN
- Path parameters:
  - doctorId = doctor UUID
  - unavailabilityId = unavailability UUID
- Request body: partial updates allowed for type, startAt, endAt, reason
- Success response: 200

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-admin
  - 404 record not found for that doctor
  - 409 overlap after update

## DELETE /api/admin/doctors/:doctorId/unavailability/:unavailabilityId

- Authentication: required
- Role: ADMIN
- Path parameters:
  - doctorId = doctor UUID
  - unavailabilityId = unavailability UUID
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Doctor unavailability deleted successfully"
}
```

- Error responses:
  - 401 unauthenticated
  - 403 non-admin
  - 404 unavailability not found

---

# Slot Endpoints

## GET /api/doctors/:doctorId/slots

- Authentication: none
- Validation:
  - doctorId must be a valid UUID
  - date must match YYYY-MM-DD
- Query parameter:
  - date required; example 2026-09-20
- Success response: 200

Example success:

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

- Error responses:
  - 400 validation failed (e.g. invalid date)
  - 404 doctor not found or inactive

Notes:

- Slots are generated using the clinic timezone and recurring availability windows.
- Past slots are excluded.
- Slots overlapping breaks or unavailability are excluded.
- Booked slots on that date are excluded.

---

# Appointment Endpoints

## POST /api/appointments

- Authentication: required
- Role: USER
- Request body:

```json
{
  "doctorId": "8a7f4d4c-0d50-4d2d-9abc-4c62de3c1e8b",
  "startAt": "2026-09-20T09:00:00"
}
```

- Validation:
  - doctorId must be a valid UUID
  - startAt must be an ISO local date-time without timezone offset
- Success response: 201

Example success:

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": "uuid",
    "doctor": {
      "id": "uuid",
      "name": "Dr. Alex Lee",
      "specialization": "Cardiology"
    },
    "startAt": "2026-09-20T03:30:00.000Z",
    "endAt": "2026-09-20T04:00:00.000Z",
    "status": "BOOKED"
  }
}
```

- Error responses:
  - 400 validation failed
  - 401 unauthenticated
  - 403 non-user role
  - 404 doctor not found
  - 409 selected slot no longer available

## GET /api/appointments

- Authentication: required
- Role: USER
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "doctor": {
        "id": "uuid",
        "name": "Dr. Alex Lee",
        "specialization": "Cardiology"
      },
      "startAt": "2026-09-20T03:30:00.000Z",
      "endAt": "2026-09-20T04:00:00.000Z",
      "status": "BOOKED"
    }
  ]
}
```

- Error responses:
  - 401 unauthenticated
  - 403 non-user role

## GET /api/appointments/:id

- Authentication: required
- Role: USER
- Path parameter:
  - id = appointment UUID
- Success response: 200

Example success:

```json
{
  "success": true,
  "message": "Appointment retrieved successfully",
  "data": {
    "id": "uuid",
    "doctor": {
      "id": "uuid",
      "name": "Dr. Alex Lee",
      "specialization": "Cardiology"
    },
    "startAt": "2026-09-20T03:30:00.000Z",
    "endAt": "2026-09-20T04:00:00.000Z",
    "status": "BOOKED"
  }
}
```

- Error responses:
  - 400 invalid UUID
  - 401 unauthenticated
  - 403 non-user role
  - 404 appointment not found for this user

---

# Booking Flow and Timezone Logic

The implemented booking flow is:

1. Admin creates a clinic with a valid IANA timezone.
2. Admin defines recurring doctor availability by weekday/time and slot size.
3. Admin can add unavailability windows such as breaks, leave, or other periods.
4. A client calls /api/doctors/:doctorId/slots?date=YYYY-MM-DD.
5. The slot generator resolves the clinic timezone, builds all candidate slots for the requested date, and removes:
   - expired slots
   - slots inside unavailability windows
   - slots already booked for the doctor on that date
6. The user selects a visible slot and calls POST /api/appointments with the clinic-local startAt value.
7. The server validates the requested slot against the same rules inside a Sequelize transaction.
8. If the slot is still valid, the appointment is created.
9. If two requests make the same booking at once, the unique (doctor_id, start_at) database constraint rejects the duplicate and the API responds with 409.

Timezone behavior in the current code:

- Clinic timezone is assumed to be the local scheduling zone.
- startAt values for unavailability and appointment booking are accepted as local clinic datetimes without offset.
- Those values are converted to UTC before storage.
- Slot responses are returned with timezone-aware ISO timestamps and retain the clinic zone in the response object.

This is handled with Luxon and Sequelize timestamps in UTC, with local-day calculations based on the clinic timezone.

---

# Concurrency and Duplicate Booking Protection

The database schema includes a unique index for appointments by doctor and exact start time:

```sql
appointments_unique_doctor_slot
```

The application also verifies the slot in a transaction before insert. This combination prevents duplicate booking of the same doctor/time slot even under concurrent requests.

When a duplicate attempt occurs, the API returns:

```json
{
  "success": false,
  "message": "Selected appointment slot is no longer available."
}
```

with HTTP status 409.

---

# Swagger

The project includes the swagger-ui-express dependency in package.json, but no Swagger route is mounted in the current application code. There is currently no active Swagger URL exposed by the app.

To use the API with the implemented code, use the route list in this document directly, or run the server and hit the HTTP endpoints described here.
