import { useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { authApi } from "../api/authApi";
import { ExchangeTokenRequest } from "../types";

export const useAuth = () => {
  const {
    accessToken,
    user,
    isAuthenticated,
    setTokens,
    setUser,
    logout: logoutStore,
  } = useAuthStore();

  const login = useCallback(
    async (code: string) => {
      try {
        const request: ExchangeTokenRequest = { code };
        const response = await authApi.exchangeToken(request);

        setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);

        return response;
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    [setTokens, setUser],
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const GOOGLE_CLIENT_ID =
        "409023234267-l0ug806esjusfroo43fmmm5bcq24rc65.apps.googleusercontent.com";
      const REDIRECT_URI = `${window.location.origin}/auth/callback`;

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?${new URLSearchParams(
        {
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          response_type: "code",
          scope: "openid email profile",
        },
      ).toString()}`;

      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Failed to initiate Google login:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      logoutStore();
    }
  }, [logoutStore]);

  return {
    accessToken,
    user,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
  };
};
