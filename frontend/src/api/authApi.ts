import axios from "axios";
import {
  ApiResponse,
  AuthenticationResponse,
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  IntrospectResponse,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshResponse,
  UserInfo,
} from "../types";
import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./apiUtils";
import { ENV } from "../config/env";

const API_BASE_URL = ENV.API_V1_URL;

export const authApi = {
  // Step 1: Exchange authorization code for tokens
  // This implements the Authorization Code Flow (OAuth 2.0)
  // Frontend sends code to backend, backend securely exchanges it with Google
  // using client_secret (never exposed to frontend)
  exchangeToken: async (
    request: ExchangeTokenRequest,
  ): Promise<ExchangeTokenResponse & { message: string }> => {
    try {
      // Call backend endpoint with authorization code
      // Backend will:
      // 1. Validate the code
      // 2. Exchange code with Google token endpoint using client_secret
      // 3. Return access_token and refresh_token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await axios.post<ApiResponse<AuthenticationResponse>>(
        `${API_BASE_URL}/auth/oauth2/authentication?code=${encodeURIComponent(request.code)}`,
        {},
        {
          signal: controller.signal,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      clearTimeout(timeoutId);

      if (response.data.code && response.data.code >= 4000) {
        throw new Error(response.data.message);
      }

      const { accessToken, refreshToken, user } = response.data.result!;
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid tokens received from server");
      }

      const userInfo: UserInfo = {
        id: String(user.id),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        roles: (user as any).roles || [],
        phone: user.phone,
      };

      return {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        user: userInfo,
        message: response.data.message,
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(extractErrorMessage(error));
      }

      throw new Error(errorMessage);
    }
  },

  // Refresh access token using both tokens
  // This is used when access_token expires
  refreshToken: (
    request: RefreshTokenRequest,
  ): Promise<ExchangeTokenResponse> => {
    return axiosClient
      .post<ApiResponse<RefreshResponse>>(`/auth/refresh`, {
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
      })
      .then((response) => {
        if (response.data.code && response.data.code >= 4000) {
          throw new Error(response.data.message);
        }

        const { accessToken } = response.data.result!;

        // We get back only new accessToken. Existing refreshToken and user
        // will be preserved in the store by the caller
        return {
          accessToken,
          refreshToken: request.refreshToken,
          expiresIn: 3600,
          user: {} as any, // Placeholder, usually not used from refresh response
        };
      })
      .catch((error) => {
        const errorMessage = extractErrorMessage(error);
        throw new Error(errorMessage);
      });
  },

  // Introspect token - check if accessToken is still valid
  introspect: async (accessToken: string): Promise<boolean> => {
    try {
      const response = await axiosClient.post<ApiResponse<IntrospectResponse>>(
        "/auth/introspect",
        { accessToken },
      );
      return response.data.result?.valid ?? false;
    } catch (error) {
      console.error("Introspect error:", error);
      return false;
    }
  },

  // Logout - revoke tokens and clear session
  logout: async (request: LogoutRequest): Promise<void> => {
    try {
      await axiosClient.post("/auth/logout", {
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
};

// Real API calls (when backend is ready)
export const authApiReal = {
  exchangeToken: (request: ExchangeTokenRequest) =>
    axios.post<ExchangeTokenResponse>(`${API_BASE_URL}/auth/token`, request, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),

  refreshToken: (request: RefreshTokenRequest) =>
    axiosClient.post<ExchangeTokenResponse>(`/auth/refresh`, request),

  logout: () => axiosClient.post("/auth/logout"),
};
