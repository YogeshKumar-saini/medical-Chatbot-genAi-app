# Organization Admin Routes Documentation
*Organization management access - Requires ORG_ADMIN role*

## Overview
Organization Admin routes enable administrators to manage their healthcare organization, including creating the organization, managing memberships, and overseeing doctor-patient relationships within their organization.

---

## POST /api/v1/onboarding/organizations

### Purpose
Create a new healthcare organization that requires Super Admin approval.

### Why This Endpoint Exists
- Allows organization administrators to register their healthcare facility
- Creates the foundation for doctor-patient relationships
- Enables hierarchical healthcare management
- Supports multi-organization healthcare networks

### Input JSON Format
```json
{
  "name": "City Medical Center",
  "slug": "city-medical-center",
  "description": "Comprehensive healthcare facility serving the metropolitan area",
  "website": "https://citymedical.com",
  "phone": "+1-555-0123",
  "email": "admin@citymedical.com"
}
```

### Input Field Details
- `name` (string, required): Full organization name
- `slug` (string, required): URL-friendly identifier, must be unique
- `description` (string, optional): Detailed description of services
- `website` (string, optional): Organization website URL
- `phone` (string, optional): Contact phone number
- `email` (string, optional): Organization contact email

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "City Medical Center",
  "slug": "city-medical-center",
  "description": "Comprehensive healthcare facility serving the metropolitan area",
  "admin_id": "507f1f77bcf86cd799439012",
  "is_verified": false,
  "created_at": 1640995200.0
}
```

### Organization Creation Process
1. Validate organization slug uniqueness
2. Create organization record with PENDING verification status
3. Auto-create organization group for team communication
4. Return organization details for confirmation

### Error Responses
- `400 Bad Request`: Slug already exists, invalid data
- `403 Forbidden`: User is not ORG_ADMIN
- `422 Unprocessable Entity`: Missing required fields

---

## GET /api/v1/onboarding/organizations/me

### Purpose
Retrieve details of the organization administered by the current user.

### Why This Endpoint Exists
- Provides organization administrators with their organization's information
- Enables profile management and updates
- Shows verification status and requirements
- Supports organization dashboard functionality

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "City Medical Center",
  "slug": "city-medical-center",
  "description": "Comprehensive healthcare facility",
  "website": "https://citymedical.com",
  "phone": "+1-555-0123",
  "email": "admin@citymedical.com",
  "admin_id": "507f1f77bcf86cd799439012",
  "is_verified": true,
  "verified_at": 1640995300.0,
  "verified_by": "507f1f77bcf86cd799439013",
  "created_at": 1640995200.0
}
```

### Organization States
- `is_verified: false`: Waiting for Super Admin approval
- `is_verified: true`: Fully operational organization

---

## PUT /api/v1/onboarding/organizations/me

### Purpose
Update the organization's profile information.

### Why This Endpoint Exists
- Enables organizations to update contact information
- Supports rebranding and service changes
- Maintains current organization details
- Allows profile completion after initial setup

### Input JSON Format
```json
{
  "name": "Updated Medical Center",
  "description": "Enhanced healthcare facility with new services",
  "website": "https://updatedmedical.com",
  "phone": "+1-555-0124",
  "email": "contact@updatedmedical.com"
}
```

