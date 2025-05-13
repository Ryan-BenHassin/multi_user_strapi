/**
 * appointment controller
 */

import { factories } from '@strapi/strapi'
import { sendAndStoreNotification } from '../../../utils'

// Define a type for the appointment with patient and doctor relations
interface AppointmentWithRelations {
  id: number;
  date: string;
  patient?: {
    users_permissions_user?: {
      id: number;
      username: string;
      firstname?: string;
      lastname?: string;
    }
  };
  doctor?: {
    users_permissions_user?: {
      id: number;
      username: string;
      firstname?: string;
      lastname?: string;
    }
  };
  office?: any;
  status_appointment?: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'REJECTED';
  [key: string]: any;
}

export default factories.createCoreController('api::appointment.appointment', ({ strapi }) => ({
  // Override the create method to send notifications
  async create(ctx) {
    // Call the default create method
    const response = await super.create(ctx)
    
    try {
      // Get the created appointment with patient and doctor info
      const appointment = await strapi.entityService.findOne('api::appointment.appointment', response.data.id, {
        populate: ['patient.users_permissions_user', 'doctor.users_permissions_user', 'office']
      }) as AppointmentWithRelations;
      
      // Get the patient and doctor IDs
      const patientUser = appointment.patient?.users_permissions_user
      const doctorUser = appointment.doctor?.users_permissions_user
      
      if (patientUser && patientUser.id) {
        // Get the doctor name for the notification
        const doctorName = doctorUser ? 
          `${doctorUser.firstname || ''} ${doctorUser.lastname || ''}`.trim() || doctorUser.username : 
          'Your doctor'
        
        // Format the appointment date
        const appointmentDate = new Date(appointment.date)
        const formattedDate = appointmentDate.toLocaleDateString()
        const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        
        // Send notification to patient
        await sendAndStoreNotification(
          patientUser.id,
          'New Appointment Confirmed',
          `Your appointment with ${doctorName} has been scheduled for ${formattedDate} at ${formattedTime}.`,
          'APPOINTMENT',
          {
            appointmentId: appointment.id.toString(),
            type: 'NEW_APPOINTMENT'
          }
        )
      }
      
      if (doctorUser && doctorUser.id) {
        // Get the patient name for the notification
        const patientName = patientUser ? 
          `${patientUser.firstname || ''} ${patientUser.lastname || ''}`.trim() || patientUser.username : 
          'A patient'
        
        // Format the appointment date
        const appointmentDate = new Date(appointment.date)
        const formattedDate = appointmentDate.toLocaleDateString()
        const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        
        // Send notification to doctor
        await sendAndStoreNotification(
          doctorUser.id,
          'New Appointment Scheduled',
          `${patientName} has scheduled an appointment with you for ${formattedDate} at ${formattedTime}.`,
          'APPOINTMENT',
          {
            appointmentId: appointment.id.toString(),
            type: 'NEW_APPOINTMENT'
          }
        )
      }
    } catch (error) {
      // Log the error but don't fail the request
      strapi.log.error('Failed to send appointment notifications:', error)
    }
    
    return response
  },
  
  // Override the update method to send notifications
  async update(ctx) {
    // Get the original appointment before update
    const { id } = ctx.params
    const originalAppointment = await strapi.entityService.findOne('api::appointment.appointment', id, {
      populate: ['patient.users_permissions_user', 'doctor.users_permissions_user', 'office']
    }) as AppointmentWithRelations;
    
    // Call the default update method
    const response = await super.update(ctx)
    
    try {
      // Get the updated appointment
      const updatedAppointment = await strapi.entityService.findOne('api::appointment.appointment', id, {
        populate: ['patient.users_permissions_user', 'doctor.users_permissions_user', 'office']
      }) as AppointmentWithRelations;
      
      // Get the patient and doctor IDs
      const patientUser = updatedAppointment.patient?.users_permissions_user
      const doctorUser = updatedAppointment.doctor?.users_permissions_user
      
      // Check if the appointment date was changed
      const originalDate = new Date(originalAppointment.date)
      const updatedDate = new Date(updatedAppointment.date)
      const dateChanged = originalDate.getTime() !== updatedDate.getTime()
      
      if (dateChanged) {
        // Format the new appointment date
        const formattedDate = updatedDate.toLocaleDateString()
        const formattedTime = updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        
        // Send notifications about the date change
        if (patientUser && patientUser.id) {
          const doctorName = doctorUser ? 
            `${doctorUser.firstname || ''} ${doctorUser.lastname || ''}`.trim() || doctorUser.username : 
            'Your doctor'
          
          await sendAndStoreNotification(
            patientUser.id,
            'Appointment Rescheduled',
            `Your appointment with ${doctorName} has been rescheduled to ${formattedDate} at ${formattedTime}.`,
            'APPOINTMENT',
            {
              appointmentId: updatedAppointment.id.toString(),
              type: 'UPDATED_APPOINTMENT'
            }
          )
        }
        
        if (doctorUser && doctorUser.id) {
          const patientName = patientUser ? 
            `${patientUser.firstname || ''} ${patientUser.lastname || ''}`.trim() || patientUser.username : 
            'A patient'
          
          await sendAndStoreNotification(
            doctorUser.id,
            'Appointment Rescheduled',
            `Your appointment with ${patientName} has been rescheduled to ${formattedDate} at ${formattedTime}.`,
            'APPOINTMENT',
            {
              appointmentId: updatedAppointment.id.toString(),
              type: 'UPDATED_APPOINTMENT'
            }
          )
        }
      }
      
      // Check if the appointment was cancelled (using a status field if you have one)
      if (originalAppointment.status_appointment !== 'CANCELED' && updatedAppointment.status_appointment === 'CANCELED') {
        // Send cancellation notifications
        if (patientUser && patientUser.id) {
          const doctorName = doctorUser ? 
            `${doctorUser.firstname || ''} ${doctorUser.lastname || ''}`.trim() || doctorUser.username : 
            'Your doctor'
          
          await sendAndStoreNotification(
            patientUser.id,
            'Appointment Cancelled',
            `Your appointment with ${doctorName} has been cancelled.`,
            'APPOINTMENT',
            {
              appointmentId: updatedAppointment.id.toString(),
              type: 'CANCELLED_APPOINTMENT'
            }
          )
        }
        
        if (doctorUser && doctorUser.id) {
          const patientName = patientUser ? 
            `${patientUser.firstname || ''} ${patientUser.lastname || ''}`.trim() || patientUser.username : 
            'A patient'
          
          await sendAndStoreNotification(
            doctorUser.id,
            'Appointment Cancelled',
            `Your appointment with ${patientName} has been cancelled.`,
            'APPOINTMENT',
            {
              appointmentId: updatedAppointment.id.toString(),
              type: 'CANCELLED_APPOINTMENT'
            }
          )
        }
      }
      
    } catch (error) {
      // Log the error but don't fail the request
      strapi.log.error('Failed to send appointment update notifications:', error)
    }
    
    return response
  }
}))
