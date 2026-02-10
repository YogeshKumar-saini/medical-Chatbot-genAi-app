# Therapist/Doctor Routes Documentation
*Medical professional access - Requires THERAPIST or DOCTOR role*

## Overview
Therapist/Doctor routes provide healthcare professionals with tools to manage their practice, including patient relationships, appointments, and medical documentation. These routes are restricted to users with THERAPIST or DOCTOR roles.

---

## POST /api/v1/onboarding/doctor/profile

### Purpose
Create or update a doctor's professional profile with credentials and specialization.

### Why This Endpoint Exists
- Establishes doctor credentials in the system
- Enables patient discovery and matching
- Supports professional verification
- Creates foundation for doctor-patient relationships

### Input JSON Format
```json
{
  "specialization": "Psychiatry",
  "license_number": "PSY123456",
  "years_of_experience": 8,
  "bio": "Experienced psychiatrist specializing in mental health treatment with over 8 years of practice.",
  "clinic_name": "Mental Health Clinic",
  "clinic_address": "123 Medical Drive, Suite 100, City, State 12345",
  "organization_id": "507f1f77bcf86cd799439011"
}
```

### Input Field Details
- `specialization` (string, required): Medical specialty (Psychiatry, Psychology, Counseling, etc.)
- `license_number` (string, required): Professional license number
- `years_of_experience` (integer, required): Years in practice
- `bio` (string, required): Professional biography for patients
- `clinic_name` (string, optional): Practice/clinic name
- `clinic_address` (string, optional): Full clinic address
- `organization_id` (string, optional): Organization to join

### Profile Creation Process
1. Validate professional credentials
2. Create doctor profile record
3. If organization specified, create join request
4. Auto-create therapist group for team communication
5. Set profile as onboarded

### Output JSON Format
```json
{
  "user_id": "507f1f77bcf86cd799439012",
  "specialization": "Psychiatry",
  "license_number": "PSY123456",
  "years_of_experience": 8,
  "org_request_status": "PENDING",
  "is_onboarded": true,
  "created_at": 1640995200.0
}
```

### Organization Integration
- If `organization_id` provided, doctor requests to join organization
- Requires ORG_ADMIN approval to practice in organization
- Organization membership affects patient discoverability

---

## GET /api/v1/onboarding/doctor/links

### Purpose
View all patient link requests received by the doctor.

### Why This Endpoint Exists
- Shows patients seeking to connect with doctor
- Enables doctor to manage patient relationships
- Supports patient intake and approval process
- Maintains doctor-patient relationship oversight

### Output JSON Format
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "doctor_id": "507f1f77bcf86cd799439012",
    "patient_id": "507f1f77bcf86cd799439013",
    "organization_id": "507f1f77bcf86cd799439014",
    "status": "PENDING",
    "created_at": 1640995200.0,
    "patient_name": "John Doe"
  },
  {
    "id": "507f1f77bcf86cd799439015",
    "doctor_id": "507f1f77bcf86cd799439012",
    "patient_id": "507f1f77bcf86cd799439016",
    "organization_id": "507f1f77bcf86cd799439014",
    "status": "APPROVED",
    "created_at": 1640995100.0,
    "patient_name": "Jane Smith"
  }
]
```

### Link Status Values
- `PENDING`: Patient requested connection, awaiting approval
- `APPROVED`: Active doctor-patient relationship
- `REJECTED`: Connection request denied

### Patient Information
- Patient name for context
- Organization context
- Request timestamp
- Current relationship status

---

## PUT /api/v1/onboarding/links/{link_id}/status

### Purpose
Approve or reject patient connection requests.

### Why This Endpoint Exists
- Controls doctor-patient relationship establishment
- Enables selective patient acceptance
- Supports practice capacity management
- Maintains professional relationship standards

### Input Parameters
- **URL Parameter**: `link_id` (string, required) - Link request ID
- **Query Parameter**: `status=APPROVED` or `status=REJECTED`

### Input Format
```
PUT /api/v1/onboarding/links/507f1f77bcf86cd799439011/status?status=APPROVED
```

### Approval Process
1. Validate link belongs to requesting doctor
2. Update link status
3. If approved, add patient to therapist group
4. Update patient's doctor_link_status
5. Enable appointment booking if approved

### Output JSON Format
```json
{
  "message": "Status updated"
}
```

### Group Integration
- Approved patients automatically join therapist's group
- Enables secure communication and file sharing
- Supports collaborative care if multiple providers

---

## POST /api/v1/appointments/slots

### Purpose
Create available time slots for patient appointments.

### Why This Endpoint Exists
- Enables appointment scheduling system
- Allows doctors to manage their availability
- Supports practice capacity planning
- Facilitates patient appointment booking

### Input JSON Format
```json
{
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "is_available": true
}
```

### Input Field Details
- `start_time` (string, required): ISO 8601 datetime, appointment start
- `end_time` (string, required): ISO 8601 datetime, appointment end
- `is_available` (boolean, required): Whether slot can be booked

### Time Slot Validation
- End time must be after start time
- Minimum 15-minute appointments
- Maximum 4-hour appointments
- Cannot create slots in the past

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "doctor_id": "507f1f77bcf86cd799439012",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "is_available": true,
  "created_at": 1640995200.0
}
```

