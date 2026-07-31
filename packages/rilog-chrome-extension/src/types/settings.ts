/** Off-by-default toggles for functionality that isn't ready to be on for everyone —
 * ship the code, gate it behind a flag, flip it per-install from Settings. */
export interface IRilogFeatureFlags {
    /** Share button on the event detail panel. Off by default: sharing copies the full
     * request/response — including bodies — to a shareable link. */
    share: boolean;
}

export interface IRilogSettings {
    /** Scroll the Events table to the newest row whenever one arrives. */
    autoScroll: boolean;
    /** Simple substring/case-insensitive URL denylist — the lightweight alternative to writing
     * a full rule with an "ignore" action, for the common "just don't track this domain" case. */
    ignoredUrlPatterns: string[];
    featureFlags: IRilogFeatureFlags;
}

export const createDefaultFeatureFlags = (): IRilogFeatureFlags => ({
    share: false,
});

export const createDefaultSettings = (): IRilogSettings => ({
    autoScroll: true,
    ignoredUrlPatterns: [],
    featureFlags: createDefaultFeatureFlags(),
});
