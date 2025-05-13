# Firebase Cloud Messaging (FCM) Integration

This document explains how to set up and use Firebase Cloud Messaging (FCM) for sending push notifications to users in the Strapi application.

## Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Add your mobile application to the project (iOS/Android)

### 2. Generate a Service Account Key

1. In your Firebase project, navigate to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the downloaded JSON file as `firebase-service-account.json` in the root directory of your Strapi project

### 3. Set Up Mobile Applications

#### For iOS:
- Follow the [Firebase iOS SDK setup guide](https://firebase.google.com/docs/ios/setup)
- Implement FCM using the [Firebase Messaging guide for iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)

#### For Android:
- Follow the [Firebase Android SDK setup guide](https://firebase.google.com/docs/android/setup)
- Implement FCM using the [Firebase Messaging guide for Android](https://firebase.google.com/docs/cloud-messaging/android/client)

## API Endpoints

### Update FCM Token

When a user logs in on a mobile device, send their FCM token to the backend:

```
PUT /api/notifications/update-token
```

Request body:
```json
{
  "fcmToken": "user-fcm-token-from-firebase"
}
```

### Send Notification to a User (Admin only)

```
POST /api/notifications/send
```

Request body:
```json
{
  "userId": 1,
  "title": "Notification Title",
  "body": "Notification message body",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### Send Bulk Notifications (Admin only)

```
POST /api/notifications/send-bulk
```

Request body:
```json
{
  "userIds": [1, 2, 3],
  "title": "Notification Title",
  "body": "Notification message body",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

## Using Notifications in Your Code

You can send notifications from anywhere in your code using the utility function:

```typescript
import { sendAndStoreNotification } from '../utils';

// Send a notification
await sendAndStoreNotification(
  userId,            // User ID
  'Notification Title',
  'Notification message body',
  'APPOINTMENT',     // Notification type: 'APPOINTMENT', 'MESSAGE', 'SYSTEM', 'OTHER'
  {                  // Optional data payload
    key1: 'value1',
    key2: 'value2'
  }
);
```

## Troubleshooting

- Ensure `firebase-service-account.json` is present in the root directory and has the correct permissions
- Check the Strapi logs for any Firebase initialization or sending errors
- Verify that user FCM tokens are being correctly stored in the database
- For mobile app issues, check the Firebase console for delivery reports and errors

## Security Considerations

- The Firebase service account key grants access to your Firebase project. Never commit it to version control.
- Consider adding the key to your deployment environment variables in production
- All admin notification endpoints should be properly secured with authentication and role-based permissions

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM HTTP v1 API Reference](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup) 