### Slot Management
- Doctors can create multiple slots at once
- Slots can be marked unavailable for breaks/holidays
- Existing slots can be updated or deleted

---

## GET /api/v1/appointments

### Purpose
Retrieve doctor's appointments with filtering options.

### Why This Endpoint Exists
- Provides appointment schedule overview
- Supports appointment management workflow
- Enables upcoming/past appointment tracking
- Facilitates practice administration

### Input Parameters
- **Query Parameter**: `role=THERAPIST` (required for doctors)

### Input Format
```
GET /api/v1/appointments?role=THERAPIST
```

### Output JSON Format
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "patient_id": "507f1f77bcf86cd799439012",
    "doctor_id": "507f1f77bcf86cd799439013",
    "slot_id": "507f1f77bcf86cd799439014",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T11:00:00Z",
    "status": "SCHEDULED",
    "reason": "Follow-up consultation",
    "notes": "Patient reports improved symptoms",
    "patient_name": "John Doe"
  }
]
```

### Appointment Status Values
- `SCHEDULED`: Upcoming appointment
- `COMPLETED`: Finished appointment
- `CANCELLED`: Cancelled appointment
- `NO_SHOW`: Patient didn't attend

### Included Information
- Patient name for context
- Appointment details and timing
- Current status and notes
- Reason for visit

---

## PUT /api/v1/appointments/{appointment_id}

### Purpose
Update appointment status and add clinical notes.

### Why This Endpoint Exists
- Records appointment outcomes
- Tracks treatment progress
- Supports clinical documentation
- Enables appointment lifecycle management

### Input Parameters
- **URL Parameter**: `appointment_id` (string, required) - Appointment ID
- **JSON Body**: Status and notes updates

### Input JSON Format
```json
{
  "status": "COMPLETED",
  "notes": "Patient showed significant improvement. Discussed medication adjustment."
}
```

### Updateable Fields
- `status`: Appointment status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- `notes`: Clinical notes and observations

### Output JSON Format
```json
{
  "message": "Appointment updated successfully"
}
```

### Clinical Documentation
- Notes are stored securely
- Accessible to authorized medical staff
- Support treatment planning and continuity
- Can be referenced in prescriptions

---

## POST /api/v1/appointments/{appointment_id}/prescribe

### Purpose
Create prescriptions for completed appointments.

### Why This Endpoint Exists
- Enables electronic prescription writing
- Supports medication management
- Creates prescription records for patients
- Facilitates pharmacy integration

### Input Parameters
- **URL Parameter**: `appointment_id` (string, required) - Completed appointment ID
- **JSON Body**: Prescription details

### Input JSON Format
```json
{
  "medications": [
    {
      "name": "Sertraline",
      "dosage": "50mg",
      "frequency": "once daily",
      "duration": "30 days",
      "instructions": "Take in the morning with food"
    },
    {
      "name": "Lorazepam",
      "dosage": "0.5mg",
      "frequency": "as needed",
      "duration": "7 days",
      "instructions": "Take up to 3 times daily for anxiety"
    }
  ],
  "instructions": "Monitor for side effects and follow up in 2 weeks"
}
```

### Medication Fields
- `name` (string, required): Medication name
- `dosage` (string, required): Strength/dosage
- `frequency` (string, required): How often to take
- `duration` (string, required): How long to take
- `instructions` (string, optional): Specific usage instructions

### Prescription Validation
- Only for COMPLETED appointments
- Requires active doctor-patient relationship
- Medications validated against formulary (future feature)
- Prescriptions digitally signed

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "appointment_id": "507f1f77bcf86cd799439012",
  "medications": [
    {
      "name": "Sertraline",
      "dosage": "50mg",
      "frequency": "once daily",
      "duration": "30 days",
      "instructions": "Take in the morning with food"
    }
  ],
  "instructions": "Monitor for side effects and follow up in 2 weeks",
  "prescribed_by": "507f1f77bcf86cd799439013",
  "prescribed_at": 1640995200.0
}
```

