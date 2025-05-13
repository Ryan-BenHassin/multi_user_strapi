// Simple controller to handle FCM token updates
// Place this file in src/api/user/controllers/user.js

'use strict';

/**
 * A set of functions called "actions" for `users`
 */

module.exports = {
  /**
   * Update FCM token for the authenticated user
   */
  async updateFcmToken(ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return ctx.unauthorized('You need to be logged in');
    }
    
    const { fcmToken } = ctx.request.body;
    
    if (!fcmToken) {
      return ctx.badRequest('FCM token is required');
    }
    
    // Update the user's FCM token
    await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { fcm: fcmToken }
    });
    
    return { success: true };
  }
}; 