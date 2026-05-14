# Database Schema (Firestore)

Here is the robust NoSQL (Firestore) design schema for "متحف الفكر" showing how the entities are structured to work efficiently with real-time operations, security rules, and gamification tracking.

## Collections & Documents

### `users` collection
Contains the digital identity of every user platform.
**Document ID**: `{uid}` (Matches Auth UID)
- `name`: string (Display name)
- `email`: string
- `specialty`: string (e.g., 'فيلسوف', 'مفكر', 'مبرمج')
- `role`: string (`"super_admin" | "admin" | "user"`)
- `photoURL`: string (Profile avatar)
- `authMethod`: string (`"email" | "google"`)
- `isBanned`: boolean
- `createdAt`: ISO 8601 string
- `lastLogin`: ISO 8601 string

### `ideas` (Posts) collection
Core content engine supporting thoughts, articles, and hashtags.
**Document ID**: Auto-generated
- `authorId`: string (Ref -> `users/{uid}`)
- `author`: string (Denormalized display name)
- `authorRole`: string (Denormalized role)
- `title`: string
- `content`: string (Long-form supported)
- `category`: string (`"أدب" | "علوم" | "تقنية" | "فن" | "تطوير المهارات"`)
- `hashtags`: array of strings
- `isPinned`: boolean (Frontend checked: Max 3 per auth profile)
- `pinnedAt`: ISO 8601 string (null if not pinned)
- `likes`: number (Aggregated, or incremented locally securely)
- `views`: number (Used for trending computation)
- `deleted`: boolean (Soft delete flag to preserve history dependencies)
- `createdAt`: ISO 8601 string

### `idea_likes` collection (Sub-collection logic behavior)
Used to track who liked what to prevent double-liking.
**Document ID**: `{ideaId}_{userId}`
- `ideaId`: string
- `userId`: string
- `createdAt`: ISO 8601 string

### `comments` (Idea Responses) collection
**Document ID**: Auto-generated
- `ideaId`: string (Ref -> `ideas/{id}`)
- `authorId`: string
- `author`: string
- `content`: string
- `deleted`: boolean
- `createdAt`: ISO 8601 string

### `follows` collection (Social Graph Engine)
Tracks the relation graph for the "Network" logic.
**Document ID**: `{followerId}_{followingId}`
- `followerId`: string (The one who clicks follow)
- `followingId`: string (The target user)
- `createdAt`: ISO 8601 string

### `bookmarks` collection (Content Saving System)
For user bookmarks in the 'Skills & Resources' area.
**Document ID**: Auto-generated
- `userId`: string
- `courseId`: string (Ref -> external resource or internal course ID)
- `createdAt`: ISO 8601 string

### `admin_audit_logs` collection (Security & Transparency)
Immutable log of admin/moderator actions to ensure RBAC integrity.
**Document ID**: Auto-generated
- `adminId`: string
- `adminName`: string
- `actionType`: string (`"ban_user" | "unban_user" | "promote_admin" | "demote_admin" | "delete_idea" | "update_settings"`)
- `targetId`: string (ID of user or post affected)
- `targetName`: string (Name of user or post affected)
- `details`: string (JSON or string context, e.g. "حظر بسبب مخالفة...")
- `timestamp`: ISO 8601 string

### `messages` collection (Support & Inbox)
Allows bidirectional communication between users and the admin support.
**Document ID**: Auto-generated
- `senderId`: string
- `senderName`: string
- `recipientId`: string (`"admin"` or specific `{userId}`)
- `content`: string
- `createdAt`: ISO 8601 string
- `read`: boolean

---

## Technical Considerations:
1. **Denormalization:** We store `author` and `authorRole` in the `ideas` payload to reduce `user` doc reads (read optimization).
2. **Soft Deletes:** Deletions on `ideas` just mark `deleted: true` or happen via secure functions so related `comments` and `likes` aren't orphaned instantly causing cascade failures.
3. **Atomic Operations:** Follow count and pinning limits (max 3) are strictly verified before committing writes. Auto-Level ups use Firestore update operations triggering when a local matrix calculates a new role dynamically.
