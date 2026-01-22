import { betterAuth, type BetterAuthOptions } from "better-auth";
import { admin, jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { openAPI } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { db, schema } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { DBFieldAttribute } from "better-auth/db";
import { orbitHaveIBeenPwned } from "./plugins/hibp";

// Create base drizzle adapter factory
const baseAdapterFactory = drizzleAdapter(db, {
	provider: "pg",
	schema: {
		user: schema.user,
		session: schema.session,
		account: schema.account,
		verification: schema.verification,
		// OAuth Provider tables
		oauthClient: schema.oauthClient,
		oauthRefreshToken: schema.oauthRefreshToken,
		oauthAccessToken: schema.oauthAccessToken,
		oauthConsent: schema.oauthConsent,
		// JWT plugin table
		jwks: schema.jwks,
	},
});

// Parse trusted origins from environment variable
// Supports comma-separated URLs: "http://localhost:3000,https://app.example.com"
function getTrustedOrigins(): string[] {
	const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";
	const additionalOrigins = process.env.TRUSTED_ORIGINS?.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean) || [];

	// Always include the base URL and any additional origins from env
	return [baseUrl, ...additionalOrigins];
}

const authOptions = {
	appName: "Orbit Auth",
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
	database: baseAdapterFactory,
	socialProviders:
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
						accessType: "offline",
						prompt: "select_account consent",
					},
				}
			: {},
	user: {
		additionalFields: {
			role: {
				type: ["user", "admin"],
				required: true,
			} satisfies DBFieldAttribute,
			banned: {
				type: "boolean",
				required: false,
			} satisfies DBFieldAttribute,
			banReason: {
				type: "string",
				required: false,
			} satisfies DBFieldAttribute,
			banExpires: {
				type: "date",
				required: false,
			} satisfies DBFieldAttribute,
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	// Required for OAuth Provider plugin - sessions must be stored in database
	session: {
		storeSessionInDatabase: true,
	},
	// Disable the default /token endpoint to avoid conflict with OAuth provider
	disabledPaths: [
		"/token",
	],
	plugins: [
		openAPI(),
		nextCookies(),
		admin(),
		orbitHaveIBeenPwned(),
		// JWT plugin is required for OAuth provider
		jwt(),
		// OAuth 2.1 Provider plugin
		oauthProvider({
			// Redirect to sign-in page when user is not authenticated
			loginPage: "/sign-in",
			// Redirect to consent page when user needs to authorize the client
			consentPage: "/oauth/consent",
			// Supported scopes - these are the global scopes the server supports
			scopes: ["openid", "profile", "email", "offline_access"],
			// Default scopes to assign to newly registered clients if not requested
			// This ensures dynamically registered clients have proper scopes
			clientRegistrationDefaultScopes: ["openid", "profile", "email", "offline_access"],
			// Allow dynamic client registration for MCP and other clients
			allowDynamicClientRegistration: true,
			// Allow unauthenticated client registration for public clients (MCP agents)
			allowUnauthenticatedClientRegistration: true,
		}),
	],
	// Trusted origins are configured via TRUSTED_ORIGINS environment variable
	// This makes the auth server work with any number of OAuth clients
	trustedOrigins: getTrustedOrigins(),
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);

export type Session = typeof auth.$Infer.Session;
