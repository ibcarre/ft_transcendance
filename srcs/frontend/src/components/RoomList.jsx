import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Room } from "./Room";

export function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [isAuth, setAuth] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const socket = io("/Rooms", {
            autoConnect: false,
        });

        socket.on("createRoom", (arg) => {
            setRooms((prevRooms) => [arg, ...prevRooms]);
        });

        socket.on("connect_error", (error) => {
            console.log("Socket CONNECT ERROR:", error);
            setAuth(false);
        });

        async function fetchData() {
            try {
                const res = await fetch("/api/rooms/getRooms");

                if (!res.ok) {
                    setAuth(false);
                    return;
                }

                const data = await res.json();
                setRooms(data);

                socket.connect();
            } catch (error) {
                console.error("Erreur lors de la récupération des rooms:", error);
                setAuth(false);
            }
        }

        fetchData();

        return () => {
            socket.off("createRoom");
            socket.off("connect_error");
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isAuth) {
            navigate("/signup");
        }
    }, [isAuth, navigate]);

    if (!isAuth) {
        return null;
    }

    return (
        <li>
            {rooms.map((room) => (
                <Room
                    key={room.id}
                    id={room.id}
                    name={room.name}
                    isPassProt={room.ispass}
                    created_by={room.created_by}
                    nb_players={room.nb_players}
                    max_players={room.max_players}
                />
            ))}
        </li>
    );
}