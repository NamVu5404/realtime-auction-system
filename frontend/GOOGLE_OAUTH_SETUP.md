## Google OAuth 2.0 Setup Guide

### Authorization Code Flow Implementation

This app implements the **OAuth 2.0 Authorization Code Flow** for secure Google login:

```
┌─────────────┐                                   ┌──────────────┐
│   Frontend  │                                   │   Google     │
│  (Client)   │                                   │  OAuth       │
└─────────────┘                                   └──────────────┘
       │                                                  │
       │ 1. Click "Sign in with Google"                 │
       │ Redirect to https://accounts.google.com/...    │
       ├─────────────────────────────────────────────►  │
       │                                                  │
       │                                   2. User login & authorize
       │                                                  │
       │ 3. Redirect to callback with code + state     │
       │ ◄─────────────────────────────────────────────┤
       │                                                  │
       │ 4. Verify state, send code to backend          │
       └─────────────────────────────────────────────►  Backend
                                                        (Secure)
                                                         │
                                              5. Exchange code for tokens
                                              using client_secret
                                                         │
       │ 6. Return access_token & refresh_token        │
       │ ◄─────────────────────────────────────────────┤
       │
       │ 7. Decode JWT & store tokens
       │ 8. Redirect to home
```

### Security Features

1. **State Parameter (CSRF Protection)**
   - Generated before redirecting to Google
   - Validated when Google redirects back
   - Prevents CSRF attacks

2. **Authorization Code Flow**
   - Never expose tokens to redirect URLs
   - Backend handles token exchange securely
   - Client secret never exposed to frontend

3. **Secure Token Storage**
   - Access tokens stored in auth store (in-memory)
   - Refresh tokens stored securely (httpOnly cookies recommended in production)

### Google Cloud Console Configuration

#### 1. Create OAuth 2.0 Credentials

Go to [Google Cloud Console](https://console.cloud.google.com/):
- Project → Create/Select Project
- APIs & Services → Credentials
- Create OAuth 2.0 Client ID (Application type: Web application)

#### 2. Authorized JavaScript Origins

These are the origins where your frontend is running:

**Development:**
```
http://localhost:5173
http://localhost:3000
```

**Production:**
```
https://yourdomain.com
https://www.yourdomain.com
```

**⚠️ IMPORTANT:** These must match `window.location.origin` exactly!

#### 3. Authorized Redirect URIs

These are where Google will redirect after user authorization:

**Development:**
```
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
```

**Production:**
```
https://yourdomain.com/auth/callback
https://www.yourdomain.com/auth/callback
```

**⚠️ IMPORTANT:** These must match `VITE_GOOGLE_REDIRECT_URI` in `.env.local`!

### Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8080/api/v1

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Frontend Flow

1. **GoogleLoginButton.tsx**
   - User clicks "Sign in with Google"
   - Generates state token and saves to sessionStorage
   - Redirects to Google OAuth endpoint with:
     - `client_id`
     - `redirect_uri`
     - `response_type=code`
     - `scope=openid email profile`
     - `state` (CSRF protection)
     - `access_type=offline` (request refresh token)
     - `prompt=consent` (force consent screen)

2. **AuthCallbackPage.tsx**
   - Google redirects back with `code` and `state` parameters
   - Validates state token (CSRF protection)
   - Calls `login(code)` hook
   - Displays loading spinner while exchanging code

3. **useAuth.ts**
   - `login(code)` calls `authApi.exchangeToken(code)`
   - Stores tokens in auth store
   - Decodes JWT to extract user info
   - Redirects to home on success

### Backend Implementation

Backend must implement `/auth/outbound?code=xxx` endpoint that:

1. Receives authorization `code` from frontend
2. Exchanges code with Google token endpoint using:
   - `client_id`
   - `client_secret` (NEVER expose to frontend)
   - `code`
   - `redirect_uri`
   - `grant_type=authorization_code`
3. Returns `ApiResponse<AuthenticationResponse>`:
   ```json
   {
     "code": 1000,
     "message": "Success",
     "result": {
       "accessToken": "eyJhbGc...",
       "refreshToken": "refresh_token_here"
     }
   }
   ```

### Token Decoding (Frontend)

Frontend decodes JWT payload to extract user info:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "profile_pic_url",
  "role": "USER",
  ...
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `redirect_uri_mismatch` | Ensure callback URI matches exactly in Google Console and `.env.local` |
| `invalid_client` | Check Client ID is correct |
| `access_denied` | User clicked "Deny" button |
| `state mismatch` | Browser cleared sessionStorage or timeout |

### Testing Locally

1. Update `.env.local` with your credentials
2. Add `http://localhost:5173/auth/callback` to Google Console
3. Run `npm run dev`
4. Visit `http://localhost:5173`
5. Click "Sign in with Google"
6. Check AuthCallbackPage in console for state validation

### Production Deployment

1. Update `.env.local` with production credentials
2. Add `https://yourdomain.com/auth/callback` to Google Console
3. Update environment variables in production deployment
4. Use HTTPS only (required by Google)
5. Consider storing refresh tokens in httpOnly cookies

### References

- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-1.3.1)
- [Google Identity Platform](https://developers.google.com/identity/protocols/oauth2)
- [OpenID Connect](https://openid.net/connect/)
