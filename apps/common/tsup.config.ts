import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types/index.ts',
    utils: 'src/utils/index.ts',
    constants: 'src/constants/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  external: ['zod', 'dayjs', 'nanoid'],
})