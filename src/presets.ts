/**
 * Ready-made ignoredRequests arrays for popular frameworks and common third-party tools.
 * Spread one or more into your ignoredRequests to avoid flooding storage with internal noise.
 *
 * @example
 * import rilog, { presets } from '@rilog-development/rilog-lib';
 * rilog.init({
 *     ignoredRequests: [...presets.nextjs, ...presets.noAnalytics, '/api/health'],
 * });
 */
export const presets: Record<string, string[]> = {
    /** Next.js internal dev-server and Vercel platform requests */
    nextjs: [
        '__nextjs_',
        '_next/webpack-hmr',
        '_vercel/',
    ],

    /** Vite dev-server module and HMR requests */
    vite: [
        '/@vite/',
        '/@react-refresh',
        '/@fs/',
    ],

    /** Common third-party analytics and tracking services */
    noAnalytics: [
        'google-analytics.com',
        'analytics.google.com',
        'googletagmanager.com',
        'hotjar.com',
        'segment.io',
        'mixpanel.com',
    ],
};
