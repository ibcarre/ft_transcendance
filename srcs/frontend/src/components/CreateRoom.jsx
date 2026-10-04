export function CreateRoom () {
    return (
        <div className="create-content">
        <label>Room's name</label>
        <input/>
        <label>Nb players</label>
        <input type="number" min="2" max="8"required />
        <label>Password</label>
        <input type="password" />
        <button>Create</button>
        </div>
    );
}