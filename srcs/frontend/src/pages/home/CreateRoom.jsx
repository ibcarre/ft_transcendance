import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import './CreateRoom.css'

/*TODO
Nom de room obligatoire et coupé si plus de 24 caracteres
Redirection vers la page game
*/

export function CreateRoom() {
    let navigate = useNavigate();

    const [roomName, setRoomName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState('2');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/api/rooms/createRoom', {
                password: password,
                name: roomName,
                max_players: parseInt(maxPlayers, 10)
            }, {
                withCredentials: true
            });

            if (response.status === 201) {
                setPassword('');
                setRoomName('');
                setMaxPlayers('2');

                navigate("/profile");
            }

        } catch (err) {
            if (err.response && err.response.data)
                console.log("error");
        }
    }

    return (
        <form className="create-content" onSubmit={handleSubmit}>
            <div className="input-group">
                <label htmlFor="room-name">Room's name</label>
                <input
                    id="room-name"
                    type="text"
                    placeholder="My awesome room"
                    value={roomName}
                    autoComplete="off"
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                />
            </div>

            <div className="input-group">
                <label htmlFor="room-players">Nb players</label>
                <input
                    id="room-players"
                    type="number"
                    min="2" max="4"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    required
                />
            </div>

            <div className="input-group">
                <label htmlFor="room-pwd">Password (optional)</label>
                <input
                    id="room-pwd"
                    type="password"
                    placeholder="Leave empty for public"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                className="action-button">CREATE</button>
        </form>
    );
}