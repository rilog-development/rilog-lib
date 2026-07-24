import { ERilogEvent, IRilogClick, IRilogRequestItem } from '@rilog-development/rilog-shared';
import { IExtensionEvent } from '../types/messages';
import { IRilogRule } from '../types/rules';

const RULES_STORAGE_KEY = 'rilog_rules';

export async function getRules(): Promise<IRilogRule[]> {
    const result = await chrome.storage.local.get(RULES_STORAGE_KEY);
    return (result[RULES_STORAGE_KEY] as IRilogRule[] | undefined) ?? [];
}

export async function saveRule(rule: IRilogRule): Promise<IRilogRule[]> {
    const rules = await getRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx !== -1) rules[idx] = rule;
    else rules.push(rule);
    await chrome.storage.local.set({ [RULES_STORAGE_KEY]: rules });
    return rules;
}

export async function deleteRule(ruleId: string): Promise<IRilogRule[]> {
    const rules = (await getRules()).filter((r) => r.id !== ruleId);
    await chrome.storage.local.set({ [RULES_STORAGE_KEY]: rules });
    return rules;
}

/** Upserts a whole batch in one read-modify-write — importing rule-by-rule via saveRule() would
 * race, since each call reads storage independently and later writes could clobber earlier ones. */
export async function importRules(imported: IRilogRule[]): Promise<IRilogRule[]> {
    const rules = await getRules();
    for (const rule of imported) {
        const idx = rules.findIndex((r) => r.id === rule.id);
        if (idx !== -1) rules[idx] = rule;
        else rules.push(rule);
    }
    await chrome.storage.local.set({ [RULES_STORAGE_KEY]: rules });
    return rules;
}

const PATH_SEGMENT_RE = /^([^[]*)(\[(\d*)\])?$/;

/**
 * Dot-path resolver with array support:
 *  - `content[0].isFavorite` reads a specific index.
 *  - `content[].isFavorite` fans out over every element of the array, matching if ANY satisfies
 *    the rest of the path — for when you don't care which index it's at.
 */
function resolvePathValues(obj: unknown, path: string): unknown[] {
    const segments = path.split('.').filter(Boolean);
    let current: unknown[] = [obj];

    for (const segment of segments) {
        const parsed = segment.match(PATH_SEGMENT_RE);
        const key = parsed?.[1] ?? segment;
        const hasBracket = parsed?.[2] !== undefined;
        const indexStr = parsed?.[3];
        const next: unknown[] = [];

        for (const item of current) {
            if (item === null || typeof item !== 'object') continue;
            const value = key ? (item as Record<string, unknown>)[key] : item;

            if (hasBracket) {
                if (!Array.isArray(value)) continue;
                if (indexStr) {
                    const idx = Number(indexStr);
                    if (idx < value.length) next.push(value[idx]);
                } else {
                    next.push(...value);
                }
            } else {
                next.push(value);
            }
        }

        current = next;
    }

    return current;
}

/** Turns plain typed text into a real value with no JSON syntax required: `null`/`true`/`false`
 * and plain numbers are recognized, anything else (including things that merely look numeric
 * but aren't meant to be, e.g. leave as-is) is compared as a string. */
function parseTypedLiteral(raw: string): unknown {
    const trimmed = raw.trim();
    if (trimmed === 'null') return null;
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
    return raw;
}

function valuesEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function matchBodyPath(match: IRilogRule['match'], dataSources: unknown[]): boolean {
    if (!match.bodyPath) return true;

    const values = dataSources.flatMap((data) => resolvePathValues(data, match.bodyPath!));
    if (values.length === 0) return false;

    const operator = match.bodyOperator ?? 'exists';
    if (operator === 'exists') return true;

    const target = parseTypedLiteral(match.bodyValue ?? '');
    if (operator === 'equals') return values.some((v) => valuesEqual(v, target));
    if (operator === 'notEquals') return values.every((v) => !valuesEqual(v, target));
    if (operator === 'contains') return values.some((v) => String(v).toLowerCase().includes(String(target).toLowerCase()));

    return true;
}

const STATUS_WILDCARD_RE = /^([0-9])\*\*$/;

/** `pattern` is either an exact code ("503") or a hundred-range wildcard ("5**" for any 500-599). */
function matchStatusPattern(pattern: string, actual: string | null | undefined): boolean {
    const trimmed = pattern.trim();
    const wildcard = trimmed.match(STATUS_WILDCARD_RE);
    const code = Number(actual);
    if (Number.isNaN(code)) return false;

    if (wildcard) {
        const hundred = Number(wildcard[1]) * 100;
        return code >= hundred && code < hundred + 100;
    }

    return String(code) === trimmed;
}

function matchRequestSpecifics(match: IRilogRule['match'], item: IRilogRequestItem): boolean {
    if (match.urlPattern) {
        try {
            if (!new RegExp(match.urlPattern, 'i').test(item.request.url)) return false;
        } catch {
            if (!item.request.url.toLowerCase().includes(match.urlPattern.toLowerCase())) return false;
        }
    }

    if (match.method?.length && !match.method.includes(item.request.method)) return false;

    if (match.status && !matchStatusPattern(match.status, item.response.status)) return false;

    return true;
}

function matchClickSpecifics(match: IRilogRule['match'], click: IRilogClick): boolean {
    const selector = match.clickSelector?.trim();
    if (!selector) return true;

    if (selector.startsWith('#')) return click.id === selector.slice(1);
    if (selector.startsWith('.')) return (click.classNames ?? '').split(/\s+/).includes(selector.slice(1));
    return click.nodeName.toLowerCase() === selector.toLowerCase();
}

/**
 * A rule has exactly one eventType (see types/rules.ts), so there is no "any type" case to fall
 * through — every branch below either matches its own criteria or explicitly returns false.
 */
export function matchRule(rule: IRilogRule, extEvent: IExtensionEvent): boolean {
    if (!rule.enabled) return false;
    if (rule.eventType !== extEvent.event.type) return false;

    const { event } = extEvent;
    const { match } = rule;

    if (event.type === ERilogEvent.REQUEST) {
        const item = event.data as IRilogRequestItem;
        if (!matchRequestSpecifics(match, item)) return false;
        return matchBodyPath(match, [item.request.data, item.response.data]);
    }

    if (event.type === ERilogEvent.CLICK) {
        const click = event.data as IRilogClick;
        if (!matchClickSpecifics(match, click)) return false;
        return matchBodyPath(match, [click]);
    }

    // INPUT / CONSOLE_WARN / CONSOLE_ERROR / DEBUG_MESSAGE — generic body-path match against
    // the event's own data (e.g. bodyPath "message" against a console event).
    return matchBodyPath(match, [event.data]);
}

export function matchAllRules(rules: IRilogRule[], extEvent: IExtensionEvent): IRilogRule[] {
    return rules.filter((rule) => matchRule(rule, extEvent));
}

export function summarizeEvent(extEvent: IExtensionEvent): string {
    const { event } = extEvent;
    if (event.type === ERilogEvent.REQUEST) {
        const item = event.data as IRilogRequestItem;
        return `${item.request.method} ${item.request.url}`;
    }
    return 'Rilog event matched a rule';
}

export function runNotifyActions(matched: IRilogRule[], extEvent: IExtensionEvent): void {
    for (const rule of matched) {
        for (const action of rule.actions) {
            if (action.type !== 'notify') continue;
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title: action.title || rule.name || 'Rilog DevTools',
                message: action.body || summarizeEvent(extEvent),
            });
        }
    }
}
