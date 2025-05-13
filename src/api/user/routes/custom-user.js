// Simple route to update FCM token for a user
// Place this file in src/api/user/routes/custom-user.js

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/users/fcm-token',
      handler: 'user.updateFcmToken',
      config: {
        auth: true,
        description: 'Update FCM token for a user',
        tag: {
          plugin: 'users-permissions',
          name: 'User'
        }
      }
    }
  ]
}; 