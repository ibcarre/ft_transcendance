import './CreateRoom.css'

export function CreateRoom() {
    return (
        <div className="create-content">
            <div className="input-group">
                <label htmlFor="room-name">Room's name</label>
                <input id="room-name" type="text" placeholder="My awesome room" />
            </div>

            <div className="input-group">
                <label htmlFor="room-players">Nb players</label>
                <input id="room-players" type="number" min="2" max="8" defaultValue="4" required />
            </div>

            <div className="input-group">
                <label htmlFor="room-pwd">Password (optional)</label>
                <input id="room-pwd" type="password" placeholder="Leave empty for public" />
            </div>

            <button className="action-button">CREATE</button>
        </div>
    );
}