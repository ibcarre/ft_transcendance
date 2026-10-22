import axios from 'axios';
import { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import { inputClass, btnPrimary, labelClass } from '../../styles/ui';

const emptyText = "col-span-full py-2 text-center text-sm text-slate-400";

export function FindRoom() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
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

    return (
        <div className="flex w-full flex-col gap-6 md:h-[500px] md:w-[750px] md:flex-row">

            <div className="grid max-h-[45vh] flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto px-2.5 sm:grid-cols-2 md:max-h-none">
                {loading && <p className={emptyText}>Loading...</p>}
                {error && <p className={`${emptyText} font-semibold text-red-500`}>{error}</p>}
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
                            onClick={() => !full && setSelectedRoomId(room.id)}
                            title={full ? "Room is full" : undefined}
                        >
                            <p className="my-1 break-all">{room.name}</p>
                            <p className="my-1">{!!room.ispass && <span title="Password protected">🔒 </span>}{room.nb_players} / {room.max_players}</p>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-4 md:w-56">
                {/* Champ mot de passe seulement pour une room protégée ; key le vide quand on change de room */}
                {!!selectedRoom?.ispass && (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="room-password" className={`${labelClass} text-lg`}>Room password</label>
                        <input
                            key={selectedRoom.id}
                            id="room-password"
                            type="password"
                            className={inputClass}
                            autoFocus
                        />
                    </div>
                )}
                <button disabled={!selectedRoomId} className={`${btnPrimary} w-full p-3.5 text-base font-bold md:mt-auto`}>JOIN</button>
            </div>
        </div>
    );
}
