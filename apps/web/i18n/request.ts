import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) return { messages: {}, locale: 'en' };

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale: locale,
  };
});
