import { ERilogEvent } from '@rilog-development/rilog-shared';

/** No JSON typing required — `bodyValue` is plain text the user types (e.g. `null`, `true`,
 * `404`, or a plain word for a string), interpreted at match time (see background/rules.ts). */
export type TRilogBodyOperator = 'exists' | 'equals' | 'notEquals' | 'contains';

export interface IRilogRuleMatch {
    urlPattern?: string;
    method?: string[];
    /** Either an exact code ("503") or a hundred-range wildcard ("5**" matches any 500-599). */
    status?: string;
    clickSelector?: string;
    bodyPath?: string;
    bodyOperator?: TRilogBodyOperator;
    bodyValue?: string;
}

export type TRilogRuleAction =
    | { type: 'notify'; title: string; body?: string }
    | { type: 'pin' }
    | { type: 'console' }
    | { type: 'ignore' }; // don't capture matching events at all (e.g. analytics/health-check noise)

export interface IRilogFilterTab {
    enabled: boolean;
    name: string;
}

export interface IRilogRule {
    id: string;
    name: string;
    enabled: boolean;
    /** Exactly one type per rule — match fields shown in the UI depend on it, and it's what
     * keeps matching unambiguous (no "empty means any type" case to accidentally fall through). */
    eventType: ERilogEvent;
    match: IRilogRuleMatch;
    actions: TRilogRuleAction[];
    filterTab: IRilogFilterTab;
}

export const createEmptyRule = (): IRilogRule => ({
    id: `rule_${Math.random().toString(36).slice(2, 10)}`,
    name: '',
    enabled: true,
    eventType: ERilogEvent.REQUEST,
    match: {},
    actions: [],
    filterTab: { enabled: false, name: '' },
});
