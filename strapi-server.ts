// PUT THIS FILE IN FOLDER src/extensions/users-permissions

import { errors } from '@strapi/utils';
const { ValidationError } = errors;

export default (plugin) => {
  const sanitizeUser = (user) => {
    const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = user;
    return sanitizedUser;
  };

  const defaultPopulate = {
    role: true,
    doctor: {
      populate: {
        speciality: true
      }
    },
    patient: {
      populate: {
        appointments: {
          populate: {
            office: true
          }
        }
      }
    }
  };

  // Customize /me endpoint
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    const { id } = ctx.state.user;

    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      id,
      {
        populate: ['role', 'doctor', 'patient.appointments.office']
      }
    );

    if (!user) {
      return ctx.notFound();
    }

    return ctx.send(sanitizeUser(user));
  };

  // Customize login callback
  const getService = name => {
    return strapi.plugin('users-permissions').service(name);
  };

  plugin.controllers.auth.callback = async (ctx) => {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;
    const { identifier } = params;

    // Find user with populated relations
    const user = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: {
        provider,
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ],
      },
      populate: ['role', 'doctor', 'patient.appointments.office']
    });

    if (!user?.[0]) {
      throw new ValidationError('Invalid identifier or password');
    }

    const matchingUser = user[0];

    if (!matchingUser.password) {
      throw new ValidationError('Invalid identifier or password');
    }

    const validPassword = await getService('user').validatePassword(
      params.password,
      matchingUser.password
    );

    if (!validPassword) {
      throw new ValidationError('Invalid identifier or password');
    }

    const jwt = getService('jwt').issue({ id: matchingUser.id });

    return ctx.send({
      jwt,
      user: sanitizeUser(matchingUser),
    });
  };

  return plugin;
};
