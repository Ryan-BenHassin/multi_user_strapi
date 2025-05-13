# Firebase FCM Notifications for Strapi

Super simple Firebase Cloud Messaging integration for Strapi.

## Setup (Only 4 files!)

1. **Install Firebase Admin SDK**:
   ```bash
   npm install firebase-admin
   ```

2. **Create Firebase service file** at `src/services/firebase.ts`:
   - Copy the content from `src/services/firebase.ts` in this project

3. **Add Firebase service account**: 
   - Get a service account key from Firebase Console (Project Settings > Service Accounts)
   - Save as `firebase-service-account.json` in your project root
   - Add to `.gitignore` to keep it secure!

4. **Add the FCM field to your User model**:
   - Go to Content-Type Builder
   - Edit the User model
   - Add a string field named `fcm`

5. **Add the API endpoint to update FCM tokens**:
   - Copy `src/api/user/routes/custom-user.js` 
   - Copy `src/api/user/controllers/user.js`

That's it! Only 4 files to add.

## Usage

### From the client side (Mobile app or browser):

```javascript
// After login, update the FCM token
async function updateFcmToken(fcmToken, jwt) {
  const response = await fetch('/api/users/fcm-token', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify({ fcmToken })
  });
  return response.json();
}

// Call this when you have a new FCM token
updateFcmToken(firebase.messaging().getToken(), authToken);
```

### From the server side (Strapi):

```javascript
// Import the notification function in any Strapi file
import { sendNotification } from '../../services/firebase';

// In a controller function
async myFunction(ctx) {
  // ... your code ...
  
  // Send a notification to a user
  await sendNotification(
    userId,               // User ID (number)
    'Notification Title', // Title
    'Message content',    // Body
    { key: 'value' }      // Optional data payload
  );
  
  // ... more code ...
}
```

## Examples

### Send a notification when a comment is created:

```javascript
// In src/api/comment/controllers/comment.js
async create(ctx) {
  const { sendNotification } = require('../../../services/firebase');
  
  // Regular create logic
  const result = await super.create(ctx);
  const commentId = result.data.id;
  
  // Get the full comment data
  const comment = await strapi.entityService.findOne('api::comment.comment', commentId, {
    populate: ['post', 'post.author']
  });
  
  // Notify the post author
  if (comment.post?.author?.id) {
    await sendNotification(
      comment.post.author.id,
      'New Comment',
      `Someone commented on your post: ${comment.content.substring(0, 50)}...`,
      {
        type: 'NEW_COMMENT',
        commentId: commentId.toString(),
        postId: comment.post.id.toString()
      }
    );
  }
  
  return result;
}
```

### Send multiple notifications at once:

```javascript
import { sendBulkNotification } from '../../../services/firebase';

// Send to multiple users
await sendBulkNotification(
  [1, 2, 3], // Array of user IDs
  'Announcement',
  'This is an important announcement!',
  { type: 'ANNOUNCEMENT' }
);
```

## Testing

To test if notifications are working:

1. Update a user's FCM token through the API
2. Use the Strapi shell:

```javascript
// In Strapi console (npm run strapi console)
await strapi.service('api::firebase.firebase').sendNotification(
  1,  // User ID
  'Test Notification',
  'This is a test notification!',
  { type: 'TEST' }
);
``` 