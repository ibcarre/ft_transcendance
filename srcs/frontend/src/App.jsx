import { Routes, Route } from 'react-router';
import { SignIn } from './pages/authentification/SignIn';
import { SignUp } from './pages/authentification/SignUp';
import { Lobby } from './pages/home/Lobby';
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route index element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="lobby" element={<Lobby />} />
      </Routes>
    </div>
  )
}

export default App
