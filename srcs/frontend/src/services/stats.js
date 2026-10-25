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
		wins: Number(wins?.count ?? 0),
		losses: Number(losses?.count ?? 0),
		games: Array.isArray(games) ? games : [],
	};
};

export const gameResult = (game) => {
    if (game.status === 'finished') {
        return game.winner ? 'win' : 'loss';
    }
    if (game.status === 'cancelled') {
        return 'cancelled';
    }
    return 'ongoing';
};
