import { useState } from 'react';
import './FindRoom.css'

// Une fausse base de données de parties pour tester l'affichage
const mockRooms = [
    { id: 1, name: "houssen's room", isLocked: true, players: "3/4" },
    { id: 2, name: "Alice's room", isLocked: false, players: "2/4" },
    { id: 3, name: "Bob's room", isLocked: true, players: "1/4" },
    { id: 4, name: "Charlie's room", isLocked: false, players: "4/4" },
    { id: 5, name: "David's room", isLocked: false, players: "1/4" },
    { id: 6, name: "Eve's room", isLocked: true, players: "3/4" },
    { id: 7, name: "Jessie's room", isLocked: true, players: "2/4" },
    { id: 8, name: "Jessie's room", isLocked: true, players: "2/4" },
    { id: 9, name: "Jessie's room", isLocked: true, players: "2/4" },
    { id: 10, name: "Jessie's room", isLocked: true, players: "2/4" },
    { id: 11, name: "Jessie's room", isLocked: true, players: "2/4" },
];

export function FindRoom() {
    const [selectedRoomId, setSelectedRoomId] = useState(false);

    return (
        <div className="find-content">

            <div className="rooms-grid">
                {mockRooms.map((room) => (
                    <div
                        key={room.id}
                        className={`room-card ${selectedRoomId === room.id ? 'selected' : ''}`}
                        onClick={() => setSelectedRoomId(room.id)}
                    >
                        <p>{room.name}</p>
                        {room.isLocked && <p>cadena</p>}
                        <p>{room.players}</p>
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