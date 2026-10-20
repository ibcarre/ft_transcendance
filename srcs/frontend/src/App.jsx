import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import { SignIn } from './pages/authentification/SignIn';
import { SignUp } from './pages/authentification/SignUp';
import { Lobby } from './pages/home/Lobby';
import { Profile } from './pages/profile/Profile';
import { GameRoom } from './pages/game/gameRoom';
import './App.css';

export function App() {
  const { isAuth } = useAuth();

  if (isAuth === null) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <div className="app-container">
      <Routes>
        <Route index element={isAuth ? <Navigate replace to="/lobby" /> : <SignIn />} />
        <Route path="signup" element={isAuth ? <Navigate replace to="/lobby" /> : <SignUp />} />
        <Route path="lobby" element={isAuth ? <Lobby /> : <Navigate replace to="/" />} />
        <Route path="profile" element={isAuth ? <Profile /> : <Navigate replace to="/" />} />
        <Route path="game" element={isAuth ? <GameRoom /> : <Navigate replace to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
