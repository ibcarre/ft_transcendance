import { createContext, useContext } from 'react';

// Contexte et hook à part de ChatContext.jsx (même raison que useAuth.js : Fast Refresh)
export const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat doit être utilisé à l\'intérieur d\'un ChatProvider');
  }
  return context;
};
