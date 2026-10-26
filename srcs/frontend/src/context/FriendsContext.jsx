import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { FriendsContext } from './useFriends';
import { fetchFriendsData, fetchProfile, sortFriends } from '../services/friends';

// Liste d'amis + invitations reçues, partagée par toute l'app et tenue à jour en temps réel
// par le namespace socket /Friends (connecté tant que l'utilisateur est authentifié)
export const FriendsProvider = ({ children }) => {
  const { isAuth } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyData = useCallback(({ friends, invites }) => {
    setFriends(friends);
    setRequests(invites);
    setError(null);
    setLoading(false);
  }, []);

  const applyError = useCallback((err) => {
    setError(err.response?.data?.message || "Failed to load your friends");
    setLoading(false);
  }, []);

  const reload = useCallback(
    () => fetchFriendsData().then(applyData, applyError),
    [applyData, applyError]);

  useEffect(() => {
    if (!isAuth) return;

    let active = true;
    fetchFriendsData().then(
      (data) => { if (active) applyData(data); },
      (err) => { if (active) applyError(err); });

    const socket = io('/Friends', { withCredentials: true });
    let firstConnect = true;

    // Les événements reçus pendant une déconnexion sont perdus : on recharge à chaque reconnexion
    socket.on('connect', () => {
      if (firstConnect) firstConnect = false;
      else reload();
    });

    // Quelqu'un m'invite (id de la personne qui invite)
    socket.on('sendInvite', async (id) => {
      const profile = await fetchProfile(id);
      if (!active) return;
      setRequests((prev) => (prev.some((r) => r.id === id) ? prev : [...prev, profile]));
    });

    // Une invitation a été acceptée, par moi ou par l'autre (id de l'autre personne)
    socket.on('newfriend', async (id) => {
      const profile = await fetchProfile(id);
      if (!active) return;
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setFriends((prev) => (prev.some((f) => f.id === id) ? prev : sortFriends([...prev, profile])));
    });

    // Un ami a été retiré, par moi ou par l'autre (id de l'autre personne)
    socket.on('removeFriend', (id) => {
      setFriends((prev) => prev.filter((f) => f.id !== id));
    });

    // Invitation annulée ou refusée : le back n'envoie pas le bon id, on recharge les listes
    socket.on('removeInvite', () => reload());

    socket.on('connect_error', (err) => console.log('Friends socket error:', err.message));

    return () => {
      active = false;
      socket.disconnect();
      // Déconnexion : on vide les listes pour ne pas les montrer au prochain utilisateur
      setFriends([]);
      setRequests([]);
      setLoading(true);
    };
  }, [isAuth, applyData, applyError, reload]);

  return (
    <FriendsContext.Provider value={{ friends, requests, loading, error, reload }}>
      {children}
    </FriendsContext.Provider>
  );
};
