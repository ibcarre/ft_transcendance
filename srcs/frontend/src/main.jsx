import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { FriendsProvider } from './context/FriendsContext';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FriendsProvider>
          <App />
        </FriendsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
