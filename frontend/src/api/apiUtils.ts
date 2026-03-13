import { AxiosError } from "axios";

/**
 * Extracts error message from API response
 * Handles both ApiResponse format and generic error responses
 */
export const extractErrorMessage = (error: unknown): string => {
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
