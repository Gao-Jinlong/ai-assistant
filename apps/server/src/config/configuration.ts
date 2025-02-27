export default () => ({
  isDev: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT || '4000', 10),
});
