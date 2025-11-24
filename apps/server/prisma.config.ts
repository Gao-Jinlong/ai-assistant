import { defineConfig } from 'prisma/config';

const loadEnv = () => {
  // Try to load from .env if available (mostly for local development)
  // In production, these should be set in the environment
  if (!process.env.DATABASE_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('dotenv').config();
    } catch {
      // ignore if dotenv is not available
    }
  }
};

loadEnv();

export default defineConfig({
  datasource: {
    url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL) as string,
  },
});
