import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Friends } from './Friends';
import { Chat } from './Chat';
import { Modal } from './Modal';

const menuItem = "cursor-pointer select-none px-5 py-3.5 text-left text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 hover:text-blue-500";

export function Header() {
    const [modalType, setModalType] = useState(null);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);

    const { userInfo } = useAuth();

    const closeModal = () => setModalType(null);

    const openModal = (type) => {
        setModalType(type);
        setMenu(false);
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
                    <h1 className="select-none text-5xl font-black tracking-[2px] text-blue-900 sm:text-6xl lg:text-[80px]">SKYJO</h1>
                </Link>
                <div className="relative flex min-w-0 cursor-pointer select-none flex-col items-end" ref={menuRef}>
                    <h2 onClick={toggleMenu} className="max-w-[50vw] truncate text-xl font-bold text-slate-800 transition-colors hover:text-blue-500 sm:text-2xl lg:text-[35px]">
                        {userInfo.name} <span className="align-middle text-sm sm:text-xl"> {menu ? '▲' : '▼'}</span>
                    </h2>
                    {menu && (
                        <div className="absolute top-full right-0 z-[100] mt-3 min-w-40 animate-slide-down overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
                            <Link to="/profile"><p className={menuItem}>Profile</p></Link>
                            <p className={menuItem} onClick={() => openModal('friends')}>Friends</p>
                            <p className={menuItem} onClick={() => openModal('chat')}>Chat</p>
                            <p className={`${menuItem} border-t border-slate-100 hover:!bg-red-50 hover:!text-red-500`}>Logout</p>
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
