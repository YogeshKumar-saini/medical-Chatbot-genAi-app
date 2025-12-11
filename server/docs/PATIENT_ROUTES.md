# Patient Routes Documentation
*Patient access - Requires PATIENT role*

## Overview
Patient routes provide healthcare consumers with tools to manage their care, including finding doctors, booking appointments, accessing medical records, and communicating with healthcare providers. These routes are restricted to users with PATIENT role.

---

## POST /api/v1/onboarding/patient/profile

### Purpose
Create patient profile with personal and medical information.

### Why This Endpoint Exists
- Collects essential patient information for care
- Supports personalized healthcare delivery
- Enables patient identification and verification
- Creates foundation for medical record keeping

### Input JSON Format
```json
{
  "date_of_birth": "1990-05-15",
  "gender": "MALE",
  "phone": "+1234567890",
  "address": "123 Patient Street, Apt 4B, City, State 12345",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+0987654321",
  "medical_history": "No significant medical history. Occasional migraines.",
  "organization_id": "507f1f77bcf86cd799439011"
}
```

### Input Field Details
- `date_of_birth` (string, required): Patient's birth date (YYYY-MM-DD)
- `gender` (string, required): "MALE", "FEMALE", or "OTHER"
- `phone` (string, required): Contact phone number
- `address` (string, optional): Full residential address
- `emergency_contact_name` (string, required): Emergency contact person
- `emergency_contact_phone` (string, required): Emergency contact number
- `medical_history` (string, optional): Relevant medical background
- `organization_id` (string, optional): Healthcare organization to join

### Profile Creation Process
1. Validate patient information
2. Create patient profile record
3. If organization specified, create membership request
4. Set profile as onboarded
5. Auto-add to organization group if approved

### Output JSON Format
```json
{
  "user_id": "507f1f77bcf86cd799439012",
  "date_of_birth": "1990-05-15",
  "gender": "MALE",
  "phone": "+1234567890",
  "org_approval_status": "PENDING",
  "is_onboarded": true,
  "created_at": 1640995200.0
}
```

### Organization Membership
- If `organization_id` provided, patient requests membership
- Requires ORG_ADMIN approval for full access
- Organization membership affects doctor discoverability

---

## GET /api/v1/onboarding/organizations/{org_id}/doctors

### Purpose
View approved doctors available in the patient's organization.

### Why This Endpoint Exists
- Enables patients to find healthcare providers
- Supports informed doctor selection
- Shows doctor credentials and specializations
- Facilitates doctor-patient matching

### Input Parameters
- **URL Parameter**: `org_id` (string, required) - Organization ID

### Output JSON Format
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Dr. Sarah Johnson",
    "specialization": "Psychiatry"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Dr. Michael Chen",
    "specialization": "Psychology"
  }
]
```

### Doctor Information
- Doctor's full name
- Medical specialization
- Unique identifier for connection requests

### Organization Context
- Only shows doctors approved by the organization
- Doctors must have active organization membership
- Supports organization-specific care standards

---

## POST /api/v1/onboarding/links/request

### Purpose
Request to connect with a specific doctor for care.

### Why This Endpoint Exists
- Initiates doctor-patient relationship
- Enables patients to choose preferred providers
- Supports care continuity and personalization
- Creates foundation for appointments and communication

### Input JSON Format
```json
{
  "doctor_id": "507f1f77bcf86cd799439011",
  "organization_id": "507f1f77bcf86cd799439012"
}
```

### Input Field Details
- `doctor_id` (string, required): Doctor's user ID
- `organization_id` (string, required): Organization context

### Connection Process
1. Validate doctor exists and is approved
2. Check for existing connection requests
3. Create pending link request
4. Notify doctor of new request
5. Update patient's link status

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439013",
  "doctor_id": "507f1f77bcf86cd799439011",
  "patient_id": "507f1f77bcf86cd799439014",
  "organization_id": "507f1f77bcf86cd799439012",
  "status": "PENDING",
  "created_at": 1640995200.0
}
```

### Connection States
- `PENDING`: Awaiting doctor approval
- `APPROVED`: Active care relationship
- `REJECTED`: Connection denied

---

## POST /api/v1/appointments

### Purpose
Book an appointment with an approved doctor.

### Why This Endpoint Exists
- Enables patients to schedule healthcare visits
- Supports appointment management workflow
- Facilitates timely medical care access
- Creates structured care interactions

### Input JSON Format
```json
{
  "slot_id": "507f1f77bcf86cd799439011",
  "reason": "Initial consultation for anxiety symptoms",
  "notes": "Experiencing increased anxiety and sleep difficulties"
}
```

### Input Field Details
- `slot_id` (string, required): Available appointment slot ID
- `reason` (string, required): Reason for appointment
- `notes` (string, optional): Additional context or symptoms

### Booking Process
1. Validate slot availability
2. Check doctor-patient relationship
3. Reserve appointment slot
4. Send confirmation notifications
5. Update appointment status

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439012",
  "patient_id": "507f1f77bcf86cd799439013",
  "doctor_id": "507f1f77bcf86cd799439014",
  "slot_id": "507f1f77bcf86cd799439011",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "status": "SCHEDULED",
  "reason": "Initial consultation for anxiety symptoms",
  "created_at": 1640995200.0
}
```

### Appointment Requirements
- Active doctor-patient relationship required
- Slot must be available and not expired
- One appointment per slot
- Future-dated appointments only

---

## GET /api/v1/appointments

### Purpose
View patient's upcoming and past appointments.

### Why This Endpoint Exists
- Provides appointment schedule overview
- Enables appointment management
- Supports care coordination
- Facilitates appointment reminders

### Input Parameters
- **Query Parameter**: `role=PATIENT` (required for patients)

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
    "doctor_name": "Dr. Sarah Johnson",
    "specialization": "Psychiatry"
  }
]
```

