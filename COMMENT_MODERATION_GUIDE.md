# Comment Moderation System - Implementation Guide

## Overview
This document describes the flag-based comment moderation system implemented for SereneSpace. The system includes safety features, soft delete, and proper access controls.

---

## 🗄️ Updated Prisma Schema

### Comment Model (Enhanced)
```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  post      Post     @relation(fields: [postId], references: [id])
  postId    Int
  user      User?    @relation(fields: [userId], references: [id])
  userId    Int?
  content   String
  likes     Int      @default(0)
  flagged   Boolean  @default(false)
  flagCount Int      @default(0)          // NEW: Track number of flags
  deleted   Boolean  @default(false)      // NEW: Soft delete flag
  deletedAt DateTime?                     // NEW: Timestamp of deletion
  hiddenByModerator Boolean @default(false) // NEW: Moderator hide action
  moderatorNote String?                   // NEW: Note from moderator
  createdAt DateTime @default(now())
  flags     CommentFlag[]                 // NEW: Related flags
  reactions CommentReaction[]             // NEW: Track likes
}
```

### New Models

#### CommentFlag Model
```prisma
model CommentFlag {
  id        Int      @id @default(autoincrement())
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId Int
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  reason    String?
  createdAt DateTime @default(now())
  
  @@unique([commentId, userId]) // Prevents duplicate flags
}
```

#### CommentReaction Model
```prisma
model CommentReaction {
  id        Int      @id @default(autoincrement())
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId Int
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  createdAt DateTime @default(now())
  
  @@unique([commentId, userId]) // One like per user per comment
}
```

---

## 🔐 Safety Features Implemented

### 1. **Prevent Self-Flagging**
Users cannot flag their own comments.

### 2. **Prevent Duplicate Flags**
Database constraint ensures each user can only flag a comment once.

### 3. **Soft Delete**
Comments are marked as deleted (with timestamp) instead of being removed from the database.

### 4. **Comment Visibility Filtering**
- **Regular users**: See only non-deleted, non-hidden comments
- **Admins/Counselors**: See all comments except soft-deleted ones

### 5. **Proper Error Handling**
All endpoints include comprehensive error handling and validation.

---

## 🛠️ Helper Functions

### getCommentFilter(userRole)
Returns appropriate filter for comment queries based on user role:
```javascript
function getCommentFilter(userRole) {
  // Admins and counselors can see all comments except soft-deleted ones
  if (userRole === 'admin' || userRole === 'counselor') {
    return { deleted: false };
  }
  
  // Regular users can only see non-deleted, non-hidden comments
  return {
    deleted: false,
    hiddenByModerator: false
  };
}
```

### canModerate(userRole)
Checks if user can perform moderation actions:
```javascript
function canModerate(userRole) {
  return userRole === 'admin' || userRole === 'counselor';
}
```

---

## 📝 Updated Routes

### 1. Get All Posts (Updated)
**Endpoint**: `GET /api/posts`  
**Authentication**: Optional (supports anonymous and authenticated users)

**Changes**:
- Now filters comments based on user role
- Uses `optionalAuthenticateJWT` middleware
- Applies `getCommentFilter()` to exclude deleted/hidden comments

**Example Response**:
```json
{
  "posts": [
    {
      "id": 1,
      "title": "My Journey with Anxiety",
      "content": "Sharing my story...",
      "likes": 5,
      "flagged": false,
      "createdAt": "2026-02-17T10:00:00.000Z",
      "user": {
        "id": 2,
        "email": "user@example.com",
        "role": "user"
      },
      "comments": [
        {
          "id": 1,
          "content": "Thank you for sharing!",
          "likes": 2,
          "flagged": false,
          "deleted": false,
          "hiddenByModerator": false,
          "createdAt": "2026-02-17T10:30:00.000Z",
          "user": {
            "id": 3,
            "email": "supportive@example.com",
            "role": "user"
          }
        }
        // Hidden or deleted comments are automatically filtered out
      ]
    }
  ]
}
```

### 2. Get Specific Post (Updated)
**Endpoint**: `GET /api/posts/:id`  
**Authentication**: Optional

**Changes**: Same as above - filters comments appropriately.

### 3. Delete Comment (Updated - Soft Delete)
**Endpoint**: `DELETE /api/comments/:id`  
**Authentication**: Required  
**Authorization**: Comment owner or admin

**Changes**:
- Now performs soft delete instead of hard delete
- Sets `deleted: true` and `deletedAt: timestamp`
- Cannot delete already-deleted comments

**Example Response**:
```json
{
  "message": "Comment deleted successfully"
}
```

**Error Cases**:
```json
// Already deleted
{
  "error": "Comment already deleted"
}

// Not authorized
{
  "error": "Forbidden"
}
```

