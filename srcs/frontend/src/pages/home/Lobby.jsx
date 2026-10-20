import { Link } from 'react-router';
import { useState } from 'react';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { FindRoom } from './FindRoom';
import { CreateRoom } from './CreateRoom';
import './Lobby.css';

export function Lobby() {
    const [modalType, setModalType] = useState(null);

    const closeModal = () => setModalType(null);

    return (
        <div className="lobby-container">

            <Header />

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
                <Link to="/privacy" className="privacy-link"><p className="privacy">Privacy Policy & Terms Conditions</p></Link>
            </div>

            {modalType === 'create' && (
                <Modal title="Create a room" onClose={closeModal}>
                    <CreateRoom />
                </Modal>
            )}

            {modalType === 'find' && (
                <Modal title="Find a room" onClose={closeModal}>
                    <FindRoom />
                </Modal>
            )}

            {modalType === 'offline' && (
                <Modal title="Play offline" onClose={closeModal}>
                    <p>COMING SOON</p>
                </Modal>
            )}

        </div>
    );
}
