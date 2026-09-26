import { useState } from 'react';
import { LobbyModal } from '../../components/LobbyModal';
import './Lobby.css';

export function Lobby() {
    const [modalType, setModalType] = useState(null);

    const closeModal = () => setModalType(null);

    return (
        <div className="lobby-container">

            <header className="lobby-header">
                <h1>SKYJO</h1>
                <h2>Profil</h2>
            </header>

            <div className="lobby-wrapper">
                <div className="button-container">
                    <button className="lobby-button" onClick={() => setModalType('create')}>
                        Create a room
                    </button>
                    <button className="lobby-button" onClick={() => setModalType('find')}>
                        Find a room
                    </button>
                    <button className="lobby-button" onClick={() => setModalType('offline')}>
                        Play offline
                    </button>
                </div>
                <p className="privacy">Privacy Terms & Conditions</p>
            </div>

            {modalType === 'create' && (
                <LobbyModal title="Create a room" onClose={closeModal}>
                    {/* Tout ce qui est ici devient le "children" */}
                    <p>Choisis le nombre de joueurs et définis un mot de passe pour ta partie de Skyjo.</p>
                    <button>Créer la partie</button>
                </LobbyModal>
            )}

            {modalType === 'find' && (
                <LobbyModal title="Find a room" onClose={closeModal}>
                    <p>Recherche des parties de Skyjo en cours...</p>
                    <ul>
                        <li>Partie de Toto (3/4 joueurs)</li>
                        <li>Partie de Tata (1/4 joueurs)</li>
                    </ul>
                </LobbyModal>
            )}

            {modalType === 'offline' && (
                <LobbyModal title="Play offline" onClose={closeModal}>
                    <p>Combien de bots veux-tu affronter ?</p>
                    <input type="number" min="1" max="7" />
                </LobbyModal>
            )}

        </div>
    );
}