### Appointment Status Values
- `SCHEDULED`: Upcoming appointment
- `COMPLETED`: Finished appointment
- `CANCELLED`: Cancelled appointment

### Included Information
- Doctor name and specialization
- Appointment timing and status
- Reason for visit
- Appointment management options

---

## GET /api/v1/appointments/{appointment_id}/join

### Purpose
Get secure link to join video appointment.

### Why This Endpoint Exists
- Enables telemedicine consultations
- Provides secure video communication
- Supports remote healthcare delivery
- Facilitates appointment attendance

### Input Parameters
- **URL Parameter**: `appointment_id` (string, required) - Appointment ID

### Access Requirements
- Appointment must be SCHEDULED
- Must be within 15 minutes of start time
- Patient must own the appointment
- Doctor-patient relationship must be active

### Output JSON Format
```json
{
  "meeting_url": "https://meet.mymanah.com/room/abc123def",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "appointment_details": {
    "id": "507f1f77bcf86cd799439011",
    "start_time": "2024-01-15T10:00:00Z",
    "doctor_name": "Dr. Sarah Johnson",
    "reason": "Follow-up consultation"
  }
}
```

### Meeting Integration
- Uses LiveKit for video conferencing
- Temporary access tokens
- Secure room-based communication
- Recording capabilities for documentation

---

## GET /api/v1/appointments/{appointment_id}/prescriptions

### Purpose
View prescriptions written during completed appointments.

### Why This Endpoint Exists
- Provides access to medication information
- Supports medication management
- Enables pharmacy coordination
- Facilitates treatment adherence

### Input Parameters
- **URL Parameter**: `appointment_id` (string, required) - Completed appointment ID

### Access Requirements
- Appointment must be COMPLETED
- Patient must own the appointment
- Prescription must exist for the appointment

### Output JSON Format
```json
[
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
    "instructions": "Monitor for side effects. Follow up in 2 weeks.",
    "prescribed_by": "Dr. Sarah Johnson",
    "prescribed_at": 1640995200.0,
    "pharmacy_info": {
      "can_transmit": true,
      "preferred_pharmacies": ["CVS", "Walgreens"]
    }
  }
]
```

### Prescription Features
- Complete medication details
- Doctor identification
- Prescription timestamp
- Pharmacy transmission status
- Refill information (future feature)

---

## Patient Care Journey

### Initial Onboarding
1. **Account Creation**: Register with email and role
2. **Profile Setup**: Provide personal and medical information
3. **Organization Join**: Request membership in healthcare organization
4. **Approval Wait**: Await ORG_ADMIN approval

### Doctor Connection
1. **Doctor Discovery**: Browse available doctors in organization
2. **Connection Request**: Send request to preferred doctor
3. **Approval Wait**: Await doctor approval for care relationship
4. **Relationship Established**: Can now book appointments

### Care Management
1. **Appointment Booking**: Schedule visits with approved doctors
2. **Virtual Visits**: Join video appointments securely
3. **Prescription Access**: View medications and instructions
4. **Follow-up Care**: Schedule additional appointments

### Communication
1. **Group Access**: Join doctor-created groups for communication
2. **Secure Messaging**: Communicate with healthcare team
3. **File Sharing**: Access shared medical documents
4. **Notifications**: Receive appointment reminders

---

## Privacy and Security

### Data Protection
- All patient data encrypted at rest and in transit
- HIPAA-compliant data handling
- Access logging for all data interactions
- Patient-controlled data sharing

### Consent Management
- Explicit consent for treatment relationships
- Granular permission controls
- Right to withdraw consent
- Data usage transparency

### Medical Privacy
- Doctor-patient confidentiality maintained
- Secure communication channels
- Protected health information standards
- Audit trails for all access

---

## Patient Rights and Access

### Information Access
- Complete medical records access
- Appointment history and notes
- Prescription records and history
- Test results and reports (future)

### Communication Rights
- Direct doctor communication
- Appointment scheduling freedom
- Care team coordination
- Second opinion requests

### Data Control
- Data portability options
- Account deletion rights
- Consent withdrawal capability
- Privacy preference management

---

## Error Handling

### Common Error Responses
- `403 Forbidden`: Not a patient or wrong appointment
- `404 Not Found`: Appointment, doctor, or prescription not found
- `400 Bad Request`: Invalid appointment time or missing data
- `409 Conflict`: Appointment slot no longer available

### Validation Errors
- Appointments must be with approved doctors
- Future-dated appointments only
- Complete required profile information
- Valid organization membership

### Rate Limiting
- Appointment booking: 10 per hour
- Status updates: 50 per hour
- Document access: 100 per hour

---

## Integration Points

### Telemedicine Platform
- LiveKit integration for video calls
- Secure room-based consultations
- Recording for medical documentation
- Multi-device support

### Pharmacy Networks
- Electronic prescription transmission
- Pharmacy finder and selection
- Medication history integration
- Refill request automation

### Health Records
- Personal health record access
- Medical history consolidation
- Test result integration
- Care summary generation

### Notification Systems
- Appointment reminders
- Prescription ready alerts
- Doctor message notifications
- Health tip delivery
