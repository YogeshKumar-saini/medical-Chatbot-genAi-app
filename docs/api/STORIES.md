# Stories API

Base URL: `/api/v1/stories`

## Endpoints

### POST /

Create a new story (expires in 24h).

**Input:**

```json
{
  "caption": "My snapshot",
  "media_url": "http://example.com/image.png",
  "media_type": "IMAGE" // IMAGE or VIDEO
}
```

**Output:**

```json
{
  "id": "story_id",
  "message": "Story created successfully"
}
```

### GET /

Get feed stories from users you follow.

**Input:**
Header `Authorization: Bearer <token>`

**Output:**

```json
[
  {
    "user_id": "user_id",
    "username": "User Name",
    "avatar_url": "http://...",
    "stories": [
      {
        "id": "story_id",
        "user_id": "user_id",
        "media_url": "...",
        "media_type": "IMAGE",
        "caption": "...",
        "created_at": "...",
        "expires_at": "...",
        "views": 10
      }
    ]
  }
]
```

### GET /{user_id}

Get stories from a specific user.

**Input:**
Path param `user_id`

**Output:**

```json
[
  {
    "id": "story_id",
    "media_url": "...",
    "caption": "...",
    ...
  }
]
```

### POST /{story_id}/view

Mark story as viewed.

**Input:**
Path param `story_id`

**Output:**

```json
{
  "message": "Story viewed"
}
```

### DELETE /{story_id}

Delete your own story.

**Input:**
Path param `story_id`

**Output:**

```json
{
  "message": "Story deleted successfully"
}
```