### 4. Flag Comment (Enhanced with Safety Checks)
**Endpoint**: `POST /api/comments/:id/flag`  
**Authentication**: Required  
**Body**: `{ "reason": "Inappropriate content" }` (optional)

**Safety Checks**:
1. ✅ Comment must exist
2. ✅ Cannot flag deleted comments
3. ✅ Cannot flag own comment
4. ✅ Cannot flag same comment twice
5. ✅ Increments `flagCount` on the comment

**Example Request**:
```json
{
  "reason": "This comment contains inappropriate content"
}
```

**Success Response**:
```json
{
  "message": "Comment flagged for review",
  "flag": {
    "id": 1,
    "commentId": 5,
    "userId": 2,
    "reason": "This comment contains inappropriate content",
    "createdAt": "2026-02-17T11:00:00.000Z"
  },
  "flagCount": 3
}
```

**Error Responses**:
```json
// Flagging own comment
{
  "error": "You cannot flag your own comment"
}

// Already flagged
{
  "error": "You have already flagged this comment"
}

// Comment deleted
{
  "error": "Cannot flag a deleted comment"
}
```

---

## 👮 Moderation Routes (Admin/Counselor Only)

### 1. Get All Flagged Comments
**Endpoint**: `GET /api/moderation/flagged-comments`  
**Authentication**: Required  
**Authorization**: Admin or Counselor

**Response**:
```json
{
  "flaggedComments": [
    {
      "id": 5,
      "content": "This is an inappropriate comment",
      "likes": 0,
      "flagged": true,
      "flagCount": 3,
      "deleted": false,
      "hiddenByModerator": false,
      "moderatorNote": null,
      "createdAt": "2026-02-17T09:00:00.000Z",
      "user": {
        "id": 4,
        "email": "problematic@example.com",
        "role": "user"
      },
      "post": {
        "id": 2,
        "title": "Support Thread"
      },
      "flags": [
        {
          "id": 1,
          "reason": "Inappropriate content",
          "createdAt": "2026-02-17T09:30:00.000Z",
          "user": {
            "id": 2,
            "email": "reporter1@example.com"
          }
        },
        {
          "id": 2,
          "reason": "Offensive language",
          "createdAt": "2026-02-17T09:45:00.000Z",
          "user": {
            "id": 3,
            "email": "reporter2@example.com"
          }
        },
        {
          "id": 3,
          "reason": "Harassment",
          "createdAt": "2026-02-17T10:00:00.000Z",
          "user": {
            "id": 5,
            "email": "reporter3@example.com"
          }
        }
      ]
    }
  ],
  "total": 1
}
```

### 2. Get Flags for Specific Comment
**Endpoint**: `GET /api/comments/:id/flags`  
**Authentication**: Required  
**Authorization**: Admin or Counselor

**Response**:
```json
{
  "comment": {
    "id": 5,
    "content": "This is an inappropriate comment",
    "flagCount": 3,
    "flagged": true,
    "hiddenByModerator": false,
    "moderatorNote": null,
    "author": {
      "id": 4,
      "email": "problematic@example.com",
      "role": "user"
    }
  },
  "flags": [
    {
      "id": 1,
      "reason": "Inappropriate content",
      "createdAt": "2026-02-17T09:30:00.000Z",
      "user": {
        "id": 2,
        "email": "reporter1@example.com",
        "role": "user"
      }
    }
    // ... more flags
  ]
}
```

### 3. Hide Comment
**Endpoint**: `POST /api/moderation/comments/:id/hide`  
**Authentication**: Required  
**Authorization**: Admin or Counselor  
**Body**: `{ "moderatorNote": "Reason for hiding" }` (optional)

**Request**:
```json
{
  "moderatorNote": "Comment violates community guidelines - inappropriate language"
}
```

**Success Response**:
```json
{
  "message": "Comment hidden successfully",
  "comment": {
    "id": 5,
    "hiddenByModerator": true,
    "moderatorNote": "Comment violates community guidelines - inappropriate language"
  }
}
```

**Error Cases**:
```json
// Already hidden
{
  "error": "Comment is already hidden"
}

// Comment deleted
{
  "error": "Cannot hide a deleted comment"
}
```

### 4. Unhide Comment
**Endpoint**: `POST /api/moderation/comments/:id/unhide`  
**Authentication**: Required  
**Authorization**: Admin or Counselor

**Success Response**:
```json
{
  "message": "Comment unhidden successfully",
  "comment": {
    "id": 5,
    "hiddenByModerator": false
  }
}
```

**Error Cases**:
```json
// Not hidden
{
  "error": "Comment is not hidden"
}
```

