import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import './Room.css';

export function Room({id, name, isPassProt, created_by, nb_players, max_players}) {

    return (<div className="room">
                <div>{name}</div>
                <div>{isPassProt}</div>
                <div>{created_by}</div>
                <div>{nb_players}</div>
                <div>{max_players}</div>
            </div>) 
}
