import { ERilogEvent } from '@rilog-development/rilog-shared';

export interface IRilogRuleMatch {
    urlPattern?: string;
    method?: string[];
    status?: { min?: number; max?: number };
    bodyPath?: string;
    bodyValue?: unknown;
    clickSelector?: string;
}

export type TRilogRuleAction =
    | { type: 'notify'; title: string; body?: string }
    | { type: 'pin' }
    | { type: 'openFilterTab'; filterName: string }
    | { type: 'console' };

export interface IRilogRule {
    id: string;
    name: string;
    enabled: boolean;
    eventTypes: ERilogEvent[];
    match: IRilogRuleMatch;
    actions: TRilogRuleAction[];
}

export const EMPTY_RULE_MATCH: IRilogRuleMatch = {};

export const createEmptyRule = (): IRilogRule => ({
    id: `rule_${Math.random().toString(36).slice(2, 10)}`,
    name: '',
    enabled: true,
    eventTypes: [],
    match: {},
    actions: [],
});
