import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Simple Firebase notification service for Strapi
 * Just drop this file in src/api/services/firebase.ts and use sendNotification anywhere in your code
 * Requires firebase-service-account.json in your project root (add to .gitignore!)
 * 
 * Usage:
 * import { sendNotification } from 'path/to/firebase';
 * 
 * // Simple usage
 * sendNotification(userId, 'Title', 'Message body');
 * 
 * // With data payload
 * sendNotification(userId, 'Title', 'Message', { key: 'value' });
 */

// State flag to prevent multiple initializations
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK (called automatically when needed)
 */
const initializeFirebase = () => {
  if (firebaseInitialized) return;
  
  try {
    // Read the service account file from project root
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Firebase initialization failed. Make sure firebase-service-account.json exists in project root.');
  }
};

/**
 * Send a notification to a user based on their FCM token
 * 
 * @param userId - The user ID to send the notification to
 * @param title - The notification title
 * @param body - The notification message body
 * @param data - Optional data payload as key-value pairs
 * @returns Promise with the message ID if successful, null otherwise
 */
exports.sendNotification = async (
  userId: number,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string | null> => {
  try {
    // Initialize Firebase if not already done
    if (!firebaseInitialized) {
      initializeFirebase();
    }
    
    // Find the user and get their FCM token
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      fields: ['fcm']
    });
    
    if (!user || !user.fcm) {
      console.warn(`No FCM token found for user ID ${userId}`);
      return null;
    }
    
    // Build the notification message
    const message: admin.messaging.Message = {
      notification: {
        title,
        body
      },
      token: user.fcm
    };
    
    // Add optional data payload if provided
    if (data) {
      message.data = data;
    }
    
    // Send the notification
    const response = await admin.messaging().send(message);
    console.log(`Notification sent to user ID ${userId}, messageId: ${response}`);
    return response;
  } catch (error) {
    console.error(`Failed to send notification to user ID ${userId}:`, error);
    return null;
  }
};

/**
 * Send the same notification to multiple users
 * 
 * @param userIds - Array of user IDs to send the notification to
 * @param title - The notification title
 * @param body - The notification message body
 * @param data - Optional data payload as key-value pairs
 * @returns Array of message IDs or null values for each user
 */
exports.sendBulkNotification = async (
  userIds: number[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<(string | null)[]> => {
  const promises = userIds.map(userId => exports.sendNotification(userId, title, body, data));
  return Promise.all(promises);
}; 