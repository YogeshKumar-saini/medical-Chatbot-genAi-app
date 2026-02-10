# Chat API

Base URL: `/api/v1/chat`

## Endpoints

### POST /chat

Send a message to the AI assistant.

**Input:**
Form Data:

- `message`: "Hello, I have a headache."

**Output:**

```json
{
  "answer": "I'm sorry to hear that...",
  "sources": ["Source 1", "Source 2"],
  "type": "medical_query"
}
```

### POST /chat/stream

Stream a chat response.

**Input:**
Form Data:

- `message`: "Explain diabetes."

**Output:**
Text/Event Stream (Chunks of the answer)

### GET /history

Get chat history.

**Input:**
Query param `limit` (default 50)

**Output:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "..."
    },
    {
      "role": "assistant",
      "content": "..."
    }
  ]
}
```

### DELETE /history

Clear chat history.

**Output:**

```json
{
  "message": "Chat history cleared successfully"
}
```

### GET /suggestions

Get suggested queries based on user role.

**Output:**

```json
{
  "suggested_queries": [
    "What symptoms should I...",
    "..."
  ],
  "personalized": true
}
```

### POST /analyze

Analyze a medical image.

**Input:**
Multipart Form Data:

- `file`: Image file
- `prompt`: "Analyze this..."

**Output:**

```json
{
  "analysis": "The image shows...",
  "type": "image_analysis"
}
```