### Updateable Fields
- `name`: Organization name
- `description`: Service description
- `website`: Website URL
- `phone`: Contact phone
- `email`: Contact email

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Updated Medical Center",
  "slug": "city-medical-center",
  "description": "Enhanced healthcare facility with new services",
  "admin_id": "507f1f77bcf86cd799439012"
}
```

### Restrictions
- Cannot change organization slug after creation
- Cannot modify verification status
- Only organization admin can update

---

## GET /api/v1/onboarding/org/doctor-requests

### Purpose
View pending doctor join requests for the organization.

### Why This Endpoint Exists
- Shows doctors wanting to join the organization
- Enables approval/rejection workflow
- Supports organization growth and staffing
- Maintains quality control over medical staff

### Output JSON Format
```json
[
  {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@hospital.com",
    "specialization": "Psychiatry",
    "license_number": "PSY123456",
    "years_of_experience": 8,
    "organization_name": "City Medical Center",
    "created_at": 1640995200.0
  }
]
```

### Request Information
- Doctor's professional credentials
- Specialization and experience
- Application timestamp
- Current organization context

---

## PUT /api/v1/onboarding/org/doctor-requests/{doctor_id}/status

### Purpose
Approve or reject doctor join requests for the organization.

### Why This Endpoint Exists
- Controls medical staff membership
- Ensures doctor qualifications meet standards
- Manages organization capacity and specialties
- Maintains professional standards

### Input Parameters
- **URL Parameter**: `doctor_id` (string, required) - Doctor user ID
- **Query Parameter**: `approved=true` or `approved=false`

### Input Format
```
PUT /api/v1/onboarding/org/doctor-requests/507f1f77bcf86cd799439011/status?approved=true
```

### Approval Process
1. Validate doctor request exists for this organization
2. Update doctor profile with approval status
3. If approved, add doctor to organization group
4. Send confirmation to doctor

### Output JSON Format
```json
{
  "message": "Doctor request approved"
}
```

### Status Values
- `APPROVED`: Doctor can now practice in organization
- `REJECTED`: Doctor cannot join, can reapply later

---

## GET /api/v1/onboarding/org/pending-patients

### Purpose
View patients who have requested membership in the organization.

### Why This Endpoint Exists
- Shows patient membership requests
- Enables patient onboarding management
- Supports patient intake and verification
- Manages organization patient base

### Output JSON Format
```json
[
  {
    "patient_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "organization_id": "507f1f77bcf86cd799439012",
    "date_of_birth": "1990-05-15",
    "phone": "+1234567890",
    "created_at": 1640995200.0
  }
]
```

### Patient Information
- Basic contact and demographic details
- Organization membership request timestamp
- Patient profile completion status

---

## PUT /api/v1/onboarding/org/approve-patient/{patient_id}

### Purpose
Approve or reject patient membership requests.

### Why This Endpoint Exists
- Controls patient access to organization services
- Verifies patient eligibility
- Manages patient load distribution
- Ensures proper patient onboarding

### Input Parameters
- **URL Parameter**: `patient_id` (string, required) - Patient user ID
- **Query Parameter**: `approved=true` or `approved=false`

### Input Format
```
PUT /api/v1/onboarding/org/approve-patient/507f1f77bcf86cd799439011?approved=true
```

### Approval Process
1. Find patient profile and verify request
2. Update approval status
3. If approved, add patient to organization group
4. Enable patient to access organization doctors

### Output JSON Format
```json
{
  "message": "Patient approved successfully"
}
```

---

## POST /api/v1/onboarding/org/invite

### Purpose
Send email invitations to potential organization members.

### Why This Endpoint Exists
- Enables proactive member recruitment
- Supports organization growth
- Allows targeted invitations by role
- Facilitates team building and expansion

### Input JSON Format
```json
{
  "email": "newmember@hospital.com",
  "role": "THERAPIST"
}
```

### Input Field Details
- `email` (string, required): Email address to invite
- `role` (string, required): Role to assign ("THERAPIST", "PATIENT")

### Invitation Process
1. Check if user already exists in system
2. Generate invitation with role-specific instructions
3. Send email with registration link
4. Track invitation for follow-up

### Output JSON Format
```json
{
  "message": "Invitation sent to newmember@hospital.com"
}
```

### Invitation Types
- **THERAPIST**: Professional onboarding invitation
- **PATIENT**: Patient registration invitation
- **ORG_ADMIN**: Administrative role invitation

---

## Role-Based Access Control

### Organization Admin Permissions
- **Create Organization**: One organization per admin
- **Manage Membership**: Approve/reject doctors and patients
- **Send Invitations**: Recruit new members
- **View Requests**: Monitor pending applications
- **Update Profile**: Modify organization information

### Security Considerations
- Organization admins can only manage their own organization
- Cannot approve organizations (requires Super Admin)
- Cannot modify other organizations' data
- All actions are logged for audit trails

### Organization Lifecycle
1. **Creation**: ORG_ADMIN creates organization
2. **Verification**: SUPER_ADMIN approves organization
3. **Growth**: ORG_ADMIN invites and approves members
4. **Management**: Ongoing member and service management
5. **Maintenance**: Profile updates and member oversight

---

## Error Handling
All endpoints follow consistent error response format:

```json
{
  "detail": "Error message description"
}
```

### Common Error Codes
- `403 Forbidden`: Not organization admin or wrong organization
- `404 Not Found`: Organization or user not found
- `400 Bad Request`: Invalid data or duplicate entries
- `422 Unprocessable Entity`: Missing required fields

### Rate Limiting
- Organization creation: 1 per user
- Member approvals: 50 per hour
- Invitations: 20 per hour
