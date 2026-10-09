import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
// import { io } from "socket.io-client";
import './index.css'
import App from './App.jsx'

// export const socket = io("https://localhost:44443", {
//   withCredentials: true
// });
// console.log("Tentative de connexion Socket.IO lancée !");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
