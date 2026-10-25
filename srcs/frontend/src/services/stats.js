import axios from 'axios';
import { withRetry } from './user';

// Réessaie si le back redémarre pendant le chargement (5xx / réseau)
const get = (url) => withRetry(() => axios.get(url, { withCredentials: true })).then((res) => res.data);

// Parties : [{ id, name, status, created_at, winner: true/false }] (winner = ce joueur a gagné)
const toGames = (games) => (Array.isArray(games) ? games : []);

// Victoires / défaites calculées depuis l'historique (même règle que le back dans getProfile)
const countResults = (games) => ({
    wins: games.filter((g) => g.winner === true).length,
    losses: games.filter((g) => g.status === 'finished' && g.winner !== true).length,
});

// Mon profil : mon historique via /gameStats/gamesList
export const fetchMyStats = async () => {
    const games = toGames(await get('/api/gameStats/gamesList'));
    return { ...countResults(games), games };
};

// Username -> id : { id }, ou 404 si le joueur n'existe pas
export const fetchUserIdByName = (name) =>
    get(`/api/friends/getId/${encodeURIComponent(name)}`).then((data) => data?.id ?? null);

// Profil d'un autre joueur : { name, avatar_url, status, friend, nb_wins, nb_losses, games }
// (ne pas appeler avec son propre id : le back répond par une redirection vers /profile)
export const fetchUserProfile = async (id) => {
    const p = await get(`/api/friends/profile/${id}`);
    const games = toGames(p?.games);
    return {
        name: p.name,
        avatar_url: p.avatar_url,
        status: p.status,
        friend: p.friend === true,
        ...countResults(games),
        games,
    };
};

// Résultat d'une partie pour le joueur du profil
export const gameResult = (game) => {
    if (game.winner === true) return 'win';
    if (game.status === 'finished') return 'loss';
    if (game.status === 'cancelled') return 'cancelled';
    return 'ongoing';   // pending ou playing
};
