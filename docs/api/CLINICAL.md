# Clinical API

Base URL: `/api/v1/clinical`

## Endpoints

### GET /patients/{patient_id}

Get patient details (Doctor/Admin only).

**Input:**
Path param `patient_id`

**Output:**

```json
{
  "id": "...",
  "name": "John Doe",
  "email": "...",
  "date_of_birth": "...",
  "medical_history": [],
  "allergies": []
}
```

### POST /notes

Create a clinical note (Doctor only).

**Input:**

```json
{
  "patient_id": "...",
  "visit_date": "2023-01-01",
  "symptoms": "...",
  "diagnosis": "...",
  "treatment_plan": "...",
  "is_private": false
}
```

**Output:**

```json
{
  "id": "note_id",
  ...
}
```

### GET /notes/{patient_id}

Get clinical notes for a patient.

**Input:**
Path param `patient_id`

**Output:**

```json
[
  {
    "id": "...",
    "doctor_name": "Dr. Smith",
    "diagnosis": "...",
    "created_at": "..."
  }
]
```

### POST /prescriptions

Create a prescription (Doctor only).

**Input:**

```json
{
  "patient_id": "...",
  "medications": [
    {
      "name": "Drug A",
      "dosage": "10mg",
      "frequency": "Daily",
      "duration": "7 days"
    }
  ],
  "notes": "Take with food"
}
```

**Output:**

```json
{
  "id": "rx_id",
  ...
}
```

### GET /prescriptions/{patient_id}

Get prescriptions for a patient.

**Input:**
Path param `patient_id`

**Output:**

```json
[
  {
    "id": "...",
    "medications": [...],
    "issued_at": "..."
  }
]
```
