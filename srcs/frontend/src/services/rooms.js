import axios from 'axios';

// Message renvoyé par le back quand on est déjà dans une room (pending ou playing)
export const ALREADY_IN_ROOM = "You can only be in one room";

// Room où je suis (pending ou playing) : le back renvoie { game_id } ou null
export const fetchMyRoomId = () =>
    axios.get('/api/user/gameRoom', { withCredentials: true }).then((res) => res.data?.game_id ?? null);

// 201 : le corps de la réponse est l'id de la room créée
export const createRoom = ({ name, password, maxPlayers }) =>
    axios.post('/api/rooms/createRoom', { name, password, max_players: maxPlayers }, { withCredentials: true });

// Mot de passe vide pour une room publique (le back ne l'exige plus)
export const joinRoom = (roomId, password) =>
    axios.post(`/api/rooms/joinRoom/${roomId}`, { password }, { withCredentials: true });

// Quitte la room
export const leaveRoom = (roomId) =>
    axios.post(`/api/rooms/leaveRoom/${roomId}`, {}, { withCredentials: true });
