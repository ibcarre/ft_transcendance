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
  // Cache des noms : { [userId]: name } (le back n'envoie que l'id de l'auteur)
  const [authors, setAuthors] = useState({});
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  // ids dont le nom est déjà demandé, pour ne pas charger deux fois le même profil
  const requestedAuthors = useRef(new Set());
  const nextMessageId = useRef(0);

  const myId = userInfo?.id;
  const myName = userInfo?.name;

  const resolveAuthor = useCallback(async (userId) => {
    if (userId === myId || requestedAuthors.current.has(userId)) return;
    requestedAuthors.current.add(userId);
    const profile = await fetchProfile(userId);
    setAuthors((prev) => ({ ...prev, [userId]: profile.name }));
  }, [myId]);

  useEffect(() => {
    if (!isAuth) return;

    const socket = io('/globalChat', { withCredentials: true });
    socketRef.current = socket;
    const requested = requestedAuthors.current;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => console.log('Chat socket error:', err.message));

    // Message reçu (le mien aussi : le back renvoie à tout le monde, déjà filtré)
    socket.on('messageReceived', (body, userId, date) => {
      const message = { id: nextMessageId.current++, userId, body, sentAt: date };
      setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
      resolveAuthor(userId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      // Déconnexion : on vide le chat pour ne pas le montrer au prochain utilisateur
      setMessages([]);
      setAuthors({});
      requested.clear();
    };
  }, [isAuth, resolveAuthor]);

  // Envoie un message ; il n'est ajouté à la liste qu'au retour du back (évite les doublons)
  const sendMessage = useCallback((text) => {
    const body = text.trim();
    if (!body || !socketRef.current?.connected) return false;
    socketRef.current.emit('newChat', body, myId);
    return true;
  }, [myId]);

  const authorName = useCallback(
    (userId) => (userId === myId ? myName : authors[userId] ?? '...'),
    [authors, myId, myName]);

  return (
    <ChatContext.Provider value={{ messages, connected, sendMessage, authorName }}>
      {children}
    </ChatContext.Provider>
  );
};
