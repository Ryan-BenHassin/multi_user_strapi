export default {
  routes: [
    // Route to update the FCM token for the authenticated user
    {
      method: 'PUT',
      path: '/notifications/update-token',
      handler: 'notification.updateFcmToken',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Route to send a notification to a specific user (admin only)
    {
      method: 'POST',
      path: '/notifications/send',
      handler: 'notification.sendNotification',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Route to send notifications to multiple users (admin only)
    {
      method: 'POST',
      path: '/notifications/send-bulk',
      handler: 'notification.sendBulkNotifications',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
}; 