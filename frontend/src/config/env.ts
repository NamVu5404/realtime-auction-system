const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, "");

export const ENV = {
  API_V1_URL: trimTrailingSlash(import.meta.env.VITE_API_V1_URL),
  API_V2_URL: trimTrailingSlash(import.meta.env.VITE_API_V2_URL),
  WS_URL: trimTrailingSlash(import.meta.env.VITE_WS_URL),
  IMAGE_BASE_URL: trimTrailingSlash(import.meta.env.VITE_IMAGE_BASE_URL),
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  GOOGLE_AUTH_URL: import.meta.env.VITE_GOOGLE_AUTH_URL,
  REPO_URL: import.meta.env.VITE_REPO_URL,
  PUBLIC_SITE_URL: trimTrailingSlash(import.meta.env.VITE_PUBLIC_SITE_URL),
  SELLER_TERMS_URL: import.meta.env.VITE_SELLER_TERMS_URL,
  CONTACT_PHONE_URL: import.meta.env.VITE_CONTACT_PHONE_URL,
  CONTACT_EMAIL_URL: import.meta.env.VITE_CONTACT_EMAIL_URL,
};

export const buildPublicSiteUrl = (path: string): string =>
  `${ENV.PUBLIC_SITE_URL}/${trimLeadingSlash(path)}`;
