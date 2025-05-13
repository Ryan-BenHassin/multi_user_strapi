import { sendNotificationToUser } from '../services';

// Define interface for notification entity
interface NotificationData {
  title: string;
  body: string;
  recipient: number;
  data?: Record<string, string>;
  status: 'SENT' | 'FAILED' | 'DELIVERED' | 'READ';
  notificationType: 'APPOINTMENT' | 'MESSAGE' | 'SYSTEM' | 'OTHER';
}

/**
 * Helper function to send a notification and store it in the database
 * @param userId - The ID of the user to send the notification to
 * @param title - The title of the notification
 * @param body - The message body of the notification
 * @param notificationType - The type of notification (APPOINTMENT, MESSAGE, etc)
 * @param data - Optional data payload to send with the notification
 * @returns Promise with the result of the notification send
 */
export const sendAndStoreNotification = async (
  userId: number,
  title: string,
  body: string,
  notificationType: 'APPOINTMENT' | 'MESSAGE' | 'SYSTEM' | 'OTHER' = 'SYSTEM',
  data?: Record<string, string>
): Promise<any> => {
  try {
    // Send the notification via FCM
    const fcmResult = await sendNotificationToUser(userId, title, body, data);
    
    // Prepare notification data
    const notificationData: NotificationData = {
      title,
      body,
      recipient: userId,
      data,
      status: fcmResult ? 'SENT' : 'FAILED',
      notificationType
    };
    
    // Store the notification in the database
    const notification = await strapi.entityService.create('api::notification.notification', {
      data: notificationData
    });
    
    return {
      success: !!fcmResult,
      notification,
      fcmResult
    };
  } catch (error) {
    strapi.log.error(`Failed to send and store notification to user ${userId}:`, error);
    
    // Even if FCM fails, try to store the notification record
    try {
      // Prepare failed notification data
      const failedNotificationData: NotificationData = {
        title,
        body,
        recipient: userId,
        data,
        status: 'FAILED',
        notificationType
      };
      
      const failedNotification = await strapi.entityService.create('api::notification.notification', {
        data: failedNotificationData
      });
      
      return {
        success: false,
        notification: failedNotification,
        error: error.message
      };
    } catch (dbError) {
      strapi.log.error(`Failed to store failed notification record:`, dbError);
      throw error; // Rethrow the original error
    }
  }
}; 