import './LobbyModal.css';

export function LobbyModal({ title, onClose, children }) {
    return (
        <div className="lobby-modal">
            <div onClick={onClose} className="overlay" />
            <div className="modal-content">

                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="modal-body">
                    {children}
                </div>

            </div>
        </div>
    );
}