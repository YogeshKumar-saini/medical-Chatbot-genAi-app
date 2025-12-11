# Medical AI Assistant API Routes Documentation

This document provides detailed information about all API endpoints organized by user role. Each endpoint includes input/output JSON formats and purpose.

## Table of Contents
- [Authentication Routes](#authentication-routes) - Available to all users
- [Super Admin Routes](#super-admin-routes)
- [Organization Admin Routes](#organization-admin-routes)
- [Therapist/Doctor Routes](#therapistdoctor-routes)
- [Patient Routes](#patient-routes)
- [General Admin Routes](#general-admin-routes)

---

## Authentication Routes
*Available to all users*

### POST /api/v1/auth/signup
**Purpose:** Register a new user account with email verification.

**Input JSON:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "PATIENT"
}
```

**Output JSON:**
```json
{
  "message": "User created successfully. Please verify your email.",
  "user_id": "507f1f77bcf86cd799439011"
}
```

### POST /api/v1/auth/login
**Purpose:** Authenticate user and return JWT token.

**Input JSON:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Output JSON:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "email": "user@example.com",
    "role": "PATIENT",
    "name": "John Doe",
    "id": "507f1f77bcf86cd799439011"
  }
}
```

### POST /api/v1/auth/verify-email
**Purpose:** Verify user email with OTP code.

**Input JSON:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Output JSON:**
```json
{
  "message": "Email verified successfully"
}
```

---

## Super Admin Routes
*Highest level administrative access*

### PUT /api/v1/onboarding/admin/organizations/{org_id}/verify
**Purpose:** Approve or reject organization registration requests.

**Input JSON:** Query parameter in URL
```
?verified=true
```

**Output JSON:**
```json
{
  "message": "Organization verified"
}
```

### GET /api/v1/admin/users
**Purpose:** Get paginated list of all users for system management.

**Input JSON:** Query parameters
```
?skip=0&limit=50&role=PATIENT&search=john
```

**Output JSON:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PATIENT",
    "is_active": true,
    "created_at": 1640995200.0
  }
]
```

### PUT /api/v1/admin/users/{user_id}/role
**Purpose:** Change a user's role in the system.

**Input JSON:**
```json
{
  "role": "THERAPIST"
}
```

**Output JSON:**
```json
{
  "message": "User role updated successfully"
}
```

### DELETE /api/v1/admin/users/{user_id}
**Purpose:** Permanently delete a user account from the system.

**Output JSON:**
```json
{
  "message": "User deleted successfully"
}
```

### GET /api/v1/admin/organizations/{org_id}/details
**Purpose:** Get detailed information about a specific organization.

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Medical Center",
  "admin_id": "507f1f77bcf86cd799439012",
  "is_verified": true,
  "created_at": 1640995200.0
}
```

### GET /api/v1/admin/organizations/{org_id}/members
**Purpose:** Get all users belonging to a specific organization.

**Output JSON:**
```json
[
  {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "Dr. Smith",
    "email": "smith@hospital.com",
    "role": "THERAPIST"
  }
]
```

### DELETE /api/v1/admin/organizations/{org_id}
**Purpose:** Delete an entire organization and all associated data.

**Output JSON:**
```json
{
  "message": "Organization deleted successfully"
}
```

### PUT /api/v1/admin/organizations/{org_id}/transfer-ownership
**Purpose:** Transfer organization ownership to another user.

**Input JSON:**
```json
{
  "new_admin_id": "507f1f77bcf86cd799439013"
}
```

**Output JSON:**
```json
{
  "message": "Organization ownership transferred successfully"
}
```

---

## Organization Admin Routes
*Manage their own organization*

### POST /api/v1/onboarding/organizations
**Purpose:** Create a new organization (requires Super Admin approval).

**Input JSON:**
```json
{
  "name": "City Medical Center",
  "slug": "city-medical-center",
  "description": "Comprehensive healthcare facility",
  "website": "https://citymedical.com"
}
```

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "City Medical Center",
  "admin_id": "507f1f77bcf86cd799439012",
  "is_verified": false,
  "created_at": 1640995200.0
}
```

### GET /api/v1/onboarding/organizations/me
**Purpose:** Get details of the organization they administer.

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "City Medical Center",
  "slug": "city-medical-center",
  "description": "Comprehensive healthcare facility",
  "admin_id": "507f1f77bcf86cd799439012",
  "is_verified": true
}
```

### PUT /api/v1/onboarding/organizations/me
**Purpose:** Update their organization's information.

**Input JSON:**
```json
{
  "name": "Updated Medical Center",
  "description": "Updated description",
  "website": "https://updatedmedical.com"
}
```

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Updated Medical Center",
  "slug": "city-medical-center",
  "description": "Updated description",
  "admin_id": "507f1f77bcf86cd799439012"
}
```

### GET /api/v1/onboarding/org/doctor-requests
**Purpose:** View pending doctor join requests for their organization.

**Output JSON:**
```json
[
  {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "Dr. Johnson",
    "email": "johnson@hospital.com",
    "specialization": "Cardiology",
    "organization_name": "City Medical Center"
  }
]
```

### PUT /api/v1/onboarding/org/doctor-requests/{doctor_id}/status
**Purpose:** Approve or reject doctor join requests.

**Input JSON:** Query parameter
```
?approved=true
```

**Output JSON:**
```json
{
  "message": "Doctor request approved"
}
```

### GET /api/v1/onboarding/org/pending-patients
**Purpose:** View patients pending approval for organization membership.

**Output JSON:**
```json
[
  {
    "patient_id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "organization_id": "507f1f77bcf86cd799439012",
    "created_at": 1640995200.0
  }
]
```

### PUT /api/v1/onboarding/org/approve-patient/{patient_id}
**Purpose:** Approve or reject patient organization membership.

**Input JSON:** Query parameter
```
?approved=true
```

**Output JSON:**
```json
{
  "message": "Patient approved successfully"
}
```

### POST /api/v1/onboarding/org/invite
**Purpose:** Send invitation emails to join the organization.

**Input JSON:**
```json
{
  "email": "newmember@hospital.com",
  "role": "THERAPIST"
}
```

**Output JSON:**
```json
{
  "message": "Invitation sent to newmember@hospital.com"
}
```

---

## Therapist/Doctor Routes
*Medical professional functionality*

### POST /api/v1/onboarding/doctor/profile
**Purpose:** Create or update professional profile.

**Input JSON:**
```json
{
  "specialization": "Psychiatry",
  "license_number": "PSY123456",
  "years_of_experience": 8,
  "bio": "Experienced psychiatrist specializing in mental health",
  "clinic_name": "Mental Health Clinic",
  "clinic_address": "123 Medical Drive",
  "organization_id": "507f1f77bcf86cd799439011"
}
```

**Output JSON:**
```json
{
  "user_id": "507f1f77bcf86cd799439012",
  "specialization": "Psychiatry",
  "license_number": "PSY123456",
  "org_request_status": "PENDING",
  "is_onboarded": true
}
```

### GET /api/v1/onboarding/doctor/links
**Purpose:** View all patient link requests (pending and approved).

**Output JSON:**
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
  }
]
```

### PUT /api/v1/onboarding/links/{link_id}/status
**Purpose:** Approve or reject patient link requests.

**Input JSON:** Query parameter
```
?status=APPROVED
```

**Output JSON:**
```json
{
  "message": "Status updated"
}
```

### POST /api/v1/appointments/slots
**Purpose:** Create available appointment time slots.

**Input JSON:**
```json
{
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "is_available": true
}
```

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "doctor_id": "507f1f77bcf86cd799439012",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "is_available": true
}
```

### GET /api/v1/appointments
**Purpose:** Get doctor's appointments (upcoming and past).

**Input JSON:** Query parameter
```
?role=THERAPIST
```

**Output JSON:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "patient_id": "507f1f77bcf86cd799439012",
    "doctor_id": "507f1f77bcf86cd799439013",
    "slot_id": "507f1f77bcf86cd799439014",
    "start_time": "2024-01-15T10:00:00Z",
    "status": "SCHEDULED",
    "reason": "Regular checkup"
  }
]
```

