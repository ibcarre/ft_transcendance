import { avatarUrl } from '../services/user';
import defaultPic from '../assets/cartes_home.png';

// Avatar servi par le back ; si l'image ne charge pas, on affiche l'image locale
export function Avatar({ file, className = '', alt = 'Profile' }) {
    return (
        <img
            src={avatarUrl(file)}
            alt={alt}
            className={`rounded-full border-[3px] border-blue-500 bg-white object-cover ${className}`}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultPic;
            }}
        />
    );
}
