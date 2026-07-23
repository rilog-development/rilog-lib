import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    // NOTE: dts.resolve for '@rilog-development/rilog-shared' produces a broken
    // dangling './types' import (rollup-plugin-dts ambiguous-namespace limitation
    // with this package's re-export graph) — see packages/rilog-lib/CLAUDE.md.
    dts: true,
    clean: true,
    target: 'es2017',
    external: ['react'],
    noExternal: ['@rilog-development/rilog-shared'],
    minify: true,
    sourcemap: false,
    treeshake: true,
});
