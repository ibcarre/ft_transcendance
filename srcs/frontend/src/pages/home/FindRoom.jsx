import axios from 'axios';
import { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import { inputClass, btnPrimary, labelClass } from '../../styles/ui';

export function FindRoom() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(false);

    useEffect(() => {
        const socket = io("/Rooms", {});

        socket.on("createRoom", (arg) => {
            setRooms(prevRooms => [arg, ...prevRooms]);
        });

        socket.on("connect_error", (error) => {
            console.log("Socket CONNECT ERROR:", error);

        });

        socket.on("playerJoined", ({ roomId, nbPlayers }) => {
            setRooms(prev =>
                prev.map(room =>
                    room.id === roomId ? { ...room, nb_players: nbPlayers } : room ));});

        const fetchRooms = async () => {
            // setError(null);
            try {
                const response = await axios.get('/api/rooms/getRooms', {
                    withCredentials: true
                });
                setRooms(response.data);
                console.log(response.data);
            } catch (err) {
                console.log(err);
            }
        }

        fetchRooms();

        return () => {
            socket.off("createRoom");
            socket.off("connect_error");
        };
    }, []);

    return (
        <div className="flex w-full flex-col gap-6 md:h-[500px] md:w-[750px] md:flex-row">

            <div className="grid max-h-[45vh] flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto px-2.5 sm:grid-cols-2 md:max-h-none">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className={`flex max-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-3 py-4 text-center font-bold text-slate-800 transition ${selectedRoomId === room.id ? 'border-blue-500 bg-sky-100' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}`}
                        onClick={() => setSelectedRoomId(room.id)}
                    >
                        <p className="my-1 break-all">{room.name}</p>
                        {!!room.ispass && <p className="my-1">cadenas</p>}
                        <p className="my-1">{room.nb_players} / {room.max_players}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-4 md:w-56 md:justify-between">
                <div className="flex flex-col gap-2">
                    <label htmlFor="room-password" className={`${labelClass} text-lg`}>MDP</label>
                    <input
                        id="room-password"
                        type="password"
                        className={inputClass}
                    />
                </div>
                <button disabled={!selectedRoomId} className={`${btnPrimary} w-full p-3.5 text-base font-bold`}>JOIN</button>
            </div>
        </div>
    );
}
