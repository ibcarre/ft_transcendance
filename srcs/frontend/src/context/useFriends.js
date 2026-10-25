import { createContext, useContext } from 'react';

// Contexte et hook à part de FriendsContext.jsx (même raison que useAuth.js : Fast Refresh)
export const FriendsContext = createContext(null);

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends doit être utilisé à l\'intérieur d\'un FriendsProvider');
  }
  return context;
};
