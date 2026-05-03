import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/lib/types";
import { apiFetch, setTokens, getTokens } from "@/lib/api";

type Store = {
  currentUser: User | null;
  isLoadingAuth: boolean;
  login: (tokens: { access: string; refresh: string }, user: User) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const tokens = getTokens();
      if (!tokens) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await apiFetch<User>("/auth/profile/");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setTokens(null);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchProfile();
  }, []);

  const value: Store = {
    currentUser,
    isLoadingAuth,
    login: (tokens, user) => {
      setTokens(tokens);
      setCurrentUser(user);
    },
    logout: () => {
      setTokens(null);
      setCurrentUser(null);
      window.location.href = "/login";
    },
    setCurrentUser,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
