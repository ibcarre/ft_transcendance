import './Modal.css';

export function Modal({ title, onClose, children }) {
    return (
        <div className="modal">
            <div onClick={onClose} className="overlay" />
            <div className="modal-content">

                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                {children}
                
            </div>
        </div>
    );
}