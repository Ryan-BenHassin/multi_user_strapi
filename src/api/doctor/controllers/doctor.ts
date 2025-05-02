/**
 * doctor controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::doctor.doctor', ({ strapi }) => ({
  // Get logged in doctor's offices
  async getMyOffices(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('User not authenticated');
      }

      const doctor = await strapi.db.query('api::doctor.doctor').findOne({
        where: {
          users_permissions_user: user.id
        },
        populate: {
          offices: true
        }
      });

      if (!doctor) {
        return ctx.notFound('Doctor profile not found');
      }

      return { data: doctor.offices };
    } catch (err) {
      return ctx.badRequest('Error fetching offices', { error: err });
    }
  },

  // Get logged in doctor's appointments
  async getMyAppointments(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('User not authenticated');
      }

      const { status, startDate, endDate } = ctx.query;

      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter = {
          date: {
            ...(startDate && { $gte: new Date(startDate as string) }),
            ...(endDate && { $lte: new Date(endDate as string) })
          }
        };
      }

      let statusFilter = {};
      if (status) {
        statusFilter = {
          status_appointment: status
        };
      }

      const doctor = await strapi.db.query('api::doctor.doctor').findOne({
        where: {
          users_permissions_user: user.id
        },
        populate: {
          offices: {
            populate: {
              appointments: {
                where: {
                  ...dateFilter,
                  ...statusFilter
                },
                populate: ['patient']
              }
            }
          }
        }
      });

      if (!doctor) {
        return ctx.notFound('Doctor profile not found');
      }

      // Flatten appointments from all offices
      const appointments = doctor.offices.reduce((acc, office) => {
        return [...acc, ...office.appointments];
      }, []);

      return { data: appointments };
    } catch (err) {
      return ctx.badRequest('Error fetching appointments', { error: err });
    }
  }
}));
