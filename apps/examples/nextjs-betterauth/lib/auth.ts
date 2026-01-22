import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";

const dialect = new LibsqlDialect({
	url: process.env.TURSO_DATABASE_URL || "",
	authToken: process.env.TURSO_AUTH_TOKEN || "",
});

const authOptions = {
	appName: "OAuth Client",
	database: {
		dialect,
		type: "sqlite",
	},
	plugins: [
		nextCookies(),
		genericOAuth({
			config: [
				{
					providerId: "central-oauth",
					clientId: process.env.OAUTH_CLIENT_ID || "",
					clientSecret: process.env.OAUTH_CLIENT_SECRET || "",
					discoveryUrl: process.env.OAUTH_DISCOVERY_URL || "",
					scopes: ["openid", "profile", "email"],
					// Enable PKCE (required by OAuth 2.1 providers)
					pkce: true,
				},
			],
		}),
	],
	trustedOrigins: [
		// Auth server on port 5000
		"http://localhost:5000",
		// This client app on port 3000
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	].filter(Boolean),
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);

export type Session = typeof auth.$Infer.Session;
