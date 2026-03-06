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

function getCorsHeaders(requestHeaders: Headers) {
	const corsHeaders: Record<string, string> = {
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Max-Age": "86400",
	};

	const origin = requestHeaders.get("origin");
	if (origin && isAllowedOrigin(origin)) {
		corsHeaders["Access-Control-Allow-Origin"] = origin;
		corsHeaders.Vary = "Origin";
	}

	return corsHeaders;
}

export const Route = createFileRoute("/api/auth/session-check")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const { auth } = await import("@/lib/auth");
					const session = await auth.api.getSession({
						headers: request.headers,
					});

					if (session?.user) {
						return Response.json(
							{
								authenticated: true,
								user: {
									id: session.user.id,
									email: session.user.email,
									name: session.user.name,
								},
							},
							{
								headers: getCorsHeaders(request.headers),
							},
						);
					}

					return Response.json(
						{ authenticated: false },
						{
							headers: getCorsHeaders(request.headers),
						},
					);
				} catch (error) {
					console.error("[Session Check] Error:", error);
					return Response.json(
						{
							authenticated: false,
							error: "Failed to check session",
						},
						{
							status: 500,
							headers: getCorsHeaders(request.headers),
						},
					);
				}
			},
			OPTIONS: async ({ request }) =>
				new Response(null, {
					status: 204,
					headers: getCorsHeaders(request.headers),
				}),
		},
	},
});
