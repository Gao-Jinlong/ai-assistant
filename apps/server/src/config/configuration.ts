export default () => ({
  isDev: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '6h',
  },
});
