import { IRilogRule } from '../../../types/rules';
import { RulesManager } from '../../../rules/RulesManager';

export function RulesView({ onRulesChanged }: { onRulesChanged: (rules: IRilogRule[]) => void }) {
    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', maxWidth: 900 }}>
            <RulesManager onRulesChanged={onRulesChanged} />
        </div>
    );
}
