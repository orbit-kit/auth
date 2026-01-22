import type { OrbitAuthConfig, OrbitAuthTokens, SignInOptions, SignInResult, OrbitAuthUser, OrbitAuthSession } from "./types";
import { OrbitAuthError, ORBIT_AUTH_ERROR_CODES } from "./types";

const DEFAULT_SCOPES = ["openid", "profile", "email"];
const DEFAULT_OAUTH_PATH_PREFIX = "/api/auth/oauth2";

function base64UrlEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

async function sha256Challenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return base64UrlEncode(hash);
}

function generateRandomString(length: number): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return base64UrlEncode(array.buffer as ArrayBuffer);
}

export class OrbitAuthClient {
	private config: OrbitAuthConfig;
	private baseURL: string;

	constructor(config: OrbitAuthConfig) {
		this.config = config;
		this.baseURL = config.baseURL.replace(/\/$/, "");
	}

	private getStorage(): Storage | null {
		if (typeof window === "undefined") return null;
		const kind = this.config.storage ?? "session";
		return kind === "local" ? window.localStorage : window.sessionStorage;
	}

	private buildEndpoint(pathname: string): string {
		return `${this.baseURL}${pathname}`;
	}

	private resolveRedirectURI(options?: SignInOptions): string {
		if (typeof window === "undefined") {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.INVALID_CONFIGURATION,
				"redirectURI is required in non-browser environments"
			);
		}
		return (
			options?.redirectURI ||
			this.config.redirectURI ||
			`${window.location.origin}/`
		);
	}

	async signIn(options: SignInOptions = {}): Promise<SignInResult> {
		const scopes = options.scopes || this.config.scopes || DEFAULT_SCOPES;
		const callbackURL =
			options.callbackURL ||
			(typeof window !== "undefined"
				? `${window.location.pathname}${window.location.search}${window.location.hash}`
				: "/");
		const state = generateRandomString(32);
		const codeVerifier = generateRandomString(32);
		const codeChallenge = await sha256Challenge(codeVerifier);
		const redirectURI = this.resolveRedirectURI(options);

		const authURL = new URL(this.buildEndpoint(`${DEFAULT_OAUTH_PATH_PREFIX}/authorize`));
		authURL.searchParams.set("client_id", this.config.clientId);
		authURL.searchParams.set("response_type", "code");
		authURL.searchParams.set("redirect_uri", redirectURI);
		authURL.searchParams.set("scope", scopes.join(" "));
		authURL.searchParams.set("state", state);
		authURL.searchParams.set("code_challenge", codeChallenge);
		authURL.searchParams.set("code_challenge_method", "S256");

		if (options.errorCallbackURL) {
			authURL.searchParams.set("error_callback_url", options.errorCallbackURL);
		}
		if (options.newUserCallbackURL) {
			authURL.searchParams.set("new_user_callback_url", options.newUserCallbackURL);
		}

		const storage = this.getStorage();
		storage?.setItem("orbit_auth_state", state);
		storage?.setItem("orbit_auth_code_verifier", codeVerifier);
		storage?.setItem("orbit_auth_callback_url", callbackURL);
		storage?.setItem("orbit_auth_redirect_uri", redirectURI);

		if (options.disableRedirect || typeof window === "undefined") {
			return { redirectURL: authURL.toString(), success: true };
		}

		window.location.href = authURL.toString();
		return { success: true };
	}

	async handleCallback(): Promise<OrbitAuthSession | null> {
		if (typeof window === "undefined") return null;

		const url = new URL(window.location.href);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		const error = url.searchParams.get("error");
		const errorDescription = url.searchParams.get("error_description");

		if (error) {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.AUTHORIZATION_FAILED,
				errorDescription || error
			);
		}

		if (!code || !state) {
			return null;
		}

		const storage = this.getStorage();
		const savedState = storage?.getItem("orbit_auth_state") || null;
		if (state !== savedState) {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.AUTHORIZATION_FAILED,
				"State mismatch - possible CSRF attack"
			);
		}

		const codeVerifier = storage?.getItem("orbit_auth_code_verifier") || null;
		const callbackURL = storage?.getItem("orbit_auth_callback_url") || "/";
		const redirectURI = storage?.getItem("orbit_auth_redirect_uri") || this.resolveRedirectURI();

		storage?.removeItem("orbit_auth_state");
		storage?.removeItem("orbit_auth_code_verifier");
		storage?.removeItem("orbit_auth_callback_url");
		storage?.removeItem("orbit_auth_redirect_uri");

		if (!codeVerifier) {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.AUTHORIZATION_FAILED,
				"Code verifier not found"
			);
		}

		const tokens = await this.exchangeCodeForTokens(code, codeVerifier, redirectURI);
		const session = await this.getSession(tokens.accessToken, tokens.accessTokenExpiresAt, tokens.refreshToken);
		await this.storeSession(tokens.accessToken, tokens.refreshToken, tokens.accessTokenExpiresAt);

		window.history.replaceState({}, "", callbackURL);
		return session;
	}

	private parseTokenResponse(data: unknown): OrbitAuthTokens {
		if (!data || typeof data !== "object") {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
				"Invalid token response"
			);
		}
		const record = data as Record<string, unknown>;
		const accessToken = record.access_token;
		const expiresIn = record.expires_in;
		if (typeof accessToken !== "string" || !accessToken.length) {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
				"Token response missing access_token"
			);
		}
		if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn)) {
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
				"Token response missing expires_in"
			);
		}
		return {
			accessToken,
			refreshToken: typeof record.refresh_token === "string" ? record.refresh_token : undefined,
			accessTokenExpiresAt: Date.now() + expiresIn * 1000,
			scope: typeof record.scope === "string" ? record.scope : undefined,
			tokenType: typeof record.token_type === "string" ? record.token_type : undefined,
			idToken: typeof record.id_token === "string" ? record.id_token : undefined,
		};
	}

	private async exchangeCodeForTokens(code: string, codeVerifier: string, redirectURI: string): Promise<OrbitAuthTokens> {
		const body = new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectURI,
			client_id: this.config.clientId,
			code_verifier: codeVerifier,
		});
		if (this.config.clientSecret) {
			body.set("client_secret", this.config.clientSecret);
		}

		const response = await fetch(this.buildEndpoint(`${DEFAULT_OAUTH_PATH_PREFIX}/token`), {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.TOKEN_EXCHANGE_FAILED,
				errorData.error_description || errorData.error || "Failed to exchange authorization code"
			);
		}

		const data: unknown = await response.json();
		return this.parseTokenResponse(data);
	}

	async refreshAccessToken(refreshToken: string): Promise<OrbitAuthTokens> {
		const body = new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: this.config.clientId,
		});
		if (this.config.clientSecret) {
			body.set("client_secret", this.config.clientSecret);
		}

		const response = await fetch(this.buildEndpoint(`${DEFAULT_OAUTH_PATH_PREFIX}/token`), {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		if (!response.ok) {
			const errorData: unknown = await response.json().catch(() => undefined);
			const record = errorData && typeof errorData === "object" ? (errorData as Record<string, unknown>) : {};
			const message =
				(typeof record.error_description === "string" && record.error_description) ||
				(typeof record.error === "string" && record.error) ||
				"Failed to refresh access token";
			throw new OrbitAuthError(ORBIT_AUTH_ERROR_CODES.TOKEN_REFRESH_FAILED, message);
		}

		const data: unknown = await response.json();
		const parsed = this.parseTokenResponse(data);
		return {
			...parsed,
			refreshToken: parsed.refreshToken ?? refreshToken,
		};
	}

	private parseUserInfo(data: unknown): OrbitAuthUser {
		if (!data || typeof data !== "object") {
			throw new OrbitAuthError(ORBIT_AUTH_ERROR_CODES.USER_NOT_FOUND, "Invalid userinfo response");
		}
		const record = data as Record<string, unknown>;
		const sub = record.sub;
		const email = record.email;
		const name = record.name;
		if (typeof sub !== "string" || !sub.length) {
			throw new OrbitAuthError(ORBIT_AUTH_ERROR_CODES.USER_NOT_FOUND, "userinfo missing sub");
		}
		if (typeof email !== "string" || !email.length) {
			throw new OrbitAuthError(ORBIT_AUTH_ERROR_CODES.USER_NOT_FOUND, "userinfo missing email");
		}
		if (typeof name !== "string" || !name.length) {
			throw new OrbitAuthError(ORBIT_AUTH_ERROR_CODES.USER_NOT_FOUND, "userinfo missing name");
		}
		return {
			id: sub,
			email,
			name,
			image: typeof record.picture === "string" ? record.picture : undefined,
			emailVerified: typeof record.email_verified === "boolean" ? record.email_verified : false,
		};
	}

	async getSession(accessToken: string, expiresAt?: number, refreshToken?: string): Promise<OrbitAuthSession> {
		const response = await fetch(this.buildEndpoint(`${DEFAULT_OAUTH_PATH_PREFIX}/userinfo`), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			let message = "Failed to get session";
			try {
				const data = await response.json();
				if (data?.error_description && typeof data.error_description === "string") {
					message = data.error_description;
				} else if (data?.error && typeof data.error === "string") {
					message = data.error;
				}
			} catch {
				try {
					const text = await response.text();
					if (text) message = text;
				} catch {
				}
			}
			throw new OrbitAuthError(
				ORBIT_AUTH_ERROR_CODES.SESSION_NOT_FOUND,
				message
			);
		}

		const userInfo: unknown = await response.json();
		const user = this.parseUserInfo(userInfo);

		return {
			user,
			accessToken,
			refreshToken,
			expiresAt: expiresAt ?? Date.now() + 3600000,
		};
	}

	private async storeSession(accessToken: string, refreshToken?: string, expiresAt?: number): Promise<void> {
		const storage = this.getStorage();
		if (!storage) return;

		storage.setItem("orbit_access_token", accessToken);
		storage.setItem("orbit_access_token_expires", String(expiresAt || Date.now() + 3600000));
		if (refreshToken) storage.setItem("orbit_refresh_token", refreshToken);
	}

	async getStoredSession(): Promise<OrbitAuthSession | null> {
		const storage = this.getStorage();
		if (!storage) return null;

		const accessToken = storage.getItem("orbit_access_token");
		const refreshToken = storage.getItem("orbit_refresh_token");
		const expiresAtStr = storage.getItem("orbit_access_token_expires");

		if (!accessToken) {
			return null;
		}

		const expiresAt = expiresAtStr ? Number.parseInt(expiresAtStr, 10) : Date.now() + 3600000;

		if (Date.now() > expiresAt) {
			if (refreshToken) {
				try {
					const tokens = await this.refreshAccessToken(refreshToken);
					const session = await this.getSession(tokens.accessToken, tokens.accessTokenExpiresAt, tokens.refreshToken);
					await this.storeSession(tokens.accessToken, tokens.refreshToken, tokens.accessTokenExpiresAt);
					return session;
				} catch {
					this.clearSession();
					return null;
				}
			}
			this.clearSession();
			return null;
		}

		try {
			return await this.getSession(accessToken, expiresAt, refreshToken || undefined);
		} catch {
			return null;
		}
	}

	clearSession(): void {
		const storage = this.getStorage();
		if (!storage) return;
		storage.removeItem("orbit_access_token");
		storage.removeItem("orbit_refresh_token");
		storage.removeItem("orbit_access_token_expires");
	}

	async signOut(): Promise<void> {
		const storage = this.getStorage();
		const accessToken = storage?.getItem("orbit_access_token");
		if (accessToken) {
			try {
				const body = new URLSearchParams({
					token: accessToken,
					client_id: this.config.clientId,
				});
				if (this.config.clientSecret) {
					body.set("client_secret", this.config.clientSecret);
				}

				await fetch(this.buildEndpoint(`${DEFAULT_OAUTH_PATH_PREFIX}/revoke`), {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body,
				});
			} catch {
				// Ignore revoke errors
			}
		}
		this.clearSession();
	}
}

export function createOrbitAuthClient(config: OrbitAuthConfig): OrbitAuthClient {
	return new OrbitAuthClient(config);
}
