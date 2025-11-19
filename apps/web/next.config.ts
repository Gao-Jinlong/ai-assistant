import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    rules: codeInspectorPlugin({
      bundler: 'turbopack',
    }),
  },
};

export default withNextIntl(nextConfig);
