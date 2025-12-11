# Onboarding API

Base URL: `/api/v1/onboarding`

## Endpoints

### GET /status

Get current user onboarding status.

**Output:**

```json
{
  "is_onboarded": false,
  "org_approval_status": "NOT_STARTED",
  "doctor_link_status": "NOT_STARTED",
  "message": "Please complete your profile"
}
```

### POST /patient/profile

Create/Update patient profile.

**Input:**

```json
{
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "organization_id": "org_id" // Optional
}
```

**Output:**
Updated profile.

### POST /doctor/profile

Create/Update doctor profile.

**Input:**

```json
{
  "specialization": "Cardiology",
  "education": "MD",
  "organization_id": "org_id"
}
```

**Output:**
Updated profile.

### POST /organizations

Create organization (Admin).

**Input:**

```json
{
  "name": "General Hospital",
  "slug": "general-hospital",
  "type": "HOSPITAL"
}
```

### GET /organizations

List organizations.

**Input:**
Query `verified_only=true` (default)

### POST /links/request

Request link to a doctor (Patient).

**Input:**

```json
{
  "doctor_id": "doc_id",
  "organization_id": "org_id"
}
```

### PUT /links/{link_id}/status

Update link status (Doctor).

**Input:**
Body param `status` (APPROVED, REJECTED) or Query param in URL depending on implementation (Here it is Query/Path usually, but verified as Path param in code with `LinkStatus` enum - likely Query or Body? Code definition: `status: LinkStatus`. If it's a Pydantic model it's body. But `LinkStatus` is enum, so it's a Query param unless Request Body model is used. Code: `status: LinkStatus` as function arg -> Query param in FastAPI by default if not path).

**Note**: In the code read: `@router.put("/links/{link_id}/status") async def update_link_status(link_id: str, status: LinkStatus, ...)` -> This implies `status` is a QUERY parameter.

**Input:**
Query param `status=APPROVED`

### GET /doctor/links

List link requests for doctor.
