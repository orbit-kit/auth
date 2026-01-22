import type { OrbitAuthConfig, OrbitAuthSession, OrbitAuthUser } from "../core/types";
import { createOrbitAuthClient, OrbitAuthClient } from "../core/client";

export { createOrbitAuthClient, OrbitAuthClient };
export * from "../core/types";

export interface OrbitAuthClientConfig {
	baseURL: string;
	clientId: string;
	clientSecret?: string;
	scopes?: string[];
	redirectURI?: string;
	storage?: "session" | "local";
}

export function getOrbitAuthConfig(config: {
	orbitAuthUrl?: string;
	clientId: string;
	clientSecret?: string;
	scopes?: string[];
	redirectURI?: string;
	storage?: "session" | "local";
}): OrbitAuthConfig {
	if (!config.orbitAuthUrl) {
		throw new Error("orbitAuthUrl is required (Orbit Auth server base URL)");
	}
	return {
		baseURL: config.orbitAuthUrl,
		clientId: config.clientId,
		clientSecret: config.clientSecret,
		scopes: config.scopes,
		redirectURI: config.redirectURI,
		storage: config.storage,
	};
}

export function createOrbitAuthAPI() {
	return {
		getUser: async () => null,
		signOut: async () => false,
	};
}
