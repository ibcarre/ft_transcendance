import { useState , useEffect , useRef } from 'react';
import { Link } from 'react-router';
import './Header.css'
import './Modal.css'
import { useAuth } from '../context/AuthContext';

export function Header() {
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);

    const { userInfo } = useAuth();

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
                <h1>SKYJO</h1>
                <div className="user-section" ref={menuRef}>
                    <h2 onClick={toggleMenu} className="Username">
                        {userInfo.name} <span className="arrow"> {menu ? '▲' : '▼'}</span>
                    </h2>
                    {menu && (
                        <div className="header-menu">
                            <Link to="/profile"><p>Profile</p></Link>
                            <p>Chat</p>
                            <p className="logout-text">Logout</p>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}