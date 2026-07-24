import { RulesManager } from '../../../rules/RulesManager';

export function RulesView() {
    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', maxWidth: 900 }}>
            <RulesManager />
        </div>
    );
}
