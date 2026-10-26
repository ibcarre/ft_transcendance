import { useState } from "react";
import { Link } from 'react-router';
import axios from 'axios';
import { useFriends } from '../context/useFriends';
import { errorMessage } from '../services/user';
import { inputClass, btnPrimary, feedback, logoGradientHover } from '../styles/ui';

const sectionTitle = "border-b-2 border-slate-200 pb-2 text-lg font-bold text-slate-800";
const listContainer = "flex flex-col gap-2.5 overflow-y-auto pr-2";
const friendItem = "flex shrink-0 items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors";
const friendName = `truncate text-base font-bold text-slate-800 ${logoGradientHover}`;
const actionButton = "cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
const emptyText = "py-2 text-center text-sm text-slate-400";

function StatusDot({ status }) {
    const online = status === 'online';
    return (
        <span
            className={`size-2.5 shrink-0 rounded-full ${online ? 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]' : 'bg-slate-400'}`}
            title={online ? 'Online' : 'Offline'}
            aria-label={online ? 'Online' : 'Offline'}
        />
    );
}

// onNavigate : appelé quand on ouvre un profil (ferme la modal)
export function Friends({ onNavigate }) {
    // Listes partagées et mises à jour en temps réel par FriendsProvider (socket /Friends)
    const { friends: friendsList, requests, loading, error, reload: reloadFriends } = useFriends();

    const [newFriend, setNewFriend] = useState('');
    const [adding, setAdding] = useState(false);
    const [notice, setNotice] = useState(null);
    // id de la ligne en cours de traitement (désactive ses boutons)
    const [busyId, setBusyId] = useState(null);
    // id de l'ami dont on demande la confirmation de suppression
    const [confirmId, setConfirmId] = useState(null);

    const addFriend = async (e) => {
        e.preventDefault();
        const friendUsername = newFriend.trim();
        if (!friendUsername) return;

        setAdding(true);
        setNotice(null);
        try {
            const response = await axios.post('/api/friends/add', { friendUsername }, { withCredentials: true });
            const message = response.data?.message;
            // 201 : invitation envoyée ; 200 "Friendship accepted" : il nous avait déjà invité
            const done = response.status === 201 || message === "Friendship accepted";
            setNotice({ type: done ? 'success' : 'info', message });
            if (done) setNewFriend('');
            if (message === "Friendship accepted") reloadFriends();
        } catch (err) {
            setNotice({ type: 'error', message: errorMessage(err) });
        } finally {
            setAdding(false);
        }
    };

    // add / remove avec le nom de la personne :
    // accepter une invitation = add, la refuser = remove, retirer un ami = remove
    const friendAction = async (user, route) => {
        setBusyId(user.id);
        setConfirmId(null);
        setNotice(null);
        try {
            const response = await axios.post(`/api/friends/${route}`,
                { friendUsername: user.name }, { withCredentials: true });
            setNotice({ type: 'success', message: response.data?.message });
            await reloadFriends();
        } catch (err) {
            setNotice({ type: 'error', message: errorMessage(err) });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="box-border flex w-full flex-col gap-8 p-2.5 sm:w-[400px]">

            <form className="flex flex-col gap-2" onSubmit={addFriend}>
                <div className="flex gap-3">
                    <input
                        placeholder="Add a friend"
                        className={inputClass}
                        value={newFriend}
                        autoComplete="off"
                        onChange={(e) => setNewFriend(e.target.value)}
                    />
                    <button
                        type="submit"
                        className={`${btnPrimary} px-4 py-3 text-sm sm:px-6`}
                        disabled={adding || !newFriend.trim()}>
                        ADD
                    </button>
                </div>
                {notice && <p className={feedback[notice.type]}>{notice.message}</p>}
            </form>

            {error && <p className={feedback.error}>{error}</p>}

            {requests.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p className={sectionTitle}>Friend request</p>

                    <div className={`${listContainer} max-h-[150px]`}>
                        {requests.map((req) => (
                            <div key={req.id} className={`${friendItem} border-yellow-200 bg-yellow-50`}>
                                <Link to={`/profile/${encodeURIComponent(req.name)}`} className={friendName} title="See profile" onClick={onNavigate}>{req.name}</Link>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        className={`${actionButton} bg-green-500 hover:bg-green-600`}
                                        title="Accept"
                                        disabled={busyId === req.id}
                                        onClick={() => friendAction(req, 'add')}>
                                        ✔
                                    </button>
                                    <button
                                        className={`${actionButton} bg-red-500 hover:bg-red-600`}
                                        title="Refuse"
                                        disabled={busyId === req.id}
                                        onClick={() => friendAction(req, 'remove')}>
                                        ✖
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <p className={sectionTitle}>Friend list</p>
                <div className={`${listContainer} max-h-[250px]`}>
                    {loading && <p className={emptyText}>Loading...</p>}
                    {!loading && !error && friendsList.length === 0 && (
                        <p className={emptyText}>No friends yet, add one above!</p>
                    )}
                    {friendsList.map((friend) => (
                        <div key={friend.id} className={`${friendItem} border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100`}>
                            <div className="flex min-w-0 items-center gap-3">
                                <StatusDot status={friend.status} />
                                <Link to={`/profile/${encodeURIComponent(friend.name)}`} className={friendName} title="See profile" onClick={onNavigate}>{friend.name}</Link>
                            </div>
                            {confirmId === friend.id ? (
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        className={`${actionButton} bg-red-500 hover:bg-red-600`}
                                        disabled={busyId === friend.id}
                                        onClick={() => friendAction(friend, 'remove')}>
                                        Remove
                                    </button>
                                    <button
                                        className={`${actionButton} bg-slate-400 hover:bg-slate-500`}
                                        disabled={busyId === friend.id}
                                        onClick={() => setConfirmId(null)}>
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className={`${actionButton} shrink-0 bg-red-500 hover:bg-red-600`}
                                    title="Remove friend"
                                    onClick={() => setConfirmId(friend.id)}>
                                    ✖
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
