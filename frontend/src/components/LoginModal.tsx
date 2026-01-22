import { Modal, Button, Space } from "antd";
import { GoogleOutlined } from "@ant-design/icons";

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

/**
 * LoginModal Component
 * 
 * Prompts unauthenticated users to login before performing protected actions
 * (e.g., placing a bid). Provides direct access to Google OAuth login flow.
 */
export const LoginModal = ({ visible, onClose, onLoginClick }: LoginModalProps) => {
  const GOOGLE_CLIENT_ID =
    "409023234267-l0ug806esjusfroo43fmmm5bcq24rc65.apps.googleusercontent.com";
  const REDIRECT_URI = `${window.location.origin}/auth/callback`;

  const handleGoogleLogin = () => {
    // Save current URL to return after login
    sessionStorage.setItem("returnUrl", window.location.pathname + window.location.search);
    
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
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    // Call the callback if provided
    onLoginClick();
    
    // Redirect to Google OAuth
    window.location.href = googleAuthUrl;
  };

  return (
    <Modal
      title="Login Required"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="login"
          type="primary"
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          className="bg-red-500 hover:bg-red-600 border-red-500"
        >
          Sign in with Google
        </Button>,
      ]}
    >
      <p className="mb-4">
        To participate in this auction, you need to be logged in.
      </p>
      <p>
        Click the <strong>"Sign in with Google"</strong> button below to sign in securely.
      </p>
    </Modal>
  );
};

export default LoginModal;
