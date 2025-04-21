export default ({ env }: { env: () => any }) => ({
  "users-permissions": {
    config: {
      register: {
        allowedFields: ["roleType", "firstname", "lastname", "phone"]
      }
    }
  },
  email: {
    config: {
      provider: 'sendmail',
      settings: {
        defaultFrom: 'myemail@protonmail.com',
        defaultReplyTo: 'myemail@protonmail.com',
      },
    },
  }
});