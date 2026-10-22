import { Card } from './Card';
import { visibleScore } from './mockGame';

// Plateau 3 lignes x 4 colonnes, rangé ligne par ligne comme le moteur du back
export function PlayerBoard({ player, size = 'lg', isCurrent = false, isFinisher = false, canClick, onCardClick }) {
    const gap = size === 'lg' ? "gap-2 sm:gap-3" : "gap-1";

    return (
        <div className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-2 transition-colors sm:p-3 ${isCurrent ? 'border-blue-500 bg-white' : 'border-white bg-white/60'}`}>
            <div className={`flex w-full ${size === 'lg' ? 'items-center justify-between gap-2' : 'flex-col items-start sm:flex-row sm:items-center sm:justify-between sm:gap-2'}`}>
                <p className={`truncate font-bold text-slate-800 ${size === 'lg' ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'}`}>
                    {player.name}
                    {isFinisher && <span className="ml-1 text-amber-500" title="Round finisher">★</span>}
                </p>
                <p className={`shrink-0 font-semibold text-slate-500 ${size === 'lg' ? 'text-sm sm:text-base' : 'text-[11px] sm:text-xs'}`}>
                    {visibleScore(player.board)} pts
                </p>
            </div>

            <div className={`grid grid-cols-4 ${gap}`}>
                {player.board.map((slot, position) => (
                    <Card
                        key={position}
                        size={size}
                        status={slot.status}
                        value={slot.value}
                        onClick={canClick?.(slot) ? () => onCardClick(position) : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
