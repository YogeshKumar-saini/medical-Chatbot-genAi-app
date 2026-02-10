# Documents API

Base URL: `/api/v1/docs`

## Endpoints

### POST /upload_docs

Upload medical documents for RAG (Retrieval Augmented Generation).

**Input:**
Multipart Form Data:

- `file`: PDF/Document file
- `role`: Target audience role (e.g., "PATIENT", "DOCTOR")

**Output:**

```json
{
  "message": "file.pdf uploaded successfully",
  "doc_id": "uuid...",
  "accessible_to": "PATIENT"
}
```
