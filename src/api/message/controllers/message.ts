/**
 * message controller
 */

import { factories } from '@strapi/strapi'
import { sendAndStoreNotification } from '../../../utils'

// Define a type for Message entity 
interface MessageWithRelations {
  id: number;
  content?: string; // This will need to be added to the schema
  sender?: {
    id: number;
    username?: string;
  };
  recipient?: {
    id: number;
  };
  [key: string]: any;
}

export default factories.createCoreController('api::message.message', ({ strapi }) => ({
  // Override create method to send notification when a new message is created
  async create(ctx) {
    // Call the default create method
    const response = await super.create(ctx);
    
    try {
      // Get the created message
      const message = await strapi.entityService.findOne('api::message.message', response.data.id) as MessageWithRelations;
      
      // If we have a recipient and content, send a notification
      // Note: You'll need to add recipient, sender, and content fields to your message schema
      if (message.recipient && message.recipient.id) {
        const recipientId = message.recipient.id;
        const senderName = message.sender && message.sender.username ? 
          message.sender.username : 
          'Someone';
        
        // Get content from the message or use a default
        const messageText = message.content || 'You received a new message';
        const truncatedMessage = messageText.length > 50 
          ? `${messageText.substring(0, 47)}...` 
          : messageText;
        
        // Send notification to the recipient
        await sendAndStoreNotification(
          recipientId,
          `New message from ${senderName}`,
          truncatedMessage,
          'MESSAGE',
          {
            messageId: message.id.toString(),
            senderId: message.sender ? message.sender.id.toString() : '',
            type: 'NEW_MESSAGE'
          }
        );
      }
    } catch (error) {
      // Log the error but don't fail the request
      strapi.log.error('Failed to send message notification:', error);
    }
    
    return response;
  }
}));
