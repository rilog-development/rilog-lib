import { TDock } from './usePanelDock';

export function DockIcon({ position }: { position: TDock }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="currentColor" />
            {position === 'right' ? <rect x="8.5" y="0.5" width="5" height="13" fill="currentColor" /> : <rect x="0.5" y="8.5" width="13" height="5" fill="currentColor" />}
        </svg>
    );
}
