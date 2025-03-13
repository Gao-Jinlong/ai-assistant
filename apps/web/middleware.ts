import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // 支持的语言列表
  locales: ['en', 'zh'],

  // 默认语言
  defaultLocale: 'en',

  // 语言检测方案
  localeDetection: true,

  // 如果你想通过 domain 来区分语言，可以添加这个配置
  // domains: [
  //   {
  //     domain: 'example.com',
  //     defaultLocale: 'en',
  //     locales: ['en', 'zh'],
  //   },
  //   {
  //     domain: 'example.cn',
  //     defaultLocale: 'zh',
  //     locales: ['en', 'zh'],
  //   },
  // ],
});

export const config = {
  // 匹配所有路径
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
