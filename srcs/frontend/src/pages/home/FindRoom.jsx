import axios from 'axios';
import { useEffect, useState } from 'react';
// import { socket } from '../../main';
import { io } from "socket.io-client";
import './FindRoom.css'

export function FindRoom() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(false);

    // const [error, setError] = useState(null);

    // useEffect(() => {
    //     socket.on("/rooms/createRoom", (arg) => {
    //         setRooms(rooms => [arg, ...rooms]);
    //     });

    //     socket.on("connect", () => {
    //         console.log("🟢 WebSocket Connecté ! ID:", socket.id);
    //     });

    //     socket.on("connect_error", (err) => {
    //         console.error("🔴 Erreur de connexion WebSocket:", err.message);
    //     });

    //     const fetchRooms = async () => {
    //         // setError(null);
    //         try {
    //             const response = await axios.get('/api/rooms/getRooms', {
    //                 withCredentials: true
    //             });
    //             setRooms(response.data);
    //             console.log(response.data);
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     }

    //     fetchRooms();

    //     return () => {
    //         socket.off("connect");
    //         socket.off("connect_error");
    //         socket.off("rooms/createRoom");
    //     };
    // }, []);

    useEffect(() => {
        const socket = io("/Rooms", {
            autoConnect: false,
        });

        socket.on("createRoom", (arg) => {
            setRooms((prevRooms) => [arg, ...prevRooms]);
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
		        socket.connect();
            } catch (err) {
                console.log(err);
            }
        }

        fetchRooms();

        return () => {
            socket.off("createRoom");
            socket.off("connect_error");
            socket.disconnect();
        };
    }, []);

    return (
        <div className="find-content">

            <div className="rooms-grid">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className={`room-card ${selectedRoomId === room.id ? 'selected' : ''}`}
                        onClick={() => setSelectedRoomId(room.id)}
                    >
                        <p>{room.name}</p>
                        {room.ispass && <p>cadenas</p>}
                        <p>{room.nb_players} / {room.max_players}</p>
                    </div>
                ))}
            </div>

            <div className="join-sidebar">
                <div className="password-section">
                    <label htmlFor="room-password">MDP</label>
                    <input
                        id="room-password"
                        type="password"
                    />
                </div>
                <button disabled={!selectedRoomId} className="join-button">JOIN</button>
            </div>
        </div>
    );
}
