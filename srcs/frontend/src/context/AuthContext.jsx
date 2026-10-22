import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Vérification initiale au démarrage
    const verifyUser = async () => {
      try {
        const response = await axios.get('/api/user/profile', {
          withCredentials: true
        });
        if (response.status === 200) {
          setIsAuth(true);
          setUserInfo(response.data);
        } else {
          setIsAuth(false);
          setUserInfo(null);
        }
      } catch {
        setIsAuth(false);
        setUserInfo(null);
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

    // 3. Nettoyage de l'intercepteur
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth, userInfo, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
