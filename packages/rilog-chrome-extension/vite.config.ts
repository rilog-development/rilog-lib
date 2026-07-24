import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import manifest from './manifest.json';

export default defineConfig({
    plugins: [react(), crx({ manifest: manifest as chrome.runtime.ManifestV3 })],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                // Only pages crxjs can't auto-discover from manifest.json need to be listed here.
                // The devtools panel page is referenced solely as a runtime string argument to
                // chrome.devtools.panels.create(...) inside devtools.ts, so the build tool has no
                // static way to find it — without this it silently never gets emitted to dist/.
                panel: 'src/devtools/panel/index.html',
                share: 'src/share/index.html',
            },
        },
    },
    server: {
        port: 5174,
        strictPort: true,
        hmr: { port: 5174 },
    },
});
