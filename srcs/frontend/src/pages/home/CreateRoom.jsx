import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { inputClass, btnPrimary, labelClass } from '../../styles/ui';

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

                console.log("Room creer");
                navigate("/game");
            }

        } catch (err) {
            if (err.response && err.response.data)
                console.log("error");
        }
    }

    return (
        <form className="flex w-full flex-col gap-5 sm:w-[350px]" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
                <label htmlFor="room-name" className={labelClass}>Room's name</label>
                <input
                    id="room-name"
                    type="text"
                    className={inputClass}
                    placeholder="My awesome room"
                    value={roomName}
                    autoComplete="off"
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="room-players" className={labelClass}>Nb players</label>
                <input
                    id="room-players"
                    type="number"
                    className={inputClass}
                    min="2" max="4"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="room-pwd" className={labelClass}>Password (optional)</label>
                <input
                    id="room-pwd"
                    type="password"
                    className={inputClass}
                    placeholder="Leave empty for public"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                className={`${btnPrimary} mt-2.5 w-full p-3.5 text-base font-bold`}>CREATE</button>
        </form>
    );
}