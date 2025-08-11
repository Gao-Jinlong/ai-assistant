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
  log: {
    level:
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    dir: process.env.LOG_DIR || './logs',
    maxSize: Number(process.env.LOG_MAX_SIZE) || 20 * 2 ** 20,
    maxFiles: Number(process.env.LOG_MAX_FILES) || 7, // 保留7天
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE !== 'false',
  },
  mock: {
    enable: process.env.MOCK_ENABLE !== 'false',
    path: process.env.MOCK_PATH || './mock',
  },
});
