import { useState } from 'react';
import { LobbyModal } from '../../components/LobbyModal';
import { FindRoom } from '../../components/FindRoom';
import { CreateRoom } from '../../components/CreateRoom';
import './Lobby.css';

export function Lobby() {
    const [modalType, setModalType] = useState(null);

    const closeModal = () => setModalType(null);

    return (
        <div className="lobby-container">

            <header className="lobby-header">
                <h1>SKYJO</h1>
                <h2>Menu</h2>
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
                    <CreateRoom />
                </LobbyModal>
            )}

            {modalType === 'find' && (
                <LobbyModal title="Find a room" onClose={closeModal}>
                    <p>Recherche des parties de Skyjo en cours...</p>
                    <ul>
                        <RoomList></RoomList>
                    </ul>
                </LobbyModal>
            )}

            {modalType === 'offline' && (
                <LobbyModal title="Play offline" onClose={closeModal}>
                    <p>COMING SOON</p>
                </LobbyModal>
            )}

        </div>
    );
}