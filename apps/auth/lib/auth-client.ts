import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { toast } from "sonner";

// Auth server URL - use relative URLs when on the same origin (auth server itself)
// This is the auth1 server's client, so it should use relative URLs since it's
// making requests to itself
const getBaseURL = () => {
	// On server-side, use the full URL
	if (typeof window === "undefined") {
		return process.env.BETTER_AUTH_URL || "http://localhost:5000";
	}
	// On client-side, use relative URLs since this client runs on the auth server itself
	return undefined;
};

// Endpoints that should have manual redirect handling
// These are sign-in/sign-up endpoints that return 302 but we handle redirect manually in JS
const AUTH_ENDPOINTS = [
	"/sign-in/email",
	"/sign-up/email",
];

// Check if a URL matches auth endpoints that need manual redirect handling
const isAuthEndpoint = (url: string): boolean => {
	return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

// Custom fetch implementation that handles network errors and redirects properly
// This is needed because Better Auth's fetch doesn't properly catch network failures
// and redirect responses can cause issues with JSON parsing
// See: https://github.com/better-auth/better-auth/issues/1575
const customFetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = async (
	input,
	init,
) => {
	try {
		const url = typeof input === "string" ? input : input.toString();
		const method = init?.method?.toUpperCase() ?? "GET";

		// Only use manual redirect for auth endpoints (sign-in/sign-up)
		// Other endpoints follow redirects normally
		const needsManualRedirect = method === "POST" && isAuthEndpoint(url);

		const response = await fetch(input, {
			...init,
			redirect: needsManualRedirect ? "manual" : "follow",
		});

		// Handle redirects for auth endpoints (sign-in/sign-up) - convert to success
		if (needsManualRedirect && (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400))) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		return response;
	} catch (error) {
		// Convert network errors to Response.error() so Better Auth can handle them
		console.error("[Auth Client] Network error:", error);
		return Response.error();
	}
};

// Create auth client for the auth server (auth1)
export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	plugins: [
		adminClient(),
		oauthProviderClient(),
	],
	fetchOptions: {
		// Include credentials to ensure cookies are sent with requests
		credentials: "include",
		// Custom fetch to handle network errors and redirects
		customFetchImpl,
		// Retry on network failures
		retry: {
			type: "exponential",
			attempts: 3,
			baseDelay: 1000,
			maxDelay: 5000,
		},
		onError(e) {
			if (e.error.status === 429) {
				toast.error("Too many requests. Please try again later.");
			}
		},
	},
});
