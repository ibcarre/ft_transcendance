import { useEffect, useReducer, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { Chat } from '../../components/Chat';
import { useAuth } from '../../context/AuthContext';
import { panel, btnPrimary } from '../../styles/ui';
import { Card } from './Card';
import { PlayerBoard } from './PlayerBoard';
import { Scoreboard } from './Scoreboard';
import { createMockGame, gameReducer, ME_ID } from './mockGame';

const BOT_DELAY_MS = 900;

const btnSecondary = "cursor-pointer rounded-lg border-2 border-blue-500 bg-white px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-blue-600 transition hover:-translate-y-0.5 hover:bg-sky-50";
const btnDanger = "cursor-pointer rounded-lg border-2 border-red-500 bg-red-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600";
const pileLabel = "text-xs font-bold uppercase tracking-wide text-slate-500 sm:text-sm";

const instruction = (game, isMyTurn, me) => {
    if (game.phase === 'INITIAL_REVEAL') {
        const revealed = me.board.filter((slot) => slot.status === 'revealed').length;
        return `Reveal 2 cards to start (${revealed}/2)`;
    }
    if (game.phase !== 'PLAYING') return "Round over";

    const current = game.players.find((p) => p.id === game.currentPlayerId);
    if (!isMyTurn) return `${current.name} is playing...`;

    switch (game.turnStage) {
        case 'WAITING_FOR_DRAW': return "Your turn: draw from the deck or take the discard";
        case 'DRAWN_FROM_DECK': return "Swap the drawn card with one of yours, or discard it";
        case 'MUST_SWAP_DISCARD': return "Choose one of your cards to swap with";
        case 'MUST_REVEAL_CARD': return "Reveal one of your hidden cards";
        default: return "";
    }
};

export function GameRoom() {
    const { userInfo } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // MOCKUP : ?players=2..4 pour tester l'affichage selon le nombre de joueurs
    const nbPlayers = Math.min(4, Math.max(2, Number(searchParams.get('players')) || 4));
    const [game, dispatch] = useReducer(gameReducer, { myName: userInfo.name, nbPlayers }, createMockGame);
    const [modalType, setModalType] = useState(null);

    const me = game.players.find((p) => p.id === ME_ID);
    const opponents = game.players.filter((p) => p.id !== ME_ID);
    const isMyTurn = game.phase === 'PLAYING' && game.currentPlayerId === ME_ID;
    const stage = game.turnStage;
    const discardTop = game.discard.at(-1);
    const roundOver = game.phase === 'ROUND_FINISHED' || game.phase === 'GAME_OVER';

    // MOCKUP : les adversaires jouent tout seuls
    useEffect(() => {
        if (game.phase !== 'PLAYING' || game.currentPlayerId === ME_ID) return;
        const timer = setTimeout(() => dispatch({ type: 'BOT_TURN' }), BOT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [game.phase, game.currentPlayerId]);

    // Quelle carte de mon plateau peut être cliquée selon l'étape du tour
    const canClickMyCard = (slot) => {
        if (game.phase === 'INITIAL_REVEAL') return slot.status === 'hidden';
        if (!isMyTurn) return false;
        if (stage === 'DRAWN_FROM_DECK' || stage === 'MUST_SWAP_DISCARD') return slot.status !== 'removed';
        if (stage === 'MUST_REVEAL_CARD') return slot.status === 'hidden';
        return false;
    };

    const onMyCardClick = (position) => {
        if (game.phase === 'INITIAL_REVEAL') return dispatch({ type: 'REVEAL_INITIAL_CARD', position });
        if (stage === 'MUST_REVEAL_CARD') return dispatch({ type: 'REVEAL_CARD', position });
        dispatch({ type: 'SWAP_CARD', position });
    };

    const canDraw = isMyTurn && stage === 'WAITING_FOR_DRAW';
    const canDiscardDrawn = isMyTurn && stage === 'DRAWN_FROM_DECK';

    const playerName = (id) => game.players.find((p) => p.id === id)?.name;

    return (
        <div className="flex min-h-screen flex-col">

            <Header />

            <main className="flex flex-1 flex-col gap-6 px-4 pb-3 sm:px-8 sm:pb-6 lg:flex-row lg:px-[60px]">

                {/* ===== Zone de jeu ===== */}
                <section className={`${panel} flex min-w-0 flex-1 flex-col gap-4 p-3 shadow-none sm:gap-6 sm:p-6`}>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-lg font-bold text-blue-900 sm:text-xl">
                            Round {game.roundNumber}
                            {game.roundFinisherId && !roundOver && (
                                <span className="ml-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 sm:text-sm">Last turn!</span>
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button className={`${btnSecondary} lg:hidden`} onClick={() => setModalType('scores')}>Scores</button>
                            <button className={`${btnSecondary} lg:hidden`} onClick={() => setModalType('chat')}>Chat</button>
                            <button className={btnDanger} onClick={() => setModalType('leave')}>Leave</button>
                        </div>
                    </div>

                    {/* Adversaires */}
                    <div className="flex justify-center gap-2 overflow-x-auto pb-1 sm:gap-4">
                        {opponents.map((player) => (
                            <PlayerBoard
                                key={player.id}
                                player={player}
                                size="sm"
                                isCurrent={player.id === game.currentPlayerId}
                                isFinisher={player.id === game.roundFinisherId}
                            />
                        ))}
                    </div>

                    {/* Pioche + mon plateau : empilés sur mobile, côte à côte sur grand écran */}
                    <div className="flex flex-1 flex-col items-center justify-end gap-5 xl:flex-row xl:items-center xl:justify-center xl:gap-10">

                    {/* Pioche, défausse et carte piochée */}
                    <div className="flex flex-col items-center gap-3 xl:w-72">
                        <div className="flex items-end justify-center gap-4 sm:gap-8">
                            <div className="flex flex-col items-center gap-2">
                                <span className={pileLabel}>Deck ({game.deck.length})</span>
                                <Card status="hidden" onClick={canDraw ? () => dispatch({ type: 'DRAW_DECK' }) : undefined} />
                            </div>

                            {game.pendingCard && (
                                <div className="flex flex-col items-center gap-2">
                                    <span className={pileLabel}>Drawn</span>
                                    <Card status="revealed" value={game.pendingCard.value} highlight />
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-2">
                                <span className={pileLabel}>Discard</span>
                                {discardTop !== undefined ? (
                                    <Card
                                        status="revealed"
                                        value={discardTop}
                                        onClick={canDraw ? () => dispatch({ type: 'DRAW_DISCARD' })
                                            : canDiscardDrawn ? () => dispatch({ type: 'DISCARD_DRAWN_CARD' })
                                            : undefined}
                                    />
                                ) : (
                                    <Card status="removed" />
                                )}
                            </div>
                        </div>

                        <p className={`min-h-6 text-center text-sm font-semibold sm:text-base ${isMyTurn || game.phase === 'INITIAL_REVEAL' ? 'text-blue-600' : 'text-slate-500'}`}>
                            {instruction(game, isMyTurn, me)}
                        </p>

                        {canDiscardDrawn && (
                            <button className={`${btnPrimary} px-5 py-2 text-sm`} onClick={() => dispatch({ type: 'DISCARD_DRAWN_CARD' })}>
                                Discard it
                            </button>
                        )}
                    </div>

                    {/* Mon plateau */}
                    <div className="flex justify-center">
                        <PlayerBoard
                            player={{ ...me, name: `${me.name} (you)` }}
                            isCurrent={isMyTurn}
                            isFinisher={me.id === game.roundFinisherId}
                            canClick={canClickMyCard}
                            onCardClick={onMyCardClick}
                        />
                    </div>
                    </div>
                </section>

                {/* ===== Colonne latérale (desktop) ===== */}
                <aside className="hidden w-80 shrink-0 flex-col gap-6 lg:flex xl:w-96">
                    <div className={`${panel} p-5 shadow-none`}>
                        <h2 className="mb-4 border-b-2 border-white pb-2 text-xl font-bold text-blue-900">Scores</h2>
                        <Scoreboard game={game} />
                    </div>
                    <div className={`${panel} p-5 shadow-none`}>
                        <h2 className="mb-4 border-b-2 border-white pb-2 text-xl font-bold text-blue-900">Game chat</h2>
                        <Chat embedded />
                    </div>
                </aside>
            </main>

            {/* ===== Modals ===== */}
            {modalType === 'scores' && (
                <Modal title="Scores" onClose={() => setModalType(null)}>
                    <Scoreboard game={game} />
                </Modal>
            )}

            {modalType === 'chat' && (
                <Modal title="Game chat" onClose={() => setModalType(null)}>
                    <Chat />
                </Modal>
            )}

            {modalType === 'leave' && (
                <Modal title="Leave the game?" onClose={() => setModalType(null)}>
                    <div className="flex w-full flex-col gap-6 sm:w-[350px]">
                        <p className="text-slate-600">You will lose your place in this game.</p>
                        <div className="flex gap-3">
                            <button className={`${btnSecondary} flex-1 py-3`} onClick={() => setModalType(null)}>Stay</button>
                            {/* TODO : appeler POST /api/rooms/leaveRoom/:roomId */}
                            <button className={`${btnDanger} flex-1 py-3`} onClick={() => navigate('/lobby')}>Leave</button>
                        </div>
                    </div>
                </Modal>
            )}

            {roundOver && game.lastRound && (
                <Modal
                    title={game.phase === 'GAME_OVER' ? "Game over" : `Round ${game.lastRound.roundNumber} over`}
                    onClose={() => dispatch(game.phase === 'GAME_OVER' ? { type: 'RESTART', myName: userInfo.name } : { type: 'NEXT_ROUND' })}>
                    <div className="flex w-full flex-col gap-5 sm:w-[400px]">
                        {game.phase === 'GAME_OVER' && (
                            <p className="text-center text-xl font-black text-blue-900">
                                🏆 {game.winnerIds.map(playerName).join(', ')} {game.winnerIds.length > 1 ? 'win' : 'wins'}!
                            </p>
                        )}

                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-sm">
                            <span className="font-bold text-slate-400">Player</span>
                            <span className="text-right font-bold text-slate-400">Round</span>
                            <span className="text-right font-bold text-slate-400">Total</span>
                            {game.lastRound.scores.map((score) => {
                                const player = game.players.find((p) => p.id === score.playerId);
                                const doubled = score.finalScore !== score.baseScore;
                                return (
                                    <div key={score.playerId} className="contents font-bold text-slate-800">
                                        <span className="truncate">
                                            {player.name}
                                            {score.playerId === game.lastRound.finisherId && <span className="ml-1 text-amber-500">★</span>}
                                        </span>
                                        <span className={`text-right ${doubled ? 'text-red-500' : ''}`}>
                                            {doubled ? `${score.baseScore} x2 = ${score.finalScore}` : score.finalScore}
                                        </span>
                                        <span className="text-right">{player.totalScore}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {game.phase === 'GAME_OVER' ? (
                            <div className="flex gap-3">
                                <button className={`${btnSecondary} flex-1 py-3`} onClick={() => navigate('/lobby')}>Back to lobby</button>
                                <button className={`${btnPrimary} flex-1 py-3`} onClick={() => dispatch({ type: 'RESTART', myName: userInfo.name })}>Play again</button>
                            </div>
                        ) : (
                            <button className={`${btnPrimary} w-full py-3`} onClick={() => dispatch({ type: 'NEXT_ROUND' })}>Next round</button>
                        )}
                    </div>
                </Modal>
            )}

        </div>
    );
}
