export interface OrbitAuthConfig {
	baseURL: string;
	clientId: string;
	clientSecret?: string;
	scopes?: string[];
	redirectURI?: string;
	storage?: "session" | "local";
}

export interface OrbitAuthUser {
	id: string;
	email: string;
	name: string;
	image?: string;
	emailVerified: boolean;
}

export interface OrbitAuthSession {
	user: OrbitAuthUser;
	accessToken: string;
	refreshToken?: string;
	expiresAt: number;
}

export interface OrbitAuthTokens {
	accessToken: string;
	refreshToken?: string;
	accessTokenExpiresAt: number;
	scope?: string;
	tokenType?: string;
	idToken?: string;
}

export interface SignInOptions {
	callbackURL?: string;
	errorCallbackURL?: string;
	newUserCallbackURL?: string;
	disableRedirect?: boolean;
	scopes?: string[];
	redirectURI?: string;
}

export interface SignInResult {
	redirectURL?: string;
	success?: boolean;
	error?: {
		code: string;
		message: string;
	};
}

export const ORBIT_AUTH_ERROR_CODES = {
	INVALID_CONFIGURATION: "INVALID_CONFIGURATION",
	TOKEN_URL_NOT_FOUND: "TOKEN_URL_NOT_FOUND",
	AUTHORIZATION_FAILED: "AUTHORIZATION_FAILED",
	TOKEN_EXCHANGE_FAILED: "TOKEN_EXCHANGE_FAILED",
	SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
	INVALID_TOKEN: "INVALID_TOKEN",
	TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
	USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;

export type OrbitAuthErrorCode = typeof ORBIT_AUTH_ERROR_CODES[keyof typeof ORBIT_AUTH_ERROR_CODES];

export class OrbitAuthError extends Error {
	code: OrbitAuthErrorCode;
	constructor(code: OrbitAuthErrorCode, message: string) {
		super(message);
		this.name = "OrbitAuthError";
		this.code = code;
	}
}
