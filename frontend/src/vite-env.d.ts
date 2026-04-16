/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_V1_URL: string;
	readonly VITE_API_V2_URL: string;
	readonly VITE_WS_URL: string;
	readonly VITE_IMAGE_BASE_URL: string;
	readonly VITE_GOOGLE_CLIENT_ID: string;
	readonly VITE_GOOGLE_REDIRECT_URI: string;
	readonly VITE_GOOGLE_AUTH_URL: string;
	readonly VITE_REPO_URL: string;
	readonly VITE_PUBLIC_SITE_URL: string;
	readonly VITE_SELLER_TERMS_URL: string;
	readonly VITE_CONTACT_PHONE_URL: string;
	readonly VITE_CONTACT_EMAIL_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
