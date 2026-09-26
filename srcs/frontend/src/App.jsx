import axios from 'axios';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { SignIn } from './pages/authentification/SignIn';
import { SignUp } from './pages/authentification/SignUp';
import { Lobby } from './pages/home/Lobby';
import './App.css';

export function App() {
  const [isAuth, setIsAuth] = useState(null);
  const navigate = useNavigate(); // Permet de forcer la redirection

  useEffect(() => {
    // 1. La vérification initiale au démarrage de l'application
    const verifyUser = async () => {
      try {
        const response = await axios.get('https://localhost:44443/api/user/profile', {
          withCredentials: true
        });
        if (response.status === 200) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch {
        setIsAuth(false);
      }
    };

    verifyUser();

    // 2. L'intercepteur global pour surveiller l'expiration du token
    const interceptor = axios.interceptors.response.use(
      (response) => {
        // Si la requête réussit, on laisse passer la réponse normalement
        return response;
      },
      (error) => {
        // Si la requête échoue avec un statut 401 (Non autorisé / Token expiré)
        if (error.response && error.response.status === 401) {
          setIsAuth(false); // On met à jour l'état de connexion
          navigate('/'); // On redirige vers SignIn
        }
        // On retourne l'erreur pour que les blocs "catch" des autres composants puissent s'exécuter
        return Promise.reject(error);
      }
    );

    // 3. Nettoyage : On retire l'intercepteur si le composant est démonté 
    // pour éviter d'empiler des intercepteurs à l'infini
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  if (isAuth === null) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <div className="app-container">
      <Routes>
        <Route index element={isAuth ? <Navigate replace to="/lobby" /> : <SignIn />} />
        <Route path="signup" element={isAuth ? <Navigate replace to="/lobby" /> : <SignUp />} />
        <Route path="lobby" element={isAuth ? <Lobby /> : <Navigate replace to="/" />} />
      </Routes>
    </div>
  );
}

export default App
