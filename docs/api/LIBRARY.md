# Library API

Base URL: `/api/v1/library`

## Endpoints

### GET /content

List educational content.

**Input:**
Query params (optional):

- `tag`: Filter by condition tag
- `type`: Filter by type (ARTICLE, VIDEO, QUIZ)

**Output:**

```json
[
  {
    "id": "content_id",
    "title": "Managing Anxiety",
    "type": "ARTICLE",
    "content": "Full text...",
    "condition_tags": ["anxiety"],
    "created_at": "..."
  }
]
```

### POST /content

Add educational content (Admin only).

**Input:**

```json
{
  "title": "New Treatment",
  "type": "ARTICLE",
  "content": "Text content...",
  "condition_tags": ["flu"],
  "metadata": {},
  "quiz": []
}
```

**Output:**

```json
{
  "id": "content_id",
  "message": "Content added"
}
```

### POST /recommend

Recommend content to a patient (Doctor only).

**Input:**

```json
{
  "patient_id": "patient_id",
  "content_id": "content_id",
  "notes": "Read this daily"
}
```

**Output:**

```json
{
  "status": "Recommended"
}
```

### GET /my-recommendations

Get recommendations for the current patient.

**Input:**
Header `Authorization: Bearer <token>`

**Output:**

```json
[
  {
    "recommendation_id": "rec_id",
    "content": { ...content_obj... },
    "notes": "Read this daily",
    "date": "..."
  }
]
```

### GET /quiz/{content_id}

Get quiz for a content item.

**Input:**
Path param `content_id`

**Output:**

```json
{
  "has_quiz": true,
  "questions": [
    {
      "question": "What is...?",
      "options": [{"text": "A"}, {"text": "B"}]
    }
  ]
}
```

### POST /quiz/{content_id}/submit

Submit quiz answers.

**Input:**

```json
[0, 1, 0] // Indices of selected options
```

**Output:**

```json
{
  "score": 2,
  "total": 3,
  "percentage": 66.6,
  "passed": false,
  "message": "Try again..."
}
```
