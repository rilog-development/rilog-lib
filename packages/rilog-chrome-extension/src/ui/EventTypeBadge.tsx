import { ERilogEvent } from '@rilog-development/rilog-shared';
import { EVENT_TYPE_BADGE, typeColorVar } from './eventFormat';

export function EventTypeBadge({ type }: { type: ERilogEvent }) {
    const { fg, bg } = typeColorVar(type);
    return (
        <span className="rilog-badge" style={{ color: fg, background: bg }}>
            {EVENT_TYPE_BADGE[type]}
        </span>
    );
}
