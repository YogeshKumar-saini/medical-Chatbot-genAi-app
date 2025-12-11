# Wellness API

Base URL: `/api/v1/wellness`

## Endpoints

### POST /mood

Log a user's mood.

**Input:**
Headers: `Authorization: Bearer <token>`
Body:

```json
{
  "mood": "HAPPY",
  "intensity": 8,
  "note": "Feeling great!"
}
```

*Moods*: HAPPY, SAD, ANXIOUS, ANGRY, NEUTRAL, EXCITED, TIRED

**Output:**

```json
{
  "id": "...",
  "mood": "HAPPY",
  "intensity": 8,
  "created_at": "..."
}
```

### GET /mood/history

Get mood history.

**Input:**
Query: `limit=30`

**Output:**

```json
[
  {
    "id": "...",
    "mood": "HAPPY",
    ...
  }
]
```

### POST /journal

Create a journal entry.

**Input:**

```json
{
  "title": "My Day",
  "content": "Today was productive.",
  "tags": ["work", "happy"]
}
```

**Output:**

```json
{
  "id": "...",
  "title": "My Day",
  ...
}
```

### GET /journal

List journal entries.

**Input:**
Query: `limit=20`, `skip=0`

**Output:**

```json
[
  {
    "id": "...",
    "title": "My Day",
    ...
  }
]
```

### DELETE /journal/{entry_id}

Delete a journal entry.
