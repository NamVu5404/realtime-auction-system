import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = "http://localhost:8080/api/v1";

// Create axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailed: (error: AxiosError) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.onFailed(error);
    } else if (token) {
      prom.onSuccess(token);
    }
  });

  failedQueue = [];
};

// Request interceptor
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore.getState();
    const token = authStore.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((onSuccess, onFailed) => {
          failedQueue.push({ onSuccess, onFailed });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const authStore = useAuthStore.getState();
        const refreshToken = authStore.refreshToken;

        if (!refreshToken) {
          if (authStore.accessToken) {
            authStore.logout(authStore.accessToken);
          }
          return Promise.reject(error);
        }

        // Call refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        authStore.setTokens(newAccessToken, newRefreshToken);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return axiosClient(originalRequest);
      } catch (err) {
        const authStore = useAuthStore.getState();
        if (authStore.accessToken) {
          authStore.logout(authStore.accessToken);
        }
        processQueue(error as AxiosError, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Return the error with full response data intact
    // This allows API callers to access error.response.data.message
    return Promise.reject(error);
  },
);

export default axiosClient;
