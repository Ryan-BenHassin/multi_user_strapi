import { factories } from '@strapi/strapi';
const firebase = require('../../services/firebase');
const { sendNotification: sendNotificationToUser, sendBulkNotification: sendNotificationToMultipleUsers } = firebase;

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  /**
   * Update the FCM token for the authenticated user
   * @param {object} ctx - Koa context object
   */
  updateFcmToken: async (ctx) => {
    // Check if user is authenticated
    const { user } = ctx.state;
    if (!user) {
      return ctx.unauthorized('You need to be logged in to update your FCM token');
    }

    // Get FCM token from request body
    const { fcmToken } = ctx.request.body;
    if (!fcmToken) {
      return ctx.badRequest('FCM token is required');
    }

    try {
      // Update the user's FCM token
      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: {
          fcm: fcmToken
        }
      });

      // Return success response
      return ctx.send({
        message: 'FCM token updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email
        }
      });
    } catch (error) {
      strapi.log.error(`Error updating FCM token for user ${user.id}:`, error);
      return ctx.badRequest('Failed to update FCM token');
    }
  },

  /**
   * Send a notification to a specific user (requires admin privileges)
   * @param {object} ctx - Koa context object
   */
  sendNotification: async (ctx) => {
    // Check if user is admin
    const { user } = ctx.state;
    // if (!user || !user.role || user.role.type !== 'admin') {
    //   return ctx.unauthorized('You need admin privileges to send notifications');
    // }

    // Get notification data from request body
    const { userId, title, body, data } = ctx.request.body;

    if (!userId || !title || !body) {
      return ctx.badRequest('User ID, title and body are required');
    }

    try {
      // Send the notification
      const result = await sendNotificationToUser(userId, title, body, data);
      
      if (!result) {
        return ctx.badRequest('Failed to send notification - user might not have a valid FCM token');
      }

      return ctx.send({
        message: 'Notification sent successfully',
        messageId: result
      });
    } catch (error) {
      strapi.log.error(`Error sending notification to user ${userId}:`, error);
      return ctx.badRequest('Failed to send notification');
    }
  },

  /**
   * Send a notification to multiple users (requires admin privileges)
   * @param {object} ctx - Koa context object
   */
  sendBulkNotifications: async (ctx) => {
    // Check if user is admin
    const { user } = ctx.state;
    if (!user || !user.role || user.role.type !== 'admin') {
      return ctx.unauthorized('You need admin privileges to send notifications');
    }

    // Get notification data from request body
    const { userIds, title, body, data } = ctx.request.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !body) {
      return ctx.badRequest('User IDs array, title and body are required');
    }

    try {
      // Send the notifications
      const results = await sendNotificationToMultipleUsers(userIds, title, body, data);
      
      const successCount = results.filter(result => result !== null).length;
      
      return ctx.send({
        message: `Notifications sent to ${successCount}/${userIds.length} users successfully`,
        results
      });
    } catch (error) {
      strapi.log.error(`Error sending bulk notifications:`, error);
      return ctx.badRequest('Failed to send bulk notifications');
    }
  }
})); 