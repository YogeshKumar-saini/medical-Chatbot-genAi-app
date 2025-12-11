# Super Admin Routes Documentation
*Highest level administrative access - Requires SUPER_ADMIN role*

## Overview
Super Admin routes provide complete system administration capabilities including user management, organization verification, and system oversight. These routes are restricted to users with SUPER_ADMIN role only.

---

## PUT /api/v1/onboarding/admin/organizations/{org_id}/verify

### Purpose
Approve or reject organization registration requests submitted by Organization Admins.

### Why This Endpoint Exists
- Controls which organizations can operate in the system
- Ensures organizations meet quality standards
- Prevents fraudulent or malicious organization registrations
- Enables hierarchical approval workflow

### Input Parameters
- **URL Parameter**: `org_id` (string, required) - Organization ID to verify
- **Query Parameter**: `verified=true` or `verified=false`

### Input Format
```
PUT /api/v1/onboarding/admin/organizations/507f1f77bcf86cd799439011/verify?verified=true
```

### Authorization Required
- **Role**: SUPER_ADMIN only
- **Token**: Bearer token in Authorization header

### Output JSON Format
```json
{
  "message": "Organization verified"
}
```

### Process Flow
1. Validate requesting user is SUPER_ADMIN
2. Find organization by ID
3. Update verification status
4. Set verification timestamp and admin ID
5. Return success confirmation

### Error Responses
- `403 Forbidden`: User is not SUPER_ADMIN
- `404 Not Found`: Organization not found
- `422 Unprocessable Entity`: Invalid verification parameter

### Example Usage
```bash
curl -X PUT "http://localhost:8000/api/v1/onboarding/admin/organizations/507f1f77bcf86cd799439011/verify?verified=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## GET /api/v1/admin/users

### Purpose
Retrieve paginated list of all users in the system for administrative management.

### Why This Endpoint Exists
- Provides oversight of all system users
- Enables user account management
- Supports user search and filtering
- Facilitates bulk user operations

### Input Parameters
- **Query Parameters**:
  - `skip` (integer, optional): Number of users to skip (default: 0)
  - `limit` (integer, optional): Maximum users to return (default: 50)
  - `role` (string, optional): Filter by role ("PATIENT", "THERAPIST", "ORG_ADMIN", "SUPER_ADMIN")
  - `search` (string, optional): Search in user names or emails

### Input Format
```
GET /api/v1/admin/users?skip=0&limit=50&role=PATIENT&search=john
```

### Output JSON Format
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PATIENT",
    "is_active": true,
    "created_at": 1640995200.0
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "email": "therapist@example.com",
    "name": "Dr. Smith",
    "role": "THERAPIST",
    "is_active": true,
    "created_at": 1640995300.0
  }
]
```

### Pagination
- Default page size: 50 users
- Use `skip` parameter for offset-based pagination
- Maximum limit: 100 users per request

### Example Usage
```bash
curl -X GET "http://localhost:8000/api/v1/admin/users?role=PATIENT&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## PUT /api/v1/admin/users/{user_id}/role

### Purpose
Change a user's role in the system (promote/demote users).

### Why This Endpoint Exists
- Enables role-based access control management
- Supports user career progression (PATIENT → THERAPIST)
- Allows administrative role assignments
- Provides role correction capabilities

### Input Parameters
- **URL Parameter**: `user_id` (string, required) - User ID to update
- **JSON Body**: `{"role": "NEW_ROLE"}`

### Input JSON Format
```json
{
  "role": "THERAPIST"
}
```

### Valid Role Transitions
- PATIENT → THERAPIST (career advancement)
- THERAPIST → PATIENT (role change)
- ORG_ADMIN → THERAPIST/PATIENT (demotion)
- THERAPIST → ORG_ADMIN (promotion with approval)

### Output JSON Format
```json
{
  "message": "User role updated successfully"
}
```

### Security Considerations
- Cannot change SUPER_ADMIN roles
- Cannot demote other SUPER_ADMINS
- Role changes are logged for audit trail

### Example Usage
```bash
curl -X PUT http://localhost:8000/api/v1/admin/users/507f1f77bcf86cd799439011/role \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"role": "THERAPIST"}'
```

---

## DELETE /api/v1/admin/users/{user_id}

### Purpose
Permanently delete a user account and all associated data.

### Why This Endpoint Exists
- Handles GDPR/right-to-be-forgotten requests
- Removes inactive or fraudulent accounts
- Cleans up test/development accounts
- Enforces account deletion policies

### Input Parameters
- **URL Parameter**: `user_id` (string, required) - User ID to delete

### Input Format
```
DELETE /api/v1/admin/users/507f1f77bcf86cd799439011
```

### Data Deletion Scope
- User account record
- Associated profiles (patient/doctor)
- Organization memberships
- Doctor-patient links
- Appointments and prescriptions
- Chat history and documents

### Output JSON Format
```json
{
  "message": "User deleted successfully"
}
```

### Restrictions
- Cannot delete SUPER_ADMIN accounts
- Cannot delete users with active appointments
- Deletion is irreversible

### Example Usage
```bash
curl -X DELETE http://localhost:8000/api/v1/admin/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## GET /api/v1/admin/organizations/{org_id}/details

### Purpose
Retrieve detailed information about a specific organization.

### Why This Endpoint Exists
- Provides complete organization oversight
- Shows verification status and history
- Displays member statistics
- Supports organization audit and management

### Input Parameters
- **URL Parameter**: `org_id` (string, required) - Organization ID

### Output JSON Format
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "City Medical Center",
  "slug": "city-medical-center",
  "description": "Comprehensive healthcare facility",
  "admin_id": "507f1f77bcf86cd799439012",
  "is_verified": true,
  "verified_at": 1640995200.0,
  "verified_by": "507f1f77bcf86cd799439013",
  "created_at": 1640995100.0
}
```

### Information Provided
- Basic organization details
- Verification status and timestamps
- Administrative ownership
- Creation and verification metadata

### Example Usage
```bash
curl -X GET http://localhost:8000/api/v1/admin/organizations/507f1f77bcf86cd799439011/details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## GET /api/v1/admin/organizations/{org_id}/members

### Purpose
List all users belonging to a specific organization.

### Why This Endpoint Exists
- Provides organization membership oversight
- Shows user distribution by role
- Supports organization management decisions
- Enables member verification and management

### Input Parameters
- **URL Parameter**: `org_id` (string, required) - Organization ID

### Output JSON Format
```json
[
  {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "Dr. Johnson",
    "email": "johnson@hospital.com",
    "role": "THERAPIST"
  },
  {
    "user_id": "507f1f
