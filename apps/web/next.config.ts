import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    config.plugins.push(codeInspectorPlugin({ bundler: 'webpack' }));
    return config;
  },
};

export default withNextIntl(nextConfig);
