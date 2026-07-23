import { TTheme } from './useTheme';

export function ThemeToggle({ theme, onToggle }: { theme: TTheme; onToggle: () => void }) {
    return (
        <button className="rilog-icon-btn" onClick={onToggle} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? '☾' : '☀'}
        </button>
    );
}
