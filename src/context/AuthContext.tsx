import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DEFAULT_OWNER_ID } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  effectiveUid: string;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  effectiveUid: DEFAULT_OWNER_ID
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      effectiveUid: user?.uid || DEFAULT_OWNER_ID 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
