import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import './Room.css';

export function Room({id, name, isPassProt, created_by, nb_players, max_players}) {
    const [update_nb_players, setNb_players] = useState(nb_players);
    useEffect(() => {
        const socket = io("/Rooms");

        socket.on("playerJoined", (arg) => {
            setNb_players(arg);
        });

        return () => {
            socket.off("createRoom");
            socket.off("connect_error");
            socket.disconnect();
        };
    }, []);

    return (<div className="room">
                <div>{name}</div>
                <div>{isPassProt}</div>
                <div>{created_by}</div>
                <div>{update_nb_players}</div>
                <div>{max_players}</div>
            </div>) 
}
