import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { ChatContext } from './useChat';
import { fetchProfile } from '../services/friends';

// Nombre de messages gardés en mémoire (le back ne stocke pas d'historique)
const MAX_MESSAGES = 200;

// Chat global partagé par toute l'app (modal du header et colonne de la page game),
// alimenté par le namespace socket /globalChat tant que l'utilisateur est connecté
export const ChatProvider = ({ children }) => {
  const { isAuth, userInfo } = useAuth();
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const nextMessageId = useRef(0);

  const myId = userInfo?.id;

  useEffect(() => {
    if (!isAuth) return;

    let active = true;
    const socket = io('/globalChat', { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => console.log('Chat socket error:', err.message));

    // Message reçu (le mien aussi : le back renvoie à tout le monde, déjà filtré)
    socket.on('messageReceived', async (body, userId, date) => {
      const id = nextMessageId.current++;
      setMessages((prev) => [...prev, { id, userId, body, sentAt: date, author: null }].slice(-MAX_MESSAGES));

      // Pas de cache : le nom est demandé à chaque message, pour suivre les changements de pseudo
      // (mes propres messages n'affichent pas d'auteur)
      if (userId === myId) return;
      const profile = await fetchProfile(userId);
      if (!active) return;
      setMessages((prev) => prev.map((m) => (m.id === id
        ? { ...m, author: { name: profile.name, avatar: profile.avatar_url } }
        : m)));
    });

    return () => {
      active = false;
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      // Déconnexion : on vide le chat pour ne pas le montrer au prochain utilisateur
      setMessages([]);
    };
  }, [isAuth, myId]);

  // Envoie un message ; il n'est ajouté à la liste qu'au retour du back (évite les doublons)
  const sendMessage = useCallback((text) => {
    const body = text.trim();
    if (!body || !socketRef.current?.connected) return false;
    socketRef.current.emit('newChat', body, myId);
    return true;
  }, [myId]);

  return (
    <ChatContext.Provider value={{ messages, connected, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
