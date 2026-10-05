import { useState } from 'react';
import './Header.css'
import './Modal.css'

export function Header() {
    const [menu, setMenu] = useState(false);

    const toggleMenu = () => {
        setMenu(!menu)
    };
    return (
        <>
            <header className="header">
                <h1>SKYJO</h1>
                <h2 onClick={toggleMenu}>Username</h2>
                <div className={menu ? "header-menu" : "offscreen"}>
                    <p>Profile</p>
                    <p>Logout</p>
                </div>
            </header>
        </>
    );
}