# Groups API

Base URL: `/api/v1/groups`

## Endpoints

### GET /

List all groups the current user is a member of.

**Input:**
Header `Authorization: Bearer <token>`

**Output:**

```json
{
  "groups": [
    {
      "id": "60d5...",
      "name": "Support Group",
      "description": "A support group",
      "type": "CUSTOM",
      "created_by": "user_id",
      "created_at": "2023-01-01T00:00:00Z",
      "settings": {
        "allow_media": true
      }
    }
  ],
  "total": 1
}
```

### POST /

Create a new custom group.

**Input:**

```json
{
  "name": "New Group",
  "description": "Optional description",
  "member_ids": ["user_id_1", "user_id_2"]
}
```

**Output:**

```json
{
  "id": "60d5...",
  "message": "Group created successfully"
}
```

### GET /{group_id}

Get group details.

**Input:**
Path param `group_id`

**Output:**

```json
{
  "id": "60d5...",
  "name": "Group Name",
  "member_count": 5,
  ...
}
```

### GET /{group_id}/members

List members of a group.

**Input:**
Path param `group_id`

**Output:**

```json
{
  "members": [
    {
      "id": "member_obj_id",
      "group_id": "group_id",
      "user_id": "user_id",
      "role": "MEMBER",
      "status": "ACTIVE",
      "joined_at": "..."
    }
  ],
  "total": 1
}
```

### POST /{group_id}/messages

Send a message to the group.

**Input:**

```json
{
  "content": "Hello world",
  "type": "TEXT" // Optional
}
```

**Output:**

```json
{
  "id": "msg_id",
  "group_id": "group_id",
  "sender_id": "user_id",
  "content": "Hello world",
  "created_at": "..."
}
```

### GET /{group_id}/messages

List messages in a group (Paginated).

**Input:**
Query params: `page=1`, `limit=50`

**Output:**

```json
{
  "messages": [
    {
      "id": "msg_id",
      "content": "Hello",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "has_more": true
}
```

### POST /{group_id}/messages/{message_id}/react

React to a message.

**Input:**
Query param: `emoji=👍`

**Output:**

```json
{
  "message": "Reaction added"
}
```
