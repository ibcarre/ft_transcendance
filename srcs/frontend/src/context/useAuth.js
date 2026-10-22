import { createContext, useContext } from 'react';

// Contexte et hook dans un fichier à part : AuthContext.jsx n'exporte que le composant
// AuthProvider, sinon le Fast Refresh de Vite ne fonctionne pas
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
