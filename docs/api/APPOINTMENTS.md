# Appointments API

Base URL: `/api/v1/appointments`

## Endpoints

### POST /

Book a new appointment (Patient only).

**Input:**

```json
{
  "doctor_id": "doctor_id",
  "start_time": "2023-01-01T10:00:00Z",
  "end_time": "2023-01-01T10:30:00Z",
  "reason": "Checkup"
}
```

**Output:**

```json
{
  "id": "appt_id",
  "status": "PENDING",
  ...
}
```

### GET /

List appointments.

**Input:**
Header `Authorization: Bearer <token>`

**Output:**

```json
[
  {
    "id": "appt_id",
    "doctor_id": "...",
    "patient_id": "...",
    "start_time": "...",
    "status": "CONFIRMED"
  }
]
```

### PUT /{appointment_id}

Update appointment (Doctor) or Cancel (Patient).

**Input:**

```json
{
  "status": "CONFIRMED",
  "meeting_link": "http://..."
}
```

**Output:**

```json
{
  "id": "appt_id",
  ...update_fields
}
```

### GET /{appointment_id}/join

Get video call token (LiveKit).

**Input:**
Path param `appointment_id`

**Output:**

```json
{
  "token": "jwt_token..."
}
```

### POST /slots

Create availability slots (Doctor only).

**Input:**

```json
{
  "start_time": "...",
  "end_time": "..."
}
```

**Output:**

```json
{
  "id": "slot_id",
  "message": "Slot created"
}
```

### GET /slots

Get available slots.

**Input:**
Query param `doctor_id` (optional)

**Output:**

```json
[
  {
    "id": "slot_id",
    "start_time": "...",
    "is_booked": false
  }
]
```
