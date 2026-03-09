import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message, Result, notification } from "antd";
import { useAuth } from "../hooks/useAuth";
import LoadingPage from "../components/common/LoadingPage";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Step 1: Validate state token to prevent CSRF attacks
        const storedState = sessionStorage.getItem("oauth_state");
        if (!state || state !== storedState) {
          const errorMsg = "Invalid state parameter - possible CSRF attack";
          setError(errorMsg);
          sessionStorage.removeItem("oauth_state");
          console.error("State mismatch - potential CSRF attack");
          setIsLoading(false);
          notification.error({
            message: "Security Error",
            description: errorMsg,
            duration: 3,
          });
          sessionStorage.removeItem("returnUrl");
          setTimeout(() => navigate("/"), 3000);
          return;
        }
        sessionStorage.removeItem("oauth_state");

        // Step 2: Handle Google OAuth errors (user denied, etc.)
        if (errorParam) {
          const errorMsg = errorDescription || errorParam;
          setError(errorMsg);
          console.error("OAuth error:", errorMsg);
          setIsLoading(false);
          notification.error({
            message: "Google Login Failed",
            description: errorMsg || "An error occurred during authentication",
            duration: 3,
          });
          sessionStorage.removeItem("returnUrl");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Step 3: Verify authorization code was received
        if (!code) {
          const errorMsg = "No authorization code received from Google";
          setError(errorMsg);
          setIsLoading(false);
          notification.error({
            message: "Authentication Error",
            description: errorMsg,
            duration: 3,
          });
          sessionStorage.removeItem("returnUrl");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Step 4: Exchange authorization code for tokens via backend
        // Keep loading state true while waiting for response
        setIsLoading(true);
        setError(null); // Reset error before attempt

        await login(code);

        // Only show success and redirect if login completed successfully
        message.success("Login successful!");
        setIsLoading(false);

        // Get return URL from sessionStorage, default to home
        const returnUrl = sessionStorage.getItem("returnUrl") || "/";
        sessionStorage.removeItem("returnUrl");

        // Redirect to previous page or home after short delay
        setTimeout(() => navigate(returnUrl), 1000);
      } catch (err) {
        // Only handle error here - after response received or timeout
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        console.error("Auth callback error:", err);
        setError(errorMessage);
        setIsLoading(false);

        // Display backend error message using notification
        notification.error({
          message: "Authentication Failed",
          description:
            errorMessage || "An error occurred during login. Please try again.",
          duration: 3,
        });

        // Clean up return URL on error
        sessionStorage.removeItem("returnUrl");

        // Auto redirect on error after 3 seconds
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  if (error && !isLoading) {
    return (
      <Result
        status="error"
        title="Authentication Failed"
        subTitle={error}
        extra={
          <div className="text-center">
            <p className="text-gray-400">Redirecting to home...</p>
          </div>
        }
      />
    );
  }

  return (
    <LoadingPage
      tip="Authenticating..."
      message="Securing your connection to AuctionPro"
    />
  );
};

export default AuthCallbackPage;
