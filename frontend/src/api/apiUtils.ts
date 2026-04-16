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

      // Handle Validation Errors: Pick the first field error
      if (data.errors && typeof data.errors === "object") {
        const errorValues = Object.values(data.errors);
        if (errorValues.length > 0) {
          return String(errorValues[0]);
        }
      }

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
