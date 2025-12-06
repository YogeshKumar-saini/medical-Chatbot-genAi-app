# 🗨️ Group Chat System - API Documentation

## Overview

The Group Chat System enables community building within medical organizations through auto-created groups, real-time messaging, and comprehensive moderation tools.

## Features

- ✅ **Auto-Group Creation**: Automatic groups for organizations and therapists
- ✅ **Real-time Messaging**: Text, images, videos, voice messages
- ✅ **Moderation Tools**: Ban, remove, deactivate with audit logs
- ✅ **Role-Based Access**: Admins, moderators, and members
- ✅ **Message Reactions**: Emoji reactions and replies
- ✅ **Rate Limiting**: Prevents spam (10 messages/minute)

---

## Auto-Group Creation Flow

### Organization Group

```
1. Organization created → Auto-creates org-wide group
2. Admin added as ADMIN
3. Patients join org → Auto-added as MEMBER
```

### Therapist Group

```
1. Doctor verified → Auto-creates therapist group
2. Doctor added as ADMIN
3. Doctor-patient link approved → Patient auto-added as MEMBER
```

---

## API Endpoints

### Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <access_token>
```

---

## Groups

### GET /api/v1/groups

List all groups the user is a member of.

**Response:**

```json
{
  "groups": [
    {
      "id": "group_id",
      "name": "City Hospital - Community",
      "description": "Organization-wide community",
      "type": "ORGANIZATION",
      "organization_id": "org_id",
      "therapist_id": null,
      "created_by": "user_id",
      "created_at": "2025-12-06T00:00:00",
      "settings": {
        "allow_media": true,
        "allow_patient_invite": false,
        "moderation_mode": "AUTO"
      }
    }
  ],
  "total": 2
}
```

---

### POST /api/v1/groups

Create a custom group.

**Request:**

```json
{
  "name": "Support Group",
  "description": "Weekly support sessions",
  "member_ids": ["user_id_1", "user_id_2"]
}
```

**Response:**

```json
{
  "id": "group_id",
  "message": "Group created successfully"
}
```

---

### GET /api/v1/groups/{group_id}

Get group details.

**Response:**

```json
{
  "id": "group_id",
  "name": "City Hospital - Community",
  "description": "Organization-wide community",
  "type": "ORGANIZATION",
  "member_count": 45,
  "settings": {...}
}
```

---

### PUT /api/v1/groups/{group_id}/settings

Update group settings (admin only).

**Request:**

```json
{
  "allow_media": true,
  "allow_patient_invite": false,
  "moderation_mode": "MANUAL"
}
```

---

### DELETE /api/v1/groups/{group_id}

Delete a custom group (admin only, custom groups only).

---

## Members

### GET /api/v1/groups/{group_id}/members

List group members.

**Response:**

```json
{
  "members": [
    {
      "id": "member_id",
      "user_id": "user_id",
      "role": "ADMIN",
      "status": "ACTIVE",
      "joined_at": "2025-12-06T00:00:00",
      "muted": false
    }
  ],
  "total": 45
}
```

---

### POST /api/v1/groups/{group_id}/members/{user_id}

Add a member to the group (admin only).

---

### DELETE /api/v1/groups/{group_id}/members/{user_id}

Remove a member from the group.

**Query Parameters:**

- `reason` (required): Reason for removal

---

## Moderation

### PUT /api/v1/groups/{group_id}/members/{user_id}/ban

Ban a member from the group.

**Request:**

```json
{
  "reason": "Violating community guidelines",
  "duration_hours": 24
}
```

**Response:**

```json
{
  "success": true,
  "message": "User banned successfully",
  "ban_expires_at": "2025-12-07T00:00:00"
}
```

**Notes:**

- `duration_hours` is optional (null = permanent ban)
- Banned users cannot send messages
- Ban auto-expires after duration

---

### PUT /api/v1/groups/{group_id}/members/{user_id}/unban

Unban a member.

---

### PUT /api/v1/groups/{group_id}/members/{user_id}/deactivate

Temporarily deactivate a member.

**Query Parameters:**

- `reason` (required): Reason for deactivation

---

### GET /api/v1/groups/{group_id}/moderation-logs

Get moderation logs (admin only).

**Query Parameters:**

- `limit` (optional, default: 50, max: 100): Number of logs to return

**Response:**

```json
{
  "logs": [
    {
      "id": "log_id",
      "group_id": "group_id",
      "moderator_id": "user_id",
      "target_user_id": "user_id",
      "action": "BAN",
      "reason": "Spam",
      "duration": 24,
      "timestamp": "2025-12-06T00:00:00"
    }
  ],
  "total": 10
}
```

---

## Messages

### GET /api/v1/groups/{group_id}/messages

Get messages from a group (paginated).

**Query Parameters:**

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50, max: 100): Messages per page

**Response:**

```json
{
  "messages": [
    {
      "id": "message_id",
      "group_id": "group_id",
      "sender_id": "user_id",
      "content": "Hello everyone!",
      "type": "TEXT",
      "media_urls": [],
      "reply_to": null,
      "reactions": [
        {"user_id": "user_id", "emoji": "👍"}
      ],
      "edited": false,
      "created_at": "2025-12-06T00:00:00"
    }
  ],
  "total": 150,
  "page": 1,
  "has_more": true
}
```

---

### POST /api/v1/groups/{group_id}/messages

Send a message to a group.

**Request:**

```json
{
  "content": "Hello everyone!",
  "type": "TEXT",
  "media_urls": [],
  "reply_to": "message_id"
}
```

**Message Types:**

- `TEXT`: Plain text message
- `IMAGE`: Image with optional caption
- `VIDEO`: Video with optional caption
- `VOICE`: Voice message
- `FILE`: File attachment

**Response:**

```json
{
  "id": "message_id",
  "group_id": "group_id",
  "sender_id": "user_id",
  "content": "Hello everyone!",
  "type": "TEXT",
  "created_at": "2025-12-06T00:00:00"
}
```

**Rate Limiting:**

- Maximum 10 messages per minute per user
- Returns 403 if limit exceeded

---

### DELETE /api/v1/groups/{group_id}/messages/{message_id}

Delete a message (soft delete).

**Permissions:**

- Users can delete their own messages
- Admins/moderators can delete any message

**Response:**

```json
{
  "message": "Message deleted successfully"
}
```

---

### PUT /api/v1/groups/{group_id}/messages/{message_id}

Edit a message (own messages only).

**Query Parameters:**

- `content` (required): New message content

**Response:**

```json
{
  "message": "Message edited successfully"
}
```

---

### POST /api/v1/groups/{group_id}/messages/{message_id}/react

Add a reaction to a message.

**Query Parameters:**

- `emoji` (required): Emoji to react with (e.g., "👍", "❤️", "😊")

---

### DELETE /api/v1/groups/{group_id}/messages/{message_id}/react

Remove a reaction from a message.

**Query Parameters:**

- `emoji` (required): Emoji to remove

---

## Permission Matrix

| Action | Org Admin | Doctor (in their group) | Patient |
|--------|-----------|-------------------------|---------|
| Create custom group | ✅ | ✅ | ✅ |
| Ban user | ✅ | ✅ | ❌ |
| Remove user | ✅ | ✅ | ❌ |
| Deactivate user | ✅ | ✅ | ❌ |
| Delete any message | ✅ | ✅ | ❌ |
| Delete own message | ✅ | ✅ | ✅ |
| Edit own message | ✅ | ✅ | ✅ |
| Send message | ✅ | ✅ | ✅ (if active) |
| Add reaction | ✅ | ✅ | ✅ |
| Update settings | ✅ | ✅ | ❌ |
| View moderation logs | ✅ | ✅ | ❌ |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Example Workflows

### 1. Patient Joins Organization

```
1. POST /api/v1/onboarding/patient/profile
   → Auto-added to organization group

