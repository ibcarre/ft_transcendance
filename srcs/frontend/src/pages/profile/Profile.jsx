import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Modal } from '../../components/Modal';
import { EditProfile } from './EditProfile';
import { Header } from '../../components/Header';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../context/useAuth';
import { PrivacyLink } from '../../components/PrivacyLink';
import { fetchStats, gameResult } from '../../services/stats';
import { errorMessage } from '../../services/user';
import { panel, btnPrimary, feedback } from '../../styles/ui';

const matchItem = "flex shrink-0 items-center justify-between gap-4 rounded-lg border-2 border-l-[6px] border-slate-800 bg-white px-4 py-3 text-lg font-extrabold text-slate-800 sm:px-6 sm:py-4 sm:text-2xl";
const matchDate = "shrink-0 text-base font-semibold text-slate-500 sm:text-xl";
const emptyText = "py-2 text-center text-sm text-slate-400";

// Affichage de chaque résultat : lettre et couleur de la bordure gauche
const RESULTS = {
    win: { label: 'W', border: 'border-l-green-500' },
    loss: { label: 'L', border: 'border-l-red-500' },
    ongoing: { label: 'In progress', border: 'border-l-amber-400' },
    cancelled: { label: 'Cancelled', border: 'border-l-slate-400' },
};

export function Profile() {
    const { userInfo } = useAuth();

    const [editModal, setEditModal] = useState(false);
    const [stats, setStats] = useState({ wins: 0, losses: 0, games: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        fetchStats()
            .then((data) => { if (active) setStats(data); })
            .catch((err) => { if (active) setError(errorMessage(err, "Failed to load your stats")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const closeModal = () => setEditModal(false);

    const played = stats.wins + stats.losses;
    const winRate = played > 0 ? `${Math.round((stats.wins / played) * 100)}%` : '–';
    // Parties les plus récentes en premier
    const games = [...stats.games].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="flex min-h-screen flex-col">

            <Header />

            <div className="my-auto flex w-full flex-col items-center justify-center px-4 pt-6 sm:px-8 lg:px-[60px]">
                <div className={`${panel} box-border flex w-full max-w-[1400px] flex-col p-6 sm:p-10 lg:min-h-[700px] lg:px-20 lg:py-[60px]`}>

                    <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row">
                        <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:gap-6">
                            <Avatar file={userInfo.avatar_url} className="size-28 sm:size-32 lg:size-[150px]" />
                            <h2 className="break-all text-center text-3xl font-extrabold text-slate-800 sm:text-left sm:text-4xl lg:text-5xl">{userInfo.name}</h2>
                        </div>
                        <button className={`${btnPrimary} shrink-0 rounded-xl px-8 py-4 text-lg font-bold uppercase`} onClick={() => setEditModal(true)}>EDIT</button>
                    </div>

                    <hr className="my-6 w-full border-0 border-t-2 border-slate-300 sm:my-[30px]" />

                    {error && <p className={`${feedback.error} mb-4`}>{error}</p>}

                    <div className="flex flex-1 flex-col items-stretch md:flex-row">

                        <div className="flex flex-1 flex-col items-center justify-center">
                            <p className="text-xl font-semibold text-slate-800 sm:text-[32px]">
                                Games played: {loading ? '...' : played}
                            </p>
                            <p className="mt-2.5 text-7xl font-black text-slate-800 sm:text-8xl lg:text-[140px]">
                                {loading ? '...' : winRate}
                            </p>
                            {!loading && played > 0 && (
                                <p className="mt-2 text-base font-semibold text-slate-500 sm:text-xl">
                                    <span className="text-green-600">{stats.wins} W</span> · <span className="text-red-500">{stats.losses} L</span>
                                </p>
                            )}
                        </div>

                        <div className="my-6 h-0.5 bg-slate-300 md:mx-10 md:my-0 md:h-auto md:w-0.5"></div>

                        <div className="flex flex-1 flex-col justify-center">
                            <h3 className="mb-4 text-lg font-bold text-slate-800 sm:text-xl">Match history</h3>
                            {loading && <p className={emptyText}>Loading...</p>}
                            {!loading && !error && games.length === 0 && (
                                <p className={emptyText}>No game played yet</p>
                            )}
                            <ul className="flex max-h-[360px] flex-col gap-4 overflow-y-auto pr-2">
                                {games.map((game, i) => {
                                    const result = RESULTS[gameResult(game, userInfo.id)];
                                    return (
                                        <li key={`${game.created_at}-${i}`} className={`${matchItem} ${result.border}`} title={game.name}>
                                            <span className="truncate">{result.label}</span>
                                            <span className={matchDate}>{dayjs(game.created_at).format('DD/MM')}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                    </div>

                </div>
                <PrivacyLink />
            </div>

            {editModal && (
                <Modal title="Edit profile" onClose={closeModal}>
                    <EditProfile />
                </Modal>
            )}

        </div>
    );
}