### PUT /api/v1/appointments/{appointment_id}
**Purpose:** Update appointment status or add notes.

**Input JSON:**
```json
{
  "status": "COMPLETED",
  "notes": "Patient responded well to treatment"
}
```

**Output JSON:**
```json
{
  "message": "Appointment updated successfully"
}
```

### POST /api/v1/appointments/{appointment_id}/prescribe
**Purpose:** Create prescription for completed appointment.

**Input JSON:**
```json
{
  "medications": [
    {
      "name": "Medication A",
      "dosage": "10mg",
      "frequency": "twice daily",
      "duration": "7 days"
    }
  ],
  "instructions": "Take with food"
}
```

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "appointment_id": "507f1f77bcf86cd799439012",
  "medications": [...],
  "created_at": 1640995200.0
}
```

---

## Patient Routes
*Patient-specific functionality*

### POST /api/v1/onboarding/patient/profile
**Purpose:** Create patient profile with medical information.

**Input JSON:**
```json
{
  "date_of_birth": "1990-05-15",
  "gender": "MALE",
  "phone": "+1234567890",
  "address": "123 Patient St, City, State",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+0987654321",
  "medical_history": "No significant history",
  "organization_id": "507f1f77bcf86cd799439011"
}
```

**Output JSON:**
```json
{
  "user_id": "507f1f77bcf86cd799439012",
  "date_of_birth": "1990-05-15",
  "gender": "MALE",
  "org_approval_status": "PENDING",
  "is_onboarded": true
}
```

### GET /api/v1/onboarding/organizations/{org_id}/doctors
**Purpose:** View approved doctors in their organization.

**Output JSON:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Dr. Smith",
    "specialization": "Psychiatry"
  }
]
```

### POST /api/v1/onboarding/links/request
**Purpose:** Request to link with a specific doctor.

**Input JSON:**
```json
{
  "doctor_id": "507f1f77bcf86cd799439011",
  "organization_id": "507f1f77bcf86cd799439012"
}
```

**Output JSON:**
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

### POST /api/v1/appointments
**Purpose:** Book an appointment with their linked doctor.