### 5. Clear All Flags from Comment
**Endpoint**: `DELETE /api/moderation/comments/:id/flags`  
**Authentication**: Required  
**Authorization**: Admin only (not counselor)

**Success Response**:
```json
{
  "message": "All flags cleared successfully",
  "comment": {
    "id": 5,
    "flagged": false,
    "flagCount": 0
  }
}
```

---

## 🔄 Impact on Existing Functionality

### ✅ Existing Features Preserved
- Comment creation - **NO CHANGES**
- Comment updating - **NO CHANGES**
- Comment liking - **NO CHANGES**
- Post creation/update - **NO CHANGES**

### ✨ Enhanced Features
- **Comment fetching**: Now automatically filters deleted/hidden comments
- **Post fetching**: Includes filtered comments based on user role
- **Comment deletion**: Changed from hard delete to soft delete

---

## 🎯 Usage Workflow

### For Regular Users

1. **View Posts/Comments**:
   - Only see non-deleted, non-hidden comments
   - Hidden/deleted comments are invisible

2. **Flag Inappropriate Comment**:
   ```bash
   POST /api/comments/5/flag
   Authorization: Bearer <token>
   Content-Type: application/json
   
   {"reason": "Inappropriate content"}
   ```

3. **Delete Own Comment**:
   ```bash
   DELETE /api/comments/5
   Authorization: Bearer <token>
   ```
   - Comment is soft-deleted
   - Still in database but invisible

### For Admins/Counselors

1. **View All Flagged Comments**:
   ```bash
   GET /api/moderation/flagged-comments
   Authorization: Bearer <admin_token>
   ```

2. **Review Specific Flags**:
   ```bash
   GET /api/comments/5/flags
   Authorization: Bearer <admin_token>
   ```

3. **Hide Problematic Comment**:
   ```bash
   POST /api/moderation/comments/5/hide
   Authorization: Bearer <admin_token>
   Content-Type: application/json
   
   {"moderatorNote": "Violates community guidelines"}
   ```

4. **Clear Flags if False Positive**:
   ```bash
   DELETE /api/moderation/comments/5/flags
   Authorization: Bearer <admin_token>
   ```

---

## 🚀 Testing the System

### Test Scenarios

#### Scenario 1: Flag a Comment
1. Create a comment as User A
2. Try to flag it as User A ❌ (should fail - cannot flag own)
3. Flag it as User B ✅ (should succeed)
4. Try to flag again as User B ❌ (should fail - duplicate flag)
5. Flag it as User C ✅ (should succeed)
6. Check `flagCount` is now 2

#### Scenario 2: Soft Delete
1. Create comment as User A
2. Delete comment as User A ✅
3. Try to view comment as User B ❌ (invisible)
4. View comment as Admin ❌ (still invisible, respects soft delete)

#### Scenario 3: Moderation Flow
1. Multiple users flag Comment X
2. Admin views flagged comments
3. Admin reviews flags for Comment X
4. Admin hides comment with note
5. Regular users can no longer see it
6. Admin can unhide if needed

---

## 📊 Database Migration

The migration file created: `20260216190400_add_comment_moderation_system`

**Applied Changes**:
- Added `CommentFlag` table
- Added `PostReaction` table
- Added `CommentReaction` table
- Updated `Comment` table with new fields:
  - `flagCount`
  - `deleted`
  - `deletedAt`
  - `hiddenByModerator`
  - `moderatorNote`

**To Apply**:
```bash
cd backend/express
npx prisma migrate deploy
```

---

## 🔒 Security Considerations

1. **Authorization**: All moderation routes require appropriate role
2. **Validation**: All inputs validated before processing
3. **Database Constraints**: Unique constraints prevent duplicate flags
4. **Cascade Delete**: Flags deleted when comment is hard-deleted
5. **Audit Trail**: All flags tracked with user ID and timestamp

---

## 🎨 Clean & Scalable Design

### Separation of Concerns
- Helper functions for reusable logic
- Middleware for authentication/authorization
- Clear route organization

### Extensibility
- Easy to add new flag reasons
- Can add threshold for auto-hiding
- Can implement flag analytics
- Can add email notifications for moderators

### Performance
- Index on `commentId` and `userId` for fast flag lookups
- Efficient query filtering
- Cascade deletes for cleanup

---

## 📝 Summary

✅ **Flag-based moderation system implemented**  
✅ **Safety features: No self-flag, no duplicate flags**  
✅ **Soft delete instead of hard delete**  
✅ **Proper error handling throughout**  
✅ **Existing comment functionality preserved**  
✅ **Comment queries auto-filter deleted/hidden content**  
✅ **Clean, scalable implementation**  
✅ **Comprehensive moderation tools for admins**

The system is production-ready and provides a robust foundation for community moderation in SereneSpace!
