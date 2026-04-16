import { Button, Grid } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { ENV } from "../config/env";

const { useBreakpoint } = Grid;

/**
 * GoogleLoginButton Component
 *
 * Implements OAuth 2.0 Authorization Code Flow:
 * 1. User clicks button
 * 2. Redirects to Google OAuth endpoint with state parameter
 * 3. User authorizes app on Google
 * 4. Google redirects back with authorization code
 * 5. AuthCallbackPage captures code and validates state
 * 6. Backend exchanges code for tokens securely using client_secret
 *
 * Google Cloud Configuration Required:
 * - Authorized JavaScript origins and redirect URIs must match
 *   the environment values configured in frontend/.env.
 */
export const GoogleLoginButton = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const GOOGLE_CLIENT_ID = ENV.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = ENV.GOOGLE_REDIRECT_URI;

  const handleGoogleLogin = () => {
    // Save current URL to return after login
    sessionStorage.setItem(
      "returnUrl",
      window.location.pathname + window.location.search,
    );

    // Generate state token to prevent CSRF attacks (OAuth 2.0 security best practice)
    const state =
      Math.random().toString(36).substring(7) + Date.now().toString(36);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      state: state,
      access_type: "offline", // Request refresh token
      prompt: "consent", // Force consent screen
    });

    // Use v2 endpoint (recommended)
    const googleAuthUrl = `${ENV.GOOGLE_AUTH_URL}?${params.toString()}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <Button
      type="primary"
      size={isMobile ? "middle" : "large"}
      icon={<GoogleOutlined />}
      onClick={handleGoogleLogin}
      className="bg-red-500 hover:bg-red-600 border-red-500"
      block={isMobile}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleLoginButton;
