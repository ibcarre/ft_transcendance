import axios from 'axios';
import { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import { joinRoom, ALREADY_IN_ROOM } from '../../services/rooms';
import { errorMessage } from '../../services/user';
import { inputClass, btnPrimary, labelClass, feedback } from '../../styles/ui';

const emptyText = "col-span-full py-2 text-center text-sm text-slate-400";

// inRoom : déjà dans une room (JOIN bloqué) ; onEnter(roomId) : room rejointe ;
// onAlreadyInRoom() : le back dit qu'on est déjà dans une room
export function FindRoom({ inRoom = false, onEnter, onAlreadyInRoom }) {
    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [password, setPassword] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Évite de mettre à jour l'état si la modal est fermée avant la réponse
        let active = true;

        const loadRooms = () => axios.get('/api/rooms/getRooms', { withCredentials: true })
            .then((res) => {
                if (!active) return;
                setRooms(Array.isArray(res.data) ? res.data : []);
                setError(null);
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.message || "Failed to load rooms");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        loadRooms();

        const socket = io("/Rooms", { withCredentials: true });

        // Les événements reçus pendant une coupure sont perdus : on recharge à chaque reconnexion
        let firstConnect = true;
        socket.on("connect", () => {
            if (firstConnect) firstConnect = false;
            else loadRooms();
        });

        socket.on("connect_error", (err) => console.log("Rooms socket error:", err.message));

        // Nouvelle room (ignorée si getRooms l'a déjà renvoyée)
        socket.on("createRoom", (room) => {
            setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]));
        });

        // Un joueur a rejoint ou quitté une room
        socket.on("playerEvent", ({ roomId, nbPlayers }) => {
            setRooms((prev) => prev.map((room) =>
                room.id === roomId ? { ...room, nb_players: nbPlayers } : room));
        });

        // Room supprimée (le back n'envoie que son id)
        socket.on("RoomDeleted", (roomId) => {
            setRooms((prev) => prev.filter((room) => room.id !== roomId));
            setSelectedRoomId((id) => (id === roomId ? null : id));
        });

        return () => {
            active = false;
            socket.disconnect();
        };
    }, []);

    const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

    const selectRoom = (room) => {
        setSelectedRoomId(room.id);
        setPassword('');
        setJoinError(null);
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!selectedRoom || inRoom) return;

        setJoining(true);
        setJoinError(null);
        try {
            await joinRoom(selectedRoom.id, selectedRoom.ispass ? password : '');
            onEnter?.(selectedRoom.id);
        } catch (err) {
            const message = errorMessage(err);
            setJoinError(message);
            if (message === ALREADY_IN_ROOM) onAlreadyInRoom?.();
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="flex w-full flex-col gap-6 md:h-[500px] md:w-[750px] md:flex-row">

            <div className="grid max-h-[45vh] flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto px-2.5 sm:grid-cols-2 md:max-h-none">
                {loading && <p className={emptyText}>Loading...</p>}
                {error && <p className={`${feedback.error} col-span-full mt-0`}>{error}</p>}
                {!loading && !error && rooms.length === 0 && (
                    <p className={emptyText}>No room available, create one!</p>
                )}

                {rooms.map((room) => {
                    const full = room.nb_players >= room.max_players;
                    const selected = selectedRoomId === room.id;
                    return (
                        <div
                            key={room.id}
                            className={`flex max-h-[200px] flex-col items-center justify-center rounded-xl border-2 px-3 py-4 text-center font-bold text-slate-800 transition ${full ? 'cursor-not-allowed border-slate-300 bg-slate-50 opacity-50' : selected ? 'cursor-pointer border-blue-500 bg-sky-100' : 'cursor-pointer border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}`}
                            onClick={() => !full && selectRoom(room)}
                            title={full ? "Room is full" : undefined}
                        >
                            <p className="my-1 break-all">{room.name}</p>
                            <p className="my-1">{!!room.ispass && <span title="Password protected">🔒 </span>}{room.nb_players} / {room.max_players}</p>
                        </div>
                    );
                })}
            </div>

            <form className="flex flex-col gap-4 md:w-56" onSubmit={handleJoin}>
                {/* Champ mot de passe seulement pour une room protégée (vidé quand on change de room) */}
                {!!selectedRoom?.ispass && (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="room-password" className={`${labelClass} text-lg`}>Room password</label>
                        <input
                            id="room-password"
                            type="password"
                            className={inputClass}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
                <div className="flex flex-col gap-2 md:mt-auto">
                    {inRoom && <p className={`${feedback.info} mt-0`}>You're already in a room.</p>}
                    {joinError && <p className={`${feedback.error} mt-0`}>{joinError}</p>}
                    <button
                        type="submit"
                        className={`${btnPrimary} w-full p-3.5 text-base font-bold`}
                        disabled={!selectedRoom || inRoom || joining || (!!selectedRoom.ispass && !password)}>
                        {joining ? 'JOINING...' : 'JOIN'}
                    </button>
                </div>
            </form>
        </div>
    );
}
