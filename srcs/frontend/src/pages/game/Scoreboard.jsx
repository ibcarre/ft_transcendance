import { visibleScore, ME_ID } from './mockGame';

export function Scoreboard({ game }) {
    const players = [...game.players].sort((a, b) => a.totalScore - b.totalScore);

    return (
        <div className="flex w-full flex-col gap-3 sm:min-w-[320px]">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                <span>Round {game.roundNumber}</span>
                <span>Goal: {game.targetScore} pts</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-sm">
                <span className="font-bold text-slate-400">Player</span>
                <span className="text-right font-bold text-slate-400">Round</span>
                <span className="text-right font-bold text-slate-400">Total</span>

                {players.map((player) => {
                    const isCurrent = player.id === game.currentPlayerId;
                    const row = isCurrent ? "text-blue-600" : "text-slate-800";
                    return (
                        <div key={player.id} className={`contents font-bold ${row}`}>
                            <span className="truncate">
                                {isCurrent && '▶ '}
                                {player.name}
                                {player.id === ME_ID && <span className="font-semibold text-slate-400"> (you)</span>}
                            </span>
                            <span className="text-right">{visibleScore(player.board)}</span>
                            <span className="text-right">{player.totalScore}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
