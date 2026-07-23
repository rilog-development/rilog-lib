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
