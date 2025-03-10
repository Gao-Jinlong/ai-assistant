export default () => ({
  isDev: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '6h',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    basePath: process.env.STORAGE_BASE_PATH || './data/storage',
  },
});
