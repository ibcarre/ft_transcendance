import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import { useFriends } from '../context/useFriends';
import { Friends } from './Friends';
import { Chat } from './Chat';
import { Modal } from './Modal';
import { logoGradient, logoGradientHover, logoSliceHover, rainbowBorder } from '../styles/ui';

// Profile / Friends / Chat : au survol, même dégradé que les boutons du lobby (SK / Y / JO) ; Logout en dégradé rouge
const menuLink = "cursor-pointer select-none px-5 py-3.5 text-left text-base font-semibold text-slate-800 hover:text-white hover:text-shadow-md";

export function Header() {
    const [modalType, setModalType] = useState(null);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);

    const { userInfo, setIsAuth, setUserInfo } = useAuth();
    const { requests } = useFriends();
    const navigate = useNavigate();

    const closeModal = () => setModalType(null);

    const openModal = (type) => {
        setModalType(type);
        setMenu(false);
    };

    const logout = async () => {
        setMenu(false);
        try {
            // Le back passe le statut à offline et supprime le cookie access_token
            await axios.post('/api/user/logout', {}, { withCredentials: true });
            setIsAuth(false);
            setUserInfo(null);
            navigate('/');
        } catch (err) {
            // Un 401 est déjà géré par l'intercepteur de AuthContext
            console.log(err.response?.data || err);
        }
    };

    const toggleMenu = () => {
        setMenu(!menu)
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <header className="flex w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-8 lg:px-[60px]">
                <Link to="/lobby">
                    <h1 className={`select-none text-5xl font-black tracking-[2px] sm:text-6xl lg:text-[80px] ${logoGradient}`}>SKYJO</h1>
                </Link>
                <div className="relative flex min-w-0 cursor-pointer select-none flex-col items-end" ref={menuRef}>
                    <h2 onClick={toggleMenu} className={`max-w-[50vw] truncate text-xl font-bold text-slate-800 sm:text-2xl lg:text-[35px] ${logoGradientHover}`}>
                        {userInfo.name}
                        {/* Pastille : invitations d'amis en attente */}
                        {requests.length > 0 && (
                            <span className="ml-2 inline-block size-3 rounded-full bg-red-500 align-middle" aria-label="New friend requests" />
                        )}
                        <span className="align-middle text-sm sm:text-xl"> {menu ? '▲' : '▼'}</span>
                    </h2>
                    {menu && (
                        <div className={`absolute top-full right-0 z-[100] mt-3 min-w-40 animate-slide-down overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] ${rainbowBorder}`}>
                            <Link to="/profile"><p className={`${menuLink} ${logoSliceHover.SK}`}>Profile</p></Link>
                            <p className={`${menuLink} ${logoSliceHover.Y}`} onClick={() => openModal('friends')}>
                                Friends
                                {requests.length > 0 && (
                                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{requests.length}</span>
                                )}
                            </p>
                            <p className={`${menuLink} ${logoSliceHover.JO}`} onClick={() => openModal('chat')}>Chat</p>
                            <p className={`${menuLink} border-t border-slate-100 hover:bg-linear-to-r hover:from-red-500 hover:to-rose-600`} onClick={logout}>Logout</p>
                        </div>
                    )}
                </div>
            </header>

            {modalType === 'friends' && (
                <Modal title="Friends" onClose={closeModal}>
                    <Friends />
                </Modal>
            )}

            {modalType === 'chat' && (
                <Modal title="Global chat" onClose={closeModal}>
                    <Chat />
                </Modal>
            )}
        </>
    );
}
