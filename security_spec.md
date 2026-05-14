# Security Specification for Museum of Thought

## Data Invariants
1. **Users**: Every user document must be owned by the authenticated user (`userId == auth.uid`). Roles (`admin`, `super_admin`) and status (`isBanned`) can only be modified by admins.
2. **Ideas**: Must have a valid `authorId` matching the creator's UID. Public users can only increment `views` and `likes` through a specific transition that appends their UID to `viewedBy`/`likedBy` to prevent multi-votes.
3. **Comments**: Must be linked to an existing `ideaId`. Users can only edit/delete their own comments.
4. **Follows**: Relationships must specify a `followerId` matching the authenticated user.
5. **Admins**: Admin access is verified by checking the `role` field in the `users` collection.
6. **Integrity**: All IDs must match `^[a-zA-Z0-9_\\-]+$` and be within size limits. All timestamps must be server-generated.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Privilege Escalation**: A normal user tries to update their `role` to 'admin'.
3. **Ghost Field Injection**: Adding an `isVerified: true` field to an idea document during update.
4. **ID Poisoning**: Creating an idea with an ID that is 2KB in size or containing non-alphanumeric characters.
5. **Resource Exhaustion**: Sending a 1MB string in the `title` of an idea.
6. **State Shortcutting**: Marking a `bookmark` as `verified` (if such field existed) without going through logic.
7. **Relational Orphan**: Creating a comment for an `ideaId` that does not exist.
8. **PII Leak**: A user attempting to `get` the email of another user whom they do not follow and is not public (if restricted).
9. **Update Gap**: Changing the `authorId` of an idea after it has been created to "take over" the post.
10. **Multi-Vote Attack**: Incrementing `likes` by 10 in a single transaction without adding the UID to an array.
11. **Negative Count Attack**: Decrementing `views` below zero.
12. **System Field Tampering**: Modifying `createdAt` during an update.

## Hardened Patterns implementation
- Use `isValidId(id)` on every match variable.
- Use `isValid[Entity](data)` for create and update.
- Split update into specific action branches using `affectedKeys().hasOnly()`.
- Enforce server timestamps.
- Explicitly block user-profile fields like `role` from being updated by the user.

---
*Drafted by Google AI Studio Security Auditor*
