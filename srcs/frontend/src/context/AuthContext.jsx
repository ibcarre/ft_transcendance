import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { AuthContext } from './useAuth';

// Si le back est injoignable (redémarrage, 502...), on réessaie avant de conclure
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let retryTimer = null;

    // 1. Vérification initiale au démarrage
    const verifyUser = async (attempt = 0) => {
      try {
        const response = await axios.get('/api/user/profile', {
          withCredentials: true
        });
        if (!active) return;
        setIsAuth(true);
        setUserInfo(response.data);
      } catch (err) {
        if (!active) return;
        // Seul un 401 veut dire "pas connecté" : on déconnecte
        if (err.response?.status === 401) {
          setIsAuth(false);
          setUserInfo(null);
          return;
        }
        // Autre erreur (back qui redémarre, 502, réseau...) : on ne déconnecte pas, on réessaie
        if (attempt < MAX_RETRIES) {
          retryTimer = setTimeout(() => verifyUser(attempt + 1), RETRY_DELAY_MS);
          return;
        }
        // Toujours rien après plusieurs essais : si on ne savait pas encore, on considère "pas connecté"
        setIsAuth((prev) => prev ?? false);
      }
    };

    verifyUser();

    // 2. Intercepteur global Axios
    const interceptor = axios.interceptors.response.use(
      (response) => {
        if (response.status === 401) {
          setIsAuth(false);
          setUserInfo(null);
          navigate('/');
          return Promise.reject(response);
        }
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          setIsAuth(false);
          setUserInfo(null);
          navigate('/');
        }
        return Promise.reject(error);
      }
    );

    // 3. Nettoyage de l'intercepteur et des essais en attente
    return () => {
      active = false;
      clearTimeout(retryTimer);
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth, userInfo, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
