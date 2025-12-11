# Profiles API

Base URL: `/api/v1/profiles`

## Endpoints

### GET /{user_id}

Get public profile of a user.

**Output:**

```json
{
  "user_id": "...",
  "bio": "...",
  "avatar_url": "...",
  "followers_count": 10,
  "following_count": 5
}
```

### PUT /me

Update own profile.

**Input:**

```json
{
  "bio": "Hello world",
  "location": "New York"
}
```

**Output:**

```json
{
  "message": "Profile updated successfully"
}
```

### POST /me/avatar

Upload profile avatar.

**Input:**
Multipart File `file`.

**Output:**

```json
{
  "avatar_url": "http://..."
}
```

### POST /{target_user_id}/follow

Follow a user.

### DELETE /{target_user_id}/follow

Unfollow a user.

### GET /{user_id}/followers

List followers.

### GET /{user_id}/following

List following.
