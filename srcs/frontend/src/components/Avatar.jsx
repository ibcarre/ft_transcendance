import { avatarUrl } from '../services/user';
// Même image que l'avatar par défaut du back (srcs/backend/upload/default_pic.jpg)
import defaultPic from '../assets/default_avatar.jpg';

// Pas d'avatar perso (vide ou default_pic.jpg) : image locale, sans requête au back
const isDefault = (file) => !file || file.split('/').pop() === 'default_pic.jpg';

// Avatar servi par le back ; si l'image ne charge pas, on affiche l'image locale
export function Avatar({ file, className = '', alt = 'Profile' }) {
    return (
        <img
            src={isDefault(file) ? defaultPic : avatarUrl(file)}
            alt={alt}
            className={`rounded-full bg-white object-cover ${className}`}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultPic;
            }}
        />
    );
}
