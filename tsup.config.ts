import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    target: 'es2017',
    external: ['react'],
    minify: true,
    sourcemap: false,
    treeshake: true,
});
