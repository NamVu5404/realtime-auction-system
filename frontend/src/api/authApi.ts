import axios, { AxiosError } from "axios";
import {
  ApiResponse,
  AuthenticationResponse,
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  LogoutRequest,
  RefreshTokenRequest,
  UserInfo,
} from "../types";
import axiosClient from "./axiosClient";

const API_BASE_URL = "http://localhost:8080/api/v1";

/**
 * Extracts error message from API response
 * Handles both ApiResponse format and generic error responses
 */
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Try to get message from ApiResponse format (backend standard)
    if (error.response?.data && typeof error.response.data === "object") {
      const data = error.response.data as any;
      if (data.message) {
        return data.message;
      }
    }
  }

  // Fallback to generic error message
  if (error instanceof Error) {
    return error.message;
  }

  return "An error occurred. Please try again.";
};

export const authApi = {
  // Step 1: Exchange authorization code for tokens
  // This implements the Authorization Code Flow (OAuth 2.0)
  // Frontend sends code to backend, backend securely exchanges it with Google
  // using client_secret (never exposed to frontend)
  exchangeToken: async (
    request: ExchangeTokenRequest,
  ): Promise<ExchangeTokenResponse> => {
    try {
      // Call backend endpoint with authorization code
      // Backend will:
      // 1. Validate the code
      // 2. Exchange code with Google token endpoint using client_secret
      // 3. Return access_token and refresh_token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await axios.post<ApiResponse<AuthenticationResponse>>(
        `${API_BASE_URL}/auth/outbound/authentication?code=${encodeURIComponent(request.code)}`,
        {},
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (response.data.code !== 1000) {
        throw new Error(response.data.message || "Authentication failed");
      }

      const { accessToken, refreshToken, user } = response.data.result;
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid tokens received from server");
      }

      const userInfo: UserInfo = {
        id: String(user.id),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      };

      return {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        user: userInfo,
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout - server took too long to respond");
      }

      throw new Error(errorMessage);
    }
  },

  // Refresh access token using refresh token
  // This is used when access_token expires
  refreshToken: (
    request: RefreshTokenRequest,
  ): Promise<ExchangeTokenResponse> => {
    return axiosClient
      .post<ApiResponse<AuthenticationResponse>>(`/auth/refresh`, {
        token: request.token,
      })
      .then((response) => {
        if (response.data.code !== 1000) {
          throw new Error(response.data.message || "Token refresh failed");
        }

        const { accessToken, refreshToken, user } = response.data.result;
        const userInfo: UserInfo = {
          id: String(user.id),
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
        };

        return {
          accessToken,
          refreshToken,
          expiresIn: 3600,
          user: userInfo,
        };
      })
      .catch((error) => {
        const errorMessage = extractErrorMessage(error);
        throw new Error(errorMessage);
      });
  },

  // Logout - revoke tokens and clear session
  logout: async (request: LogoutRequest): Promise<void> => {
    try {
      await axiosClient.post("/auth/logout", {
        token: request.token,
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
