import { Routes, Route } from 'react-router';
import { SignIn } from './pages/authentification/SignIn';
import { SignUp } from './pages/authentification/SignUp';
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route index element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
      </Routes>
    </div>
  )
}

export default App
