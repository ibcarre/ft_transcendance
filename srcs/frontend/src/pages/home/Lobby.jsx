import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { FindRoom } from './FindRoom';
import { CreateRoom } from './CreateRoom';
import { PrivacyLink } from '../../components/PrivacyLink';
import { fetchMyRoomId, leaveRoom } from '../../services/rooms';
import { errorMessage } from '../../services/user';
import { panel, btnLobby, btnPrimary, logoSlice, feedback } from '../../styles/ui';

const lobbyButton = `${btnLobby} w-full rounded-xl p-5 text-xl sm:p-6 sm:text-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100`;

export function Lobby() {
    const navigate = useNavigate();
    const [modalType, setModalType] = useState(null);
    // id de la room où je suis déjà (pending ou playing), sinon null
    const [myRoomId, setMyRoomId] = useState(null);
    const [leaving, setLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState(null);

    const closeModal = () => setModalType(null);

    const refreshMyRoom = useCallback(
        () => fetchMyRoomId().then(setMyRoomId, () => {}),
        []);

    // Au chargement du lobby : suis-je déjà dans une room ?
    useEffect(() => {
        let active = true;
        fetchMyRoomId().then((id) => { if (active) setMyRoomId(id); }, () => {});
        return () => { active = false; };
    }, []);

    // Room créée ou rejointe : on la retient et on va sur la page de jeu
    const enterRoom = (roomId) => {
        setMyRoomId(roomId);
        setModalType(null);
        navigate('/game');
    };

    // Quitte la room (le cas d'une partie en cours n'est pas encore géré)
    const handleLeave = async () => {
        setLeaving(true);
        setLeaveError(null);
        try {
            await leaveRoom(myRoomId);
            setMyRoomId(null);
        } catch (err) {
            setLeaveError(errorMessage(err));
        } finally {
            setLeaving(false);
        }
    };

    const inRoom = !!myRoomId;

    return (
        <div className="flex min-h-screen flex-col">

            <Header />

            <div className="my-auto flex w-full flex-col items-center justify-center px-4 pt-6">
                <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center">

                    <div className={`${panel} box-border flex w-full max-w-xl flex-col items-stretch gap-6 px-6 py-10 sm:gap-[30px] sm:px-[60px] sm:py-20 lg:w-[45%] lg:max-w-[1400px]`}>
                        <button
                            className={`${lobbyButton} ${logoSlice.SK}`}
                            disabled={inRoom}
                            title={inRoom ? "You're already in a room" : undefined}
                            onClick={() => setModalType('create')}>
                            Create a room
                        </button>
                        <button className={`${lobbyButton} ${logoSlice.Y}`} onClick={() => setModalType('find')}>
                            Find a room
                        </button>
                        <button className={`${lobbyButton} ${logoSlice.JO}`} onClick={() => setModalType('offline')}>
                            Play offline
                        </button>
                    </div>

                    {/* Déjà dans une room : au-dessus des boutons sur mobile, à droite sur grand écran */}
                    {inRoom && (
                        <div className={`${panel} -order-1 flex w-full max-w-xl flex-col items-center gap-4 p-6 text-center lg:order-none lg:w-80`}>
                            <p className="text-xl font-bold text-slate-800">You're already in a room</p>
                            <p className="text-sm text-slate-600">Leave it before creating or joining another one.</p>
                            <button className={`${btnPrimary} w-full py-3 text-base font-bold`} onClick={() => navigate('/game')}>
                                Back to the room
                            </button>
                            <button
                                className="w-full cursor-pointer rounded-lg bg-linear-to-r from-red-500 to-rose-600 py-3 text-base font-bold text-white text-shadow-md transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                disabled={leaving}
                                onClick={handleLeave}>
                                {leaving ? 'Leaving...' : 'Leave the room'}
                            </button>
                            {leaveError && <p className={`${feedback.error} mt-0 w-full`}>{leaveError}</p>}
                        </div>
                    )}
                </div>
                <PrivacyLink />
            </div>

            {modalType === 'create' && (
                <Modal title="Create a room" onClose={closeModal}>
                    <CreateRoom inRoom={inRoom} onEnter={enterRoom} onAlreadyInRoom={refreshMyRoom} />
                </Modal>
            )}

            {modalType === 'find' && (
                <Modal title="Find a room" onClose={closeModal}>
                    <FindRoom inRoom={inRoom} onEnter={enterRoom} onAlreadyInRoom={refreshMyRoom} />
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
