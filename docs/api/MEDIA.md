# Media API

Base URL: `/api/v1/media`

## Endpoints

### POST /upload

Upload a media file (image, video, etc.).

**Input:**
Multipart Form Data:

- `file`: File to upload

**Output:**

```json
{
  "filename": "generated_filename.ext",
  "url": "/api/v1/media/images/generated_filename.ext",
  "content_type": "image/jpeg"
}
```

### GET /{file_type}/{filename}

Get a media file.

**Input:**
Path params: `file_type` (e.g., "images"), `filename`

**Output:**
File stream (e.g., `image/jpeg`)

### GET /images/thumbnails/{filename}

Get a thumbnail for an image.

**Input:**
Path param: `filename`

**Output:**
File stream (e.g., `image/jpeg`)

### DELETE /{file_type}/{filename}

Delete a file (owner only).

**Input:**
Path params: `file_type`, `filename`

**Output:**

```json
{
  "message": "File deleted successfully"
}
```

### GET /groups/{group_id}/gallery

Get all media shared in a group.

**Input:**
Path param `group_id`
Query param `media_type` (Optional)

**Output:**

```json
{
  "media": [
    {
      "filename": "...",
      "url": "...",
      "user_id": "...",
      "created_at": "..."
    }
  ],
  "total": 5
}
```