2. GET /api/v1/groups
   → See organization group in list

3. GET /api/v1/groups/{org_group_id}/messages
   → Read community messages

4. POST /api/v1/groups/{org_group_id}/messages
   → Participate in discussions
```

### 2. Doctor Creates Support Group

```
1. POST /api/v1/groups
   {
     "name": "Diabetes Support Group",
     "member_ids": ["patient1", "patient2", "patient3"]
   }

2. POST /api/v1/groups/{group_id}/messages
   → Send welcome message

3. GET /api/v1/groups/{group_id}/members
   → View group members
```

### 3. Admin Moderates Group

```
1. GET /api/v1/groups/{group_id}/moderation-logs
   → Review recent actions

2. PUT /api/v1/groups/{group_id}/members/{user_id}/ban
   → Ban violating user

3. DELETE /api/v1/groups/{group_id}/messages/{message_id}
   → Remove inappropriate message
```

---

## Testing

Run the verification script:

```bash
cd /home/yogesh/project/medical-Chatbot-genAi-app
source server/venv/bin/activate  # If using virtual environment
python3 verify_groups.py
```

This will test:

- ✅ Auto-group creation
- ✅ Messaging functionality
- ✅ Moderation features
- ✅ Permission checks
- ✅ Custom group creation

---

## Database Schema

### Collections

**groups**

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: "ORGANIZATION" | "THERAPIST" | "CUSTOM",
  organization_id: String,
  therapist_id: String,
  avatar_url: String,
  created_by: String,
  created_at: DateTime,
  settings: {
    allow_media: Boolean,
    allow_patient_invite: Boolean,
    moderation_mode: String
  }
}
```

**group_members**

```javascript
{
  _id: ObjectId,
  group_id: String,
  user_id: String,
  role: "ADMIN" | "MODERATOR" | "MEMBER",
  status: "ACTIVE" | "BANNED" | "DEACTIVATED",
  ban_expires_at: DateTime,
  joined_at: DateTime,
  last_read_message_id: String,
  muted: Boolean
}
```

**group_messages**

```javascript
{
  _id: ObjectId,
  group_id: String,
  sender_id: String,
  content: String,
  type: "TEXT" | "IMAGE" | "VIDEO" | "VOICE" | "FILE",
  media_urls: [String],
  reply_to: String,
  reactions: [{user_id: String, emoji: String}],
  edited: Boolean,
  deleted: Boolean,
  created_at: DateTime
}
```

**moderation_logs**

```javascript
{
  _id: ObjectId,
  group_id: String,
  moderator_id: String,
  target_user_id: String,
  action: "BAN" | "UNBAN" | "REMOVE" | "DEACTIVATE" | "ACTIVATE",
  reason: String,
  duration: Number,
  timestamp: DateTime
}
```

---

## Next Phase (Phase 2)

### Real-time Features

- WebSocket integration for live messaging
- Online/offline status
- Typing indicators
- Push notifications

### Media Features

- File upload to S3/CloudFlare R2
- Image/video compression
- Voice message recording
- Media gallery

### Social Features

- User profiles with bio/avatar
- Follow/unfollow system
- Stories (24h expiry)
- Verification badges

---

## Support

For issues or questions:

1. Check the system design document
2. Review the implementation plan
3. Run the verification script
4. Check server logs in `medical_ai.log`
