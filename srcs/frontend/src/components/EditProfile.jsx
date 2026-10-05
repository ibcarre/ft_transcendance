import defaultPic from '../../imgs/default_pic.jpg';
import { Header } from './Header';

export function EditProfile() {
    return (
        <>
            <Header />

            <img src={defaultPic} />

            <p>New Username</p>
            <input />
            <button>validate</button>

            <p>New email address</p>
            <input />
            <button>validate</button>

            <p>New  password</p>
            <input />

            <p>Confirm new password</p>
            <input />
            <button>validate</button>
        </>
    );
}