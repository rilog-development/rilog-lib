export interface IRilogSettings {
    /** Scroll the Events table to the newest row whenever one arrives. */
    autoScroll: boolean;
    /** Simple substring/case-insensitive URL denylist — the lightweight alternative to writing
     * a full rule with an "ignore" action, for the common "just don't track this domain" case. */
    ignoredUrlPatterns: string[];
}

export const createDefaultSettings = (): IRilogSettings => ({
    autoScroll: false,
    ignoredUrlPatterns: [],
});
