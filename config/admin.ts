export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'VSkB4vfEinqPZiv0INg+Mg=='),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'XhKoURBByVU+dDSUQd8u7Q=='),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', '9T2XWzxvmxH8g2czOuiaoA=='),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