**Input JSON:**
```json
{
  "slot_id": "507f1f77bcf86cd799439011",
  "reason": "Follow-up consultation",
  "notes": "Experiencing increased anxiety"
}
```

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "patient_id": "507f1f77bcf86cd799439013",
  "doctor_id": "507f1f77bcf86cd799439014",
  "slot_id": "507f1f77bcf86cd799439011",
  "status": "SCHEDULED",
  "created_at": 1640995200.0
}
```

### GET /api/v1/appointments/{appointment_id}/join
**Purpose:** Get meeting link to join video appointment.

**Output JSON:**
```json
{
  "meeting_url": "https://meet.example.com/room123",
  "token": "jwt_token_here"
}
```

### GET /api/v1/appointments/{appointment_id}/prescriptions
**Purpose:** View prescriptions from completed appointments.

**Output JSON:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "appointment_id": "507f1f77bcf86cd799439012",
    "medications": [
      {
        "name": "Medication A",
        "dosage": "10mg",
        "frequency": "twice daily",
        "duration": "7 days"
      }
    ],
    "instructions": "Take with food",
    "created_at": 1640995200.0
  }
]
```

---

## General Admin Routes
*Available to SUPER_ADMIN and GEN_ADMIN*

### GET /api/v1/admin/logs/system
**Purpose:** View system logs for debugging and monitoring.

**Input JSON:** Query parameter
```
?limit=50
```

**Output JSON:**
```json
[
  {
    "timestamp": 1640995200.0,
    "level": "INFO",
    "message": "User login successful",
    "user_id": "507f1f77bcf86cd799439011"
  }
]
```

### GET /api/v1/admin/users/lookup
**Purpose:** Search for users by email before performing actions.

**Input JSON:** Query parameter
```
?email=user@example.com
```

**Output JSON:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "PATIENT"
}
```

### GET /api/v1/admin/requests/delete
**Purpose:** View pending account deletion requests.

**Output JSON:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "user_email": "user@example.com",
    "reason": "No longer needs service",
    "created_at": 1640995200.0
  }
]
```

### POST /api/v1/admin/requests/delete/{request_id}/approve
**Purpose:** Approve user account deletion request.

**Output JSON:**
```json
{
  "message": "Deletion request approved"
}
```

### POST /api/v1/admin/requests/delete/{request_id}/reject
**Purpose:** Reject user account deletion request.

**Output JSON:**
```json
{
  "message": "Deletion request rejected"
}
```

---

## Common Routes
*Available to authenticated users regardless of role*

### GET /api/v1/onboarding/status
**Purpose:** Check current onboarding and approval status.

**Output JSON:**
```json
{
  "is_onboarded": true,
  "org_approval_status": "APPROVED",
  "doctor_link_status": "APPROVED",
  "organization_id": "507f1f77bcf86cd799439011",
  "organization_name": "Medical Center",
  "message": "All approvals complete! You can access the dashboard."
}
```

### GET /api/v1/onboarding/organizations
**Purpose:** List available organizations for selection.

**Input JSON:** Query parameter
```
?verified_only=true
```

**Output JSON:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "City Medical Center",
    "slug": "city-medical-center",
    "description": "Comprehensive healthcare",
    "is_verified": true
  }
]
```

### POST /api/v1/chat/chat
**Purpose:** Send message to AI assistant for medical queries.

**Input JSON:** Form data
```
message: "What are the symptoms of anxiety?"
```

**Output JSON:**
```json
{
  "answer": "Anxiety symptoms include...",
  "sources": ["medical_guideline_2024.pdf"],
  "type": "medical_information"
}
```

### POST /api/v1/docs/upload_docs
**Purpose:** Upload medical documents for processing.

**Input JSON:** Form data
```
file: [PDF file]
role: "PATIENT"
```

**Output JSON:**
```json
{
  "message": "Document uploaded successfully",
  "doc_id": "507f1f77bcf86cd799439011",
  "accessible_to": "PATIENT"
}
```

### GET /api/v1/chat/suggestions
**Purpose:** Get personalized query suggestions.

**Output JSON:**
```json
{
  "suggested_queries": [
    "What are common anxiety treatments?",
    "How to manage stress effectively?"
  ],
  "personalized": true
}
```

### GET /health
**Purpose:** Basic health check endpoint.

**Output JSON:**
```json
{
  "status": "healthy",
  "timestamp": 1640995200.0,
  "version": "2.0.0"
}
```

### GET /health/detailed
**Purpose:** Detailed system health information.

**Output JSON:**
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "ai_services": {
      "status": "healthy",
      "embedding_service": "OK",
      "vector_db": "OK",
      "llm_service": "OK",
      "cache_size": 2
    }
  },
  "timestamp": 1640995200.0
}
```

---

## Error Response Format
All endpoints follow consistent error response format:

```json
{
  "detail": "Error message description"
}
```

## Authentication
All protected endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting
- Chat endpoints: 100 requests per hour
- Document uploads: 10 per hour
- General API calls: 1000 per hour

## Data Validation
- All input data is validated using Pydantic models
- Email format validation
- Required field checks
- Data type validation
- Length limits on text fields
