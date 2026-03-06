import { createFileRoute } from "@tanstack/react-router";

function getAllowedOrigins(): string[] {
	const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";
	const additional = (process.env.TRUSTED_ORIGINS || "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	return [baseUrl, ...additional];
}

function isAllowedOrigin(origin: string): boolean {
	try {
		const url = new URL(origin);
		if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
			return true;
		}
		if (url.hostname.endsWith(".localhost")) {
			return true;
		}
	} catch {
		return false;
	}

	return getAllowedOrigins().includes(origin);
}

function addCorsHeaders(headers: Headers, request: Request) {
	if (process.env.NODE_ENV !== "development") {
		return;
	}

	headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	headers.set("Access-Control-Allow-Headers", "authorization, content-type, cookie");

	const origin = request.headers.get("origin");
	if (origin && isAllowedOrigin(origin)) {
		headers.set("Access-Control-Allow-Origin", origin);
		headers.set("Access-Control-Allow-Credentials", "true");
		headers.set("Vary", "Origin");
	}
}

async function getBodyProvider(request: Request): Promise<string | undefined> {
	const contentType = request.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		const json = (await request.clone().json().catch(() => undefined)) as unknown;
		if (!json || typeof json !== "object") {
			return undefined;
		}

		const record = json as Record<string, unknown>;
		return typeof record.provider === "string" ? record.provider : undefined;
	}

	if (contentType.includes("application/x-www-form-urlencoded")) {
		const text = await request.clone().text().catch(() => "");
		const params = new URLSearchParams(text);
		return params.get("provider") ?? undefined;
	}

	return undefined;
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);

				if (url.pathname.endsWith("/callback/google")) {
					const { getFeatureFlagWithDefault } = await import("@/lib/setup");
					const enabled = await getFeatureFlagWithDefault("oauth_google", false);
					const configured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
					if (!enabled) {
						return Response.json(
							{ error: "Google sign-in is disabled" },
							{ status: 403 },
						);
					}
					if (!configured) {
						return Response.json(
							{ error: "Google sign-in is not configured" },
							{ status: 503 },
						);
					}
				}

				const { auth } = await import("@/lib/auth");
				const response = await auth.handler(request);
				addCorsHeaders(response.headers, request);
				return response;
			},
			POST: async ({ request }) => {
				const url = new URL(request.url);
				if (url.pathname.endsWith("/sign-in/social") || url.pathname.endsWith("/link-social")) {
					const provider = await getBodyProvider(request);
					if (provider === "google") {
						const { getFeatureFlagWithDefault } = await import("@/lib/setup");
						const enabled = await getFeatureFlagWithDefault("oauth_google", false);
						const configured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
						if (!enabled) {
							return Response.json(
								{ error: "Google sign-in is disabled" },
								{ status: 403 },
							);
						}
						if (!configured) {
							return Response.json(
								{ error: "Google sign-in is not configured" },
								{ status: 503 },
							);
						}
					}
				}

				const { auth } = await import("@/lib/auth");
				const response = await auth.handler(request);
				addCorsHeaders(response.headers, request);
				return response;
			},
			OPTIONS: async ({ request }) => {
				const headers = new Headers();
				addCorsHeaders(headers, request);
				return new Response(null, {
					status: 204,
					headers,
				});
			},
		},
	},
});
