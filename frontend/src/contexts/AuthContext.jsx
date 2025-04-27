import { createContext, useContext, useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const loadingFromStore = useAuthStore((state) => state.loading);

  const [loading, setLoading] = useState(true);

  // ✅ Sync Zustand loading and user state
  useEffect(() => {
    if (!loadingFromStore || !user) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [user, loadingFromStore]);

  const value = {
    user,
    token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
