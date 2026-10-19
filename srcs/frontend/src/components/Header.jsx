import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Friends } from './Friends';
import { Modal } from './Modal';
import './Header.css'
import './Modal.css'

export function Header() {
    const [friendsModal, setFriendsModal] = useState(false);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);

    const { userInfo } = useAuth();

    const closeModal = () => setFriendsModal(false);

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
                    <h2 onClick={toggleMenu} className="Username">
                        {userInfo.name} <span className="arrow"> {menu ? '▲' : '▼'}</span>
                    </h2>
                    {menu && (
                        <div className="header-menu">
                            <Link to="/profile"><p>Profile</p></Link>
                            <p onClick={() => { setFriendsModal(true); setMenu(false); }}>Friends</p>
                            <p>Chat</p>
                            <p className="logout-text">Logout</p>
                        </div>
                    )}
                </div>
            </header>

            {friendsModal && (
                <Modal title="Friends" onClose={closeModal}>
                    <Friends />
                </Modal>
            )}
        </>
    );
}