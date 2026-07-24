import { RulesManager } from '../rules/RulesManager';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../ui/useTheme';

export function Options() {
    const [theme, toggleTheme] = useTheme();

    return (
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, margin: 0 }}>Rilog DevTools — Rules</h1>
                <div style={{ flex: 1 }} />
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <RulesManager />
        </div>
    );
}
