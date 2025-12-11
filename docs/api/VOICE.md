# Voice API

Base URL: `/api/v1/voice`

## Endpoints

### POST /transcribe

Transcribe uploaded audio file to text using OpenAI Whisper.

**Input:**
Multipart Form Data:

- `file`: Audio file (wav, mp3, webm, etc.)

**Output:**

```json
{
  "text": "Transcribed text content..."
}
```

### POST /speak

Convert text to speech using gTTS.

**Input:**
Form Data:

- `text`: "Text to speak"

**Output:**
Audio File (`audio/mpeg`)
