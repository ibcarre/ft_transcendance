import { io } from "socket.io-client";
import { useEffect, useState } from "react";

export function RoomList() {
    const [rooms, setRooms] = useState([]);
    
    // fetch initial state
    useEffect(() => {
        const socket = io("/Rooms", {
            autoConnect: false
        });

        socket.on("createRoom", (arg) => {
            setRooms(arg);
        });

        async function fetchData() {
            const res = await fetch("/api/rooms/getRooms");
            const data = await res.json();

            setRooms("data");
            socket.connect();
        }

        fetchData();

        return () => {
            socket.off("createRoom");
            socket.disconnect();
        };
    }, []);
    //pour chaque getRooms tu crees les rooms avec comme arg (id, GameroomName, password, created by, nb_players, max_players
    return (
        <li>{rooms}</li>
    );
}