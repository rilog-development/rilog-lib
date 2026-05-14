/**
 * Reads .env and generates src/secrets.ts before TypeScript compilation.
 * src/secrets.ts is gitignored — sensitive values never enter the repository.
 * Run automatically via: npm run build
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const outputPath = path.join(__dirname, '../src/secrets.ts');

// Parse .env manually (no extra dependencies needed)
const env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;
        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim();
        if (key) env[key] = value;
    }
}

const get = (key, fallback) => env[key] || fallback;

const content = `// Auto-generated from .env — DO NOT COMMIT
// Regenerated on every build via: node scripts/generate-secrets.js

export const BASE_URL = '${get('RILOG_BASE_URL', 'http://localhost:3000')}';
export const LOCAL_BASE_URL = '${get('RILOG_LOCAL_BASE_URL', 'http://localhost:3025')}';
export const TOKEN_GENERATION_SALT = '${get('RILOG_TOKEN_GENERATION_SALT', 'rilog by kaowebdev')}';
export const TOKEN_GENERATION_TIMESTAMP = '${get('RILOG_TOKEN_GENERATION_TIMESTAMP', '3456745647')}';
`;

fs.writeFileSync(outputPath, content, 'utf8');
console.log('[rilog] Generated src/secrets.ts from .env');
