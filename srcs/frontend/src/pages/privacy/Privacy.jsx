import { Link } from 'react-router';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import '../../components/Header.css';
import './Privacy.css';

export function Privacy() {
    const { isAuth } = useAuth();

    return (
        <div className="privacy-container">

            {isAuth ? (
                <Header />
            ) : (
                <header className="header">
                    <Link to="/"><h1>SKYJO</h1></Link>
                </header>
            )}

            <div className="privacy-wrapper">

                <div className="privacy-block">
                    <h2>Privacy Policy</h2>
                    <ul>
                        <li>We only collect what is needed to play: your username, email address, password and avatar.</li>
                        <li>Your password is never stored in plain text, it is hashed before being saved.</li>
                        <li>Your game history and stats are used only to display your profile and win rate.</li>
                        <li>Chat messages are only visible to other players and are not shared outside the site.</li>
                        <li>We never sell or share your data with third parties.</li>
                        <li>You can edit your information at any time from your profile page.</li>
                    </ul>
                </div>

                <div className="privacy-block">
                    <h2>Terms & Conditions</h2>
                    <ul>
                        <li>You are responsible for keeping your account credentials safe.</li>
                        <li>Be respectful: insults, harassment and spam in the chat are not allowed.</li>
                        <li>Cheating or exploiting bugs to win a game is forbidden.</li>
                        <li>Usernames and avatars must not be offensive.</li>
                        <li>Any account breaking these rules may be suspended or deleted.</li>
                        <li>This project is a school project (42) and is provided as is, without any guarantee.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
}
