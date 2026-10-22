import { useState } from 'react';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { FindRoom } from './FindRoom';
import { CreateRoom } from './CreateRoom';
import { PrivacyLink } from '../../components/PrivacyLink';
import { panel, btnLobby, logoSlice } from '../../styles/ui';

const lobbyButton = `${btnLobby} w-full rounded-xl p-5 text-xl sm:p-6 sm:text-2xl`;

export function Lobby() {
    const [modalType, setModalType] = useState(null);

    const closeModal = () => setModalType(null);

    return (
        <div className="flex min-h-screen flex-col">

            <Header />

            <div className="my-auto flex w-full flex-col items-center justify-center px-4 pt-6">
                <div className={`${panel} box-border flex w-full max-w-xl flex-col items-stretch gap-6 px-6 py-10 sm:gap-[30px] sm:px-[60px] sm:py-20 lg:w-[45%] lg:max-w-[1400px]`}>
                    <button className={`${lobbyButton} ${logoSlice.SK}`} onClick={() => setModalType('create')}>
                        Create a room
                    </button>
                    <button className={`${lobbyButton} ${logoSlice.Y}`} onClick={() => setModalType('find')}>
                        Find a room
                    </button>
                    <button className={`${lobbyButton} ${logoSlice.JO}`} onClick={() => setModalType('offline')}>
                        Play offline
                    </button>
                </div>
                <PrivacyLink />
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
