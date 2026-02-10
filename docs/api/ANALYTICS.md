# Analytics API

Base URL: `/api/v1/analytics`

## Endpoints

### GET /stats

Get system statistics (Admin/Doctor).

**Output:**

```json
{
  "total_users": 100,
  "total_chat_sessions": 500,
  "active_chats_24h": 10,
  "system_health": "healthy"
}
```

### GET /logs

Get system logs (Admin).

**Input:**
Query param `limit`

**Output:**

```json
{
  "logs": [
    {
      "timestamp": "...",
      "level": "INFO",
      "message": "..."
    }
  ]
}
```

### GET /clinical/summary/{patient_id}

Get AI-generated patient summary.

**Input:**
Path param `patient_id`

**Output:**

```json
{
  "summary": "Patient has history of...",
  "risk_factors": [...]
}
```

### GET /clinical/trends

Get population health trends.

**Output:**

```json
{
  "trends": [...]
}
```