### Prescription Features
- Digital prescription record
- Patient access through portal
- Pharmacy transmission capability
- Refill tracking and management

---

## Medical Practice Workflow

### Doctor Onboarding
1. **Profile Creation**: Set up professional credentials
2. **Organization Join**: Request organization membership
3. **Verification**: Await ORG_ADMIN approval
4. **Patient Connections**: Accept/reject patient requests
5. **Practice Setup**: Create appointment availability

### Patient Management
1. **Review Requests**: Check incoming patient connection requests
2. **Accept Patients**: Approve appropriate patient relationships
3. **Schedule Management**: Create and manage appointment slots
4. **Clinical Care**: Conduct appointments and document care
5. **Prescription Writing**: Create medication prescriptions

### Appointment Lifecycle
1. **Create Slots**: Set up available appointment times
2. **Patient Booking**: Patients book available slots
3. **Appointment**: Conduct video/text consultation
4. **Documentation**: Record clinical notes and outcomes
5. **Prescription**: Write prescriptions if needed
6. **Follow-up**: Schedule next appointments

---

## Security and Compliance

### HIPAA Compliance
- Patient data encrypted at rest and in transit
- Access logging for all patient interactions
- Role-based access controls
- Data retention policies

### Medical Licensing
- License number verification (future feature)
- Specialization validation
- Continuing education tracking (future feature)
- Professional credential management

### Patient Privacy
- Doctor-patient privilege maintained
- Consent-based data sharing
- Right to access medical records
- Data deletion capabilities

---

## Error Handling

### Common Error Responses
- `403 Forbidden`: Not a doctor/therapist or wrong patient
- `404 Not Found`: Appointment, patient, or prescription not found
- `400 Bad Request`: Invalid appointment time, medication data
- `409 Conflict`: Appointment slot already booked

### Validation Errors
- Appointment times must be in the future
- End time must be after start time
- Prescriptions only for completed appointments
- Patients must have active doctor relationship

### Rate Limiting
- Appointment slot creation: 100 per hour
- Prescription writing: 50 per hour
- Status updates: 200 per hour

---

## Integration Points

### Video Conferencing
- Appointment links generate meeting URLs
- Integrated with video platform (LiveKit)
- Recording capabilities for documentation
- Secure patient-provider communication

### Pharmacy Systems
- Electronic prescription transmission
- Pharmacy lookup and selection
- Refill request processing
- Medication history integration

### Medical Records
- Integration with EHR systems (future)
- Lab result incorporation
- Medical history access
- Care coordination support
