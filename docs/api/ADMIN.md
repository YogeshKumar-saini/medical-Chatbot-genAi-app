# Admin API

Base URL: `/api/v1/admin`

## Endpoints

### GET /users

List all users (Super Admin).

**Input:**
Query params `skip`, `limit`, `role`, `search`

**Output:**

```json
[
  {
    "id": "...",
    "email": "...",
    "role": "PATIENT",
    "is_verified": true
  }
]
```

### POST /users

Create a user manually (Super Admin).

**Input:**

```json
{
  "email": "...",
  "password": "...",
  "name": "...",
  "role": "DOCTOR",
  "is_verified": true
}
```

**Output:**

```json
{
  "id": "...",
  ...
}
```

### PUT /users/{user_id}

Update user details.

**Input:**

```json
{
  "name": "New Name",
  "is_verified": true
}
```

**Output:**
Updated user object.

### DELETE /users/{user_id}

Delete user.

**Output:**

```json
{
  "message": "User deleted successfully"
}
```

### GET /organizations/me

Get managed organization (Org Admin).

**Output:**

```json
{
  "id": "...",
  "name": "Clinic Name",
  "is_verified": true
}
```

### PUT /organizations/me

Update managed organization.

**Input:**

```json
{
  "description": "New description",
  "phone": "..."
}
```

### GET /organizations/{org_id}/members

List doctors and patients in an organization.

**Output:**

```json
{
  "doctors": [...],
  "patients": [...]
}
```

### GET /requests/delete

List pending user deletion requests (Org Admin).

**Output:**

```json
[
  {
    "id": "req_id",
    "target_user_email": "...",
    "status": "PENDING"
  }
]
```

### POST /requests/delete/{request_id}/approve

Approve user deletion.

### POST /requests/delete/{request_id}/reject

Reject user deletion.
