import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Friends } from './Friends';
import { Chat } from './Chat';
import { Modal } from './Modal';
import './Header.css'
import './Modal.css'

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
            <header className="header">
                <Link to="/lobby"><h1>SKYJO</h1></Link>
                <div className="user-section" ref={menuRef}>
                    <h2 onClick={toggleMenu} className="username">
                        {userInfo.name} <span className="arrow"> {menu ? '▲' : '▼'}</span>
                    </h2>
                    {menu && (
                        <div className="header-menu">
                            <Link to="/profile"><p>Profile</p></Link>
                            <p onClick={() => openModal('friends')}>Friends</p>
                            <p onClick={() => openModal('chat')}>Chat</p>
                            <p className="logout-text">Logout</p>
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