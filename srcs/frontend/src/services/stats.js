import axios from 'axios';
import { withRetry } from './user';

// Réessaie si le back redémarre pendant le chargement (5xx / réseau)
const get = (url) => withRetry(() => axios.get(url, { withCredentials: true })).then((res) => res.data);

// /gameStats/wins et /losses renvoient [{ nb_wins }] / [{ nb_losses }] ;
// /gameStats/gamesList renvoie [{ name, status, winner, created_at }] pour chaque partie jouée
export const fetchStats = async () => {
    const [wins, losses, games] = await Promise.all([
        get('/api/gameStats/wins'),
        get('/api/gameStats/losses'),
        get('/api/gameStats/gamesList'),
    ]);
    return {
        wins: wins?.[0]?.nb_wins ?? 0,
        losses: losses?.[0]?.nb_losses ?? 0,
        games: Array.isArray(games) ? games : [],
    };
};

// Résultat d'une partie pour l'utilisateur
export const gameResult = (game, myId) => {
    if (game.winner === myId) return 'win';
    if (game.status === 'finished') return 'loss';
    if (game.status === 'cancelled') return 'cancelled';
    return 'ongoing';   // pending ou playing
};
