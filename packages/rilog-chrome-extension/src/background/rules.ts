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

function getByPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function matchRequest(rule: IRilogRule, item: IRilogRequestItem): boolean {
    const { match } = rule;

    if (match.urlPattern) {
        try {
            if (!new RegExp(match.urlPattern, 'i').test(item.request.url)) return false;
        } catch {
            if (!item.request.url.toLowerCase().includes(match.urlPattern.toLowerCase())) return false;
        }
    }

    if (match.method?.length && !match.method.includes(item.request.method)) return false;

    if (match.status) {
        const status = Number(item.response.status);
        if (!Number.isNaN(status)) {
            if (match.status.min !== undefined && status < match.status.min) return false;
            if (match.status.max !== undefined && status > match.status.max) return false;
        }
    }

    if (match.bodyPath) {
        const value = getByPath(item.request.data, match.bodyPath) ?? getByPath(item.response.data, match.bodyPath);
        if (value === undefined) return false;
        if (match.bodyValue !== undefined && JSON.stringify(value) !== JSON.stringify(match.bodyValue)) return false;
    }

    return true;
}

function matchClick(rule: IRilogRule, click: IRilogClick): boolean {
    const selector = rule.match.clickSelector?.trim();
    if (!selector) return true;

    if (selector.startsWith('#')) return click.id === selector.slice(1);
    if (selector.startsWith('.')) return (click.classNames ?? '').split(/\s+/).includes(selector.slice(1));
    return click.nodeName.toLowerCase() === selector.toLowerCase();
}

export function matchRule(rule: IRilogRule, extEvent: IExtensionEvent): boolean {
    if (!rule.enabled) return false;
    if (rule.eventTypes.length && !rule.eventTypes.includes(extEvent.event.type)) return false;

    const { event } = extEvent;
    if (event.type === ERilogEvent.REQUEST) return matchRequest(rule, event.data as IRilogRequestItem);
    if (event.type === ERilogEvent.CLICK) return matchClick(rule, event.data as IRilogClick);
    return true;
}

export function matchAllRules(rules: IRilogRule[], extEvent: IExtensionEvent): IRilogRule[] {
    return rules.filter((rule) => matchRule(rule, extEvent));
}

function summarizeEvent(extEvent: IExtensionEvent): string {
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
