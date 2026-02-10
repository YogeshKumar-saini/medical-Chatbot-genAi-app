# Notifications API

Base URL: `/api/v1/notifications`

## Endpoints

### GET /

List notifications.

**Input:**
Headers: `Authorization: Bearer <token>`
Query: `limit=20`, `unread_only=false`

**Output:**

```json
[
  {
    "id": "...",
    "title": "Welcome",
    "message": "Welcome to the app!",
    "read": false,
    "created_at": "..."
  }
]
```

### PUT /{notification_id}/read

Mark a notification as read.

**Input:**
Path: `notification_id`

**Output:**

```json
{
  "message": "Marked as read"
}
```
