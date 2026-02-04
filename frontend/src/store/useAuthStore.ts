import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState } from "../types";

interface AuthStoreState extends AuthState {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthState["user"]) => void;
  logout: (accessToken: string) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken: string, refreshToken: string) =>
        set({
          accessToken,
          refreshToken,
        }),

      setUser: (user: AuthState["user"]) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      logout: (accessToken: AuthState["accessToken"]) =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-store", // localStorage key
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
