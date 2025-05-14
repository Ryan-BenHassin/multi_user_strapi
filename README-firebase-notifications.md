# Firebase Notifications API for Strapi

A complete API for sending and managing push notifications via Firebase Cloud Messaging (FCM) in Strapi. Includes a notification collection type to store notification history for each user.

## Setup

1. **Install Firebase Admin SDK**:
   ```bash
   npm install firebase-admin
   ```

2. **Get Firebase Service Account**:
   - Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in your project root

3. **Add to `.gitignore`**:
   ```
   # Firebase
   firebase-service-account.json
   ```

4. **Add FCM field to User model**:
   - In Strapi admin, go to Content-Type Builder
   - Edit the User model (plugin::users-permissions.user)
   - Add a string field named `fcm`
   - Add a relation field named `notifications` (One-to-Many)

5. **Add these files to your project**:
   - `src/api/services/firebase.ts` - Firebase notification service
   - `src/api/notification/controllers/notification.js` - API controller
   - `src/api/notification/routes/notification.js` - API routes
   - `src/api/notification/content-types/notification/schema.json` - Notification model schema

## Notification Collection Type

The system includes a Notification collection type that stores a history of all notifications sent to users. This allows you to:

- Keep a record of all notifications
- Track read/unread status
- Display notification history in your app
- Group notifications by type

Each notification includes:
- Title and body
- User relation
- Read status
- Notification type
- Delivery status
- Optional data payload
- Firebase message ID (if sent successfully)

## API Endpoints

### Update FCM Token

Updates the FCM token for the current authenticated user.

```
PUT /api/notifications/token
```

Request body:
```json
{
  "fcmToken": "user-device-fcm-token-from-firebase"
}
```

Response:
```json
{
  "success": true,
  "message": "FCM token updated successfully"
}
```

### Send Notification to a User

Sends a notification to a specific user and stores it in the database. Regular users can only send to themselves.
Admins can send to any user.

```
POST /api/notifications/send
```

Request body:
```json
{
  "userId": 1,
  "title": "Notification Title",
  "body": "This is the notification message",
  "notificationType": "message", // Optional, defaults to "general"
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

Response:
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "title": "Notification Title",
    "body": "This is the notification message",
    "status": "sent",
    "read": false,
    "notificationType": "message",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  },
  "messageId": "projects/your-project/messages/message-id"
}
```

### Send Bulk Notifications (Admin Only)

Sends notifications to multiple users at once and stores them in the database. Admin only.

```
POST /api/notifications/send-bulk
```

Request body:
```json
{
  "userIds": [1, 2, 3],
  "title": "Bulk Notification",
  "body": "This is a notification sent to multiple users",
  "notificationType": "announcement", // Optional, defaults to "general"
  "data": {
    "type": "ANNOUNCEMENT",
    "actionId": "123"
  }
}
```

Response:
```json
{
  "success": true,
  "sent": 3,
  "total": 3,
  "notifications": [
    {
      "id": 1,
      "title": "Bulk Notification",
      "body": "This is a notification sent to multiple users",
      "status": "sent",
      "read": false,
      "notificationType": "announcement",
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z"
    },
    // More notifications...
  ]
}
```

### Get User's Notifications

Gets all notifications for the current authenticated user.

```
GET /api/notifications/me
```

Query parameters:
- `page`: Page number (default: 1)
- `pageSize`: Number of items per page (default: 20)
- `read`: Filter by read status (true/false)

Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Notification Title",
      "body": "This is the notification message",
      "status": "sent",
      "read": false,
      "notificationType": "message",
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z",
      "user": {
        "id": 1,
        "username": "user1"
      }
    },
    // More notifications...
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "pageCount": 1,
    "total": 5
  }
}
```

### Mark Notifications as Read

Marks one or more notifications as read.

```
PUT /api/notifications/mark-read
```

Request body:
```json
{
  "ids": [1, 2, 3] // Can also be a single ID: "ids": 1
}
```

Response:
```json
{
  "success": true,
  "message": "3 notifications marked as read"
}
```

### Delete Notifications

Deletes one or more notifications.

```
DELETE /api/notifications/delete
```

Request body:
```json
{
  "ids": [1, 2, 3] // Can also be a single ID: "ids": 1
}
```

Response:
```json
{
  "success": true,
  "message": "3 notifications deleted"
}
```

## Using in Your Code

You can also use the Firebase service directly in your code:

```javascript
// Import in any file
const { sendNotification, sendBulkNotification } = require('../../api/services/firebase');

// Send notification
await sendNotification(
  userId,               // User ID
  'Notification Title', // Title
  'Message content',    // Body
  { key: 'value' }      // Optional data payload
);

// Send to multiple users
await sendBulkNotification(
  [1, 2, 3],            // User IDs array
  'Bulk Notification',
  'Message for multiple users',
  { type: 'BULK_MESSAGE' }
);
```

## Client Integration

On your client app (mobile or web), you need to:

1. **Set up Firebase** in your app
2. **Get the FCM token** from Firebase
3. **Send the token to Strapi** when the user logs in:

```javascript
// Example in React Native
import messaging from '@react-native-firebase/messaging';

// Get FCM token
const getFcmToken = async () => {
  const token = await messaging.getToken();
  
  // Send to Strapi
  await fetch('https://your-strapi-api.com/api/notifications/token', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userJwt}`
    },
    body: JSON.stringify({ fcmToken: token })
  });
}
```

## Displaying Notifications in Your Client App

To display notifications in your client app:

1. **Fetch notifications** from the API:
```javascript
const fetchNotifications = async () => {
  const response = await fetch('https://your-strapi-api.com/api/notifications/me?read=false', {
    headers: {
      'Authorization': `Bearer ${userJwt}`
    }
  });
  
  return response.json();
}
```

2. **Mark notifications as read** when the user views them:
```javascript
const markAsRead = async (notificationIds) => {
  await fetch('https://your-strapi-api.com/api/notifications/mark-read', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userJwt}`
    },
    body: JSON.stringify({ ids: notificationIds })
  });
}
```

## Testing

To test if your setup is working:

1. Get a valid FCM token from a test device
2. Update a user's FCM token using the API
3. Send a test notification using the `/api/notifications/send` endpoint
4. Retrieve the user's notifications using the `/api/notifications/me` endpoint 