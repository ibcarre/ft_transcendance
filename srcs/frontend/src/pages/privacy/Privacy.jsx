import { Link } from 'react-router';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { panel } from '../../styles/ui';

const block = `${panel} w-full max-w-[600px] p-6 shadow-none sm:p-10 md:min-w-0 md:flex-1`;
const blockTitle = "mb-5 border-b-2 border-white pb-3 text-2xl font-bold text-blue-900 sm:text-[28px]";
const list = "flex list-disc flex-col gap-3 pl-5 marker:text-blue-500";
const item = "text-base leading-normal text-slate-800";

export function Privacy() {
    const { isAuth } = useAuth();

    return (
        <div className="flex min-h-screen flex-col">

            {isAuth ? (
                <Header />
            ) : (
                <header className="flex w-full items-center px-4 py-2.5 sm:px-8 lg:px-[60px]">
                    <Link to="/">
                        <h1 className="select-none text-5xl font-black tracking-[2px] text-blue-900 sm:text-6xl lg:text-[80px]">SKYJO</h1>
                    </Link>
                </header>
            )}

            <div className="my-auto box-border flex w-full flex-col items-center justify-center gap-6 px-4 py-6 sm:gap-10 sm:px-8 sm:py-10 md:flex-row md:items-stretch lg:px-[60px]">

                <div className={block}>
                    <h2 className={blockTitle}>Privacy Policy</h2>
                    <ul className={list}>
                        <li className={item}>We only collect what is needed to play: your username, email address, password and avatar.</li>
                        <li className={item}>Your password is never stored in plain text, it is hashed before being saved.</li>
                        <li className={item}>Your game history and stats are used only to display your profile and win rate.</li>
                        <li className={item}>Chat messages are only visible to other players and are not shared outside the site.</li>
                        <li className={item}>We never sell or share your data with third parties.</li>
                        <li className={item}>You can edit your information at any time from your profile page.</li>
                    </ul>
                </div>

                <div className={block}>
                    <h2 className={blockTitle}>Terms & Conditions</h2>
                    <ul className={list}>
                        <li className={item}>You are responsible for keeping your account credentials safe.</li>
                        <li className={item}>Be respectful: insults, harassment and spam in the chat are not allowed.</li>
                        <li className={item}>Cheating or exploiting bugs to win a game is forbidden.</li>
                        <li className={item}>Usernames and avatars must not be offensive.</li>
                        <li className={item}>Any account breaking these rules may be suspended or deleted.</li>
                        <li className={item}>This project is a school project (42) and is provided as is, without any guarantee.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
}
