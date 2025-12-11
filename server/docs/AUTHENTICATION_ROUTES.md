# Authentication Routes Documentation
*Available to all users - No authentication required*

## Overview
Authentication routes handle user registration, login, and email verification. These endpoints are publicly accessible and form the entry point for users to access the system.

---

## POST /api/v1/auth/signup

### Purpose
Register a new user account in the system. Creates user record, sends verification email, and assigns initial role.

### Why This Endpoint Exists
- Allows new users to create accounts
- Supports role-based registration (PATIENT, THERAPIST, ORG_ADMIN)
- Initiates email verification workflow
- Prevents duplicate account creation

### Input JSON Format
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "PATIENT"
}
```

### Input Field Details
- `email` (string, required): Valid email address, becomes username
- `password` (string, required): Minimum 8 characters
- `name` (string, required): Full display name
- `role` (string, required): One of "PATIENT", "THERAPIST", "ORG_ADMIN"

### Output JSON Format
```json
{
  "message": "User created successfully. Please verify your email.",
  "user_id": "507f1f77bcf86cd799439011"
}
```

### Output Field Details
- `message` (string): Success confirmation with next steps
- `user_id` (string): MongoDB ObjectId of created user

### Error Responses
- `400 Bad Request`: Email already exists, invalid email format, weak password
- `422 Unprocessable Entity`: Missing required fields, invalid role
- `500 Internal Server Error`: Database connection issues

### Example Usage
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "securepass123",
    "name": "John Patient",
    "role": "PATIENT"
  }'
```

---

## POST /api/v1/auth/login

### Purpose
Authenticate existing user and return JWT access token for API access.

### Why This Endpoint Exists
- Verifies user credentials
- Issues time-limited access tokens
- Supports session management
- Enables role-based access control

### Input JSON Format
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Input Field Details
- `email` (string, required): Registered email address
- `password` (string, required): Account password

### Output JSON Format
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IlBBVElFTlQiLCJleHAiOjE2NDEwMDUyMDB9.signature",
  "token_type": "bearer",
  "user": {
    "email": "user@example.com",
    "role": "PATIENT",
    "name": "John Doe",
    "id": "507f1f77bcf86cd799439011"
  }
}
```

### Output Field Details
- `access_token` (string): JWT token for API authentication
- `token_type` (string): Always "bearer"
- `user` (object): User details for frontend state management
  - `email` (string): User email
  - `role` (string): User role
  - `name` (string): Display name
  - `id` (string): User ID

### Error Responses
- `401 Unauthorized`: Invalid credentials, account not verified
- `422 Unprocessable Entity`: Missing email or password
- `429 Too Many Requests`: Rate limited due to failed attempts

### Token Expiration
- Access tokens expire after 24 hours
- Include token in Authorization header: `Bearer <token>`

### Example Usage
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "securepass123"
  }'
```

---

## POST /api/v1/auth/verify-email

### Purpose
Verify user email address using OTP code sent during registration.

### Why This Endpoint Exists
- Confirms email ownership
- Activates user account
- Prevents spam registrations
- Enables password recovery features

### Input JSON Format
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Input Field Details
- `email` (string, required): Email address to verify
- `otp` (string, required): 6-digit verification code

### Output JSON Format
```json
{
  "message": "Email verified successfully"
}
```

### OTP Details
- 6-digit numeric code
- Expires after 10 minutes
- One-time use only
- Sent via email during registration

### Error Responses
- `400 Bad Request`: Invalid OTP, expired code
- `404 Not Found`: Email not found in system
- `422 Unprocessable Entity`: Missing email or OTP
- `429 Too Many Requests`: Too many verification attempts

### Example Usage
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "otp": "123456"
  }'
```

---

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Stored as bcrypt hash (not plain text)
- No password complexity requirements (configurable)

### Rate Limiting
- Signup: 5 requests per hour per IP
- Login: 10 attempts per hour per IP
- Email verification: 3 attempts per hour per email

### Email Verification
- Required before account activation
- OTP codes expire in 10 minutes
- Verification status tracked in database

### Session Management
- JWT tokens with 24-hour expiration
- Token refresh not implemented (use re-login)
- Automatic logout on token expiration

---

## Testing Accounts
For development and testing, these accounts are available:
- `superadmin@gmail.com` / `password123` (SUPER_ADMIN)
- `yksaini1090@gmail.com` / `password123` (ORG_ADMIN)
- `ysaini0193@gmail.com` / `password123` (THERAPIST)
- `yksaini0192@gmail.com` / `password123` (PATIENT)
