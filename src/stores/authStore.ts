import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticating: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setIsAuthenticating: (value: boolean) => void;
  clearState: () => void;
}

const storage = createJSONStorage(() => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  const memoryStorage: Storage = {
    getItem: (key: string) => {
      void key;
      return null;
    },
    setItem: (key: string, value: string) => {
      void key;
      void value;
    },
    removeItem: (key: string) => {
      void key;
    },
    clear: () => undefined,
    key: (index: number) => {
      void index;
      return null;
    },
    get length() {
      return 0;
    },
  };

  return memoryStorage;
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticating: false,
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      setIsAuthenticating: (value) => set({ isAuthenticating: value }),
      clearState: () => set({ accessToken: null, user: null, isAuthenticating: false }),
    }),
    {
      name: "careergraph-auth",
      storage,
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);
