import axios from 'axios';

// Taille max acceptée par le back pour un avatar
export const MAX_AVATAR_SIZE = 2_000_000;

// avatar_url = nom du fichier dans backend/upload, servi par /user/image/:image
// (l'ancien format "/imgs/default_pic.jpg" est toléré : on ne garde que le nom du fichier)
export const avatarUrl = (file) =>
    `/api/user/image/${encodeURIComponent((file || 'default_pic.jpg').split('/').pop())}`;

// Le back attend le fichier dans le champ "image" (multipart)
export const uploadAvatar = (file) => {
    const form = new FormData();
    form.append('image', file);
    return axios.put('/api/user/edit_profile/picture', form, { withCredentials: true });
};

// Profil de l'utilisateur connecté (pour récupérer le nouveau avatar_url après un upload)
export const fetchMe = () =>
    axios.get('/api/user/profile', { withCredentials: true }).then((res) => res.data);

// Message d'erreur du back : { message } en JSON, ou parfois du texte brut
export const errorMessage = (err, fallback = "Failed to reach the server") => {
    const data = err.response?.data;
    if (data?.message) return data.message;
    if (typeof data === 'string' && data) return data;
    return fallback;
};
