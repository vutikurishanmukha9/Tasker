import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/types";
import { apiFetch, onAuthenticationFailed } from "@/lib/api";

type Store = {
  currentUser: User | null;
  isLoadingAuth: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  setCurrentUser: (user: User) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const clearProtectedState = useCallback(() => {
    setCurrentUser(null);
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return ["all_tasks", "dashboard", "projects", "tasks", "users"].includes(String(key));
      },
    });
  }, [queryClient]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch<User>("/auth/profile/");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        clearProtectedState();
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchProfile();
  }, [clearProtectedState]);

  useEffect(() => {
    return onAuthenticationFailed(() => {
      clearProtectedState();
      navigate("/login", { replace: true });
    });
  }, [clearProtectedState, navigate]);

  const value: Store = {
    currentUser,
    isLoadingAuth,
    login: (user) => {
      setCurrentUser(user);
    },
    logout: async () => {
      try {
        await apiFetch("/auth/logout/", {
          method: "POST",
          skipAuth: true,
          retryOnAuthFailure: false,
        });
      } finally {
        clearProtectedState();
        navigate("/login", { replace: true });
      }
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
