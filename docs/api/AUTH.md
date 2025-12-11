# Authentication API

Base URL: `/api/v1/auth`

## Endpoints

### POST /signup

Register a new user.

**Input:**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "role": "PATIENT",
  "name": "John Doe"
}
```

**Output:**

```json
{
  "message": "User created successfully. Please verify your email.",
  "user_id": "60d5ec49f1a2c8..."
}
```

### POST /verify-email

Verify user's email address using OTP.

**Input:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Output:**

```json
{
  "message": "Email verified successfully"
}
```

### POST /login

Authenticate user and get access token.

**Input:**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Output:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": "60d5ec49f1a2c8...",
    "email": "user@example.com",
    "role": "PATIENT",
    "name": "John Doe",
    "is_verified": true
  }
}
```

### POST /refresh-token

Refresh the access token.

**Input:**
Header `Authorization: Bearer <token>`

**Output:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer"
}
```

### POST /verify-cookies

Verify auth cookies (internal use).

**Input:**
Cookies `access_token`

**Output:**

```json
{
  "valid": true,
  "user_id": "...",
  "role": "..."
}
```
