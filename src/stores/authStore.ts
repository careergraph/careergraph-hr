import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, CompanyProfile } from "@/types/account";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  company: CompanyProfile | null;
  isAuthenticating: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  updateUser: (payload: Partial<AuthUser>) => void;
  setCompany: (company: CompanyProfile | null) => void;
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
      company: null,
      isAuthenticating: false,
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) =>
        set({
          user,
          company: user?.company ?? null,
        }),
      updateUser: (payload) =>
        set((state) => {
          if (!state.user) {
            return {
              user: { ...payload },
              company: payload.company ?? null,
            };
          }

          const mergedUser: AuthUser = {
            ...state.user,
            ...payload,
            company: payload.company ?? state.user.company ?? null,
          };

          return {
            user: mergedUser,
            company: mergedUser.company ?? state.company ?? null,
          };
        }),
      setCompany: (company) =>
        set((state) => ({
          company,
          user: state.user
            ? {
                ...state.user,
                companyId: company?.id ?? state.user.companyId,
                company,
              }
            : state.user,
        })),
      setIsAuthenticating: (value) => set({ isAuthenticating: value }),
      clearState: () => set({
        accessToken: null,
        user: null,
        company: null,
        isAuthenticating: false,
      }),
    }),
    {
      name: "careergraph-auth",
      storage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        company: state.company,
      }),
    }
  )
);
