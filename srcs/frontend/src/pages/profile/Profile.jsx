import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Modal } from '../../components/Modal';
import { EditProfile } from './EditProfile';
import { Header } from '../../components/Header';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../context/useAuth';
import { useFriends } from '../../context/useFriends';
import { sendFriendRequest } from '../../services/friends';
import { PrivacyLink } from '../../components/PrivacyLink';
import { fetchMyStats, fetchUserProfile, gameResult } from '../../services/stats';
import { errorMessage } from '../../services/user';
import { panel, btnPrimary, feedback } from '../../styles/ui';

const matchItem = "flex shrink-0 items-center justify-between gap-4 rounded-lg border-2 border-l-[6px] border-slate-800 bg-white px-4 py-3 text-lg font-extrabold text-slate-800 sm:px-6 sm:py-4 sm:text-2xl";
const matchDate = "shrink-0 text-base font-semibold text-slate-500 sm:text-xl";
const emptyText = "py-2 text-center text-sm text-slate-400";
const badge = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold";

// Affichage de chaque résultat : lettre et couleur de la bordure gauche
const RESULTS = {
    win: { label: 'W', border: 'border-l-green-500' },
    loss: { label: 'L', border: 'border-l-red-500' },
    ongoing: { label: 'In progress', border: 'border-l-amber-400' },
    cancelled: { label: 'Cancelled', border: 'border-l-slate-400' },
};

// Profil de n'importe quel joueur à partir de son id ; EDIT seulement sur mon propre profil
export function Profile({ id }) {
    const { userInfo } = useAuth();
    const isMe = id === userInfo.id;
    // Amis et invitations reçues, à jour en temps réel (socket /Friends)
    const { friends, requests, reload: reloadFriends } = useFriends();

    const [editModal, setEditModal] = useState(false);
    const [data, setData] = useState({ wins: 0, losses: 0, games: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adding, setAdding] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [addError, setAddError] = useState(null);

    useEffect(() => {
        let active = true;
        // friends/profile ne doit pas être appelé avec mon propre id (le back redirige)
        const load = isMe ? fetchMyStats() : fetchUserProfile(id);
        load
            .then((res) => { if (active) setData(res); })
            .catch((err) => { if (active) setError(errorMessage(err, "Failed to load the profile")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, isMe]);

    const closeModal = () => setEditModal(false);

    // data.friend du back vaut aussi true pour une invitation en attente : on se fie au contexte
    const isFriend = friends.some((f) => f.id === id);
    const invitedMe = requests.some((r) => r.id === id);

    // Ami retiré (par moi ou par lui) : data.friend, chargé avec le profil, n'est plus à jour
    const [wasFriend, setWasFriend] = useState(isFriend);
    const [friendRemoved, setFriendRemoved] = useState(false);
    if (isFriend !== wasFriend) {
        setWasFriend(isFriend);
        if (!isFriend) {
            setFriendRemoved(true);
            setRequestSent(false);
        }
    }
    const iInvited = !isFriend && !invitedMe && (requestSent || (data.friend && !friendRemoved));

    const addFriend = async () => {
        setAdding(true);
        setAddError(null);
        try {
            const message = await sendFriendRequest(data.name);
            if (message === "Friendship accepted") await reloadFriends();
            else setRequestSent(true);
        } catch (err) {
            setAddError(errorMessage(err));
        } finally {
            setAdding(false);
        }
    };

    // Mon nom / avatar viennent du contexte (à jour après EDIT), ceux des autres de l'API
    const name = isMe ? userInfo.name : data.name;
    const avatar = isMe ? userInfo.avatar_url : data.avatar_url;
    const online = data.status === 'online';

    const played = data.wins + data.losses;
    const winRate = played > 0 ? `${Math.round((data.wins / played) * 100)}%` : '–';
    // Parties les plus récentes en premier
    const games = [...data.games].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="flex min-h-screen flex-col">

            <Header />

            <div className="my-auto flex w-full flex-col items-center justify-center px-4 pt-6 sm:px-8 lg:px-[60px]">
                <div className={`${panel} box-border flex w-full max-w-[1400px] flex-col p-6 sm:p-10 lg:min-h-[700px] lg:px-20 lg:py-[60px]`}>

                    <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row">
                        <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:gap-6">
                            <Avatar file={avatar} className="size-28 sm:size-32 lg:size-[150px]" />
                            <div className="flex min-w-0 flex-col items-center gap-2 sm:items-start">
                                <h2 className="break-all text-center text-3xl font-extrabold text-slate-800 sm:text-left sm:text-4xl lg:text-5xl">
                                    {name ?? (loading ? '...' : '')}
                                </h2>
                                {!isMe && !loading && !error && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <span className={`${badge} bg-white/70 text-slate-700`}>
                                            <span className={`size-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-slate-400'}`} />
                                            {online ? 'Online' : 'Offline'}
                                        </span>
                                        {isFriend && <span className={`${badge} bg-green-100 text-green-700`}>Friend</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isMe && (
                            <button className={`${btnPrimary} shrink-0 rounded-xl px-8 py-4 text-lg font-bold uppercase`} onClick={() => setEditModal(true)}>EDIT</button>
                        )}
                        {/* Profil d'un autre joueur qui n'est pas encore mon ami */}
                        {!isMe && !loading && !error && !isFriend && (
                            <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
                                <button
                                    className={`${btnPrimary} rounded-xl px-8 py-4 text-lg font-bold uppercase`}
                                    disabled={adding || iInvited}
                                    onClick={addFriend}>
                                    {adding ? '...' : iInvited ? 'Request sent' : invitedMe ? 'Accept request' : 'Add friend'}
                                </button>
                                {addError && <p className={`${feedback.error} mt-0`}>{addError}</p>}
                            </div>
                        )}
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
                                    <span className="text-green-600">{data.wins} W</span> · <span className="text-red-500">{data.losses} L</span>
                                </p>
                            )}
                        </div>

                        <div className="my-6 h-0.5 bg-slate-300 md:mx-10 md:my-0 md:h-auto md:w-0.5"></div>

                        <div className="flex flex-1 flex-col justify-start">
                            <h3 className="mb-4 text-lg font-bold text-slate-800 sm:text-xl">Match history</h3>
                            {loading && <p className={emptyText}>Loading...</p>}
                            {!loading && !error && games.length === 0 && (
                                <p className={emptyText}>No game played yet</p>
                            )}
                            <ul className="flex max-h-[360px] flex-col gap-4 overflow-y-auto pr-2">
                                {games.map((game, i) => {
                                    const result = RESULTS[gameResult(game)];
                                    return (
                                        <li key={game.id ?? `${game.created_at}-${i}`} className={`${matchItem} ${result.border}`} title={game.name}>
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

            {isMe && editModal && (
                <Modal title="Edit profile" onClose={closeModal}>
                    <EditProfile />
                </Modal>
            )}

        </div>
    );
}
