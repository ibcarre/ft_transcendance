import { useState } from 'react';
import { createRoom, ALREADY_IN_ROOM } from '../../services/rooms';
import { errorMessage } from '../../services/user';
import { inputClass, btnPrimary, labelClass, feedback } from '../../styles/ui';

// onEnter(roomId) : room créée ; onAlreadyInRoom() : le back dit qu'on est déjà dans une room
export function CreateRoom({ inRoom = false, onEnter, onAlreadyInRoom }) {
    const [roomName, setRoomName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState('2');
    const [password, setPassword] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = roomName.trim();
        if (!name || inRoom) return;

        setSending(true);
        setError(null);
        try {
            const response = await createRoom({ name, password, maxPlayers: parseInt(maxPlayers, 10) });
            onEnter?.(response.data);
        } catch (err) {
            const message = errorMessage(err);
            setError(message);
            if (message === ALREADY_IN_ROOM) onAlreadyInRoom?.();
        } finally {
            setSending(false);
        }
    };

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
                    maxLength={24}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="room-players" className={labelClass}>Nb players</label>
                {/* 2 à 4 joueurs : seules valeurs acceptées par le back */}
                <select
                    id="room-players"
                    className={`${inputClass} cursor-pointer`}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                >
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
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

            {inRoom && <p className={`${feedback.info} mt-0`}>You're already in a room.</p>}
            {error && <p className={`${feedback.error} mt-0`}>{error}</p>}

            <button
                type="submit"
                className={`${btnPrimary} mt-2.5 w-full p-3.5 text-base font-bold`}
                disabled={sending || inRoom || !roomName.trim()}>
                {sending ? 'CREATING...' : 'CREATE'}
            </button>
        </form>
    );
}
