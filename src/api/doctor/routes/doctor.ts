/**
 * doctor router
 */

import { factories } from '@strapi/strapi';

const { createCoreRouter } = factories;

export default {
  type: 'admin', // Adding type property
  routes: [
    {
      method: 'GET',
      path: '/doctors',
      handler: 'doctor.find',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/doctors/:id',
      handler: 'doctor.findOne',
      config: {
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/doctors',
      handler: 'doctor.create',
      config: {
        policies: []
      }
    },
    {
      method: 'PUT',
      path: '/doctors/:id',
      handler: 'doctor.update',
      config: {
        policies: []
      }
    },
    {
      method: 'DELETE',
      path: '/doctors/:id',
      handler: 'doctor.delete',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/doctors/me/offices',
      handler: 'doctor.getMyOffices',
      config: {
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/doctors/me/appointments',
      handler: 'doctor.getMyAppointments',
      config: {
        policies: []
      }
    }
  ]
};
