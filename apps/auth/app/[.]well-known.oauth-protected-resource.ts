import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
	server: {
		handlers: {
			GET: async () => {
				const { serverClient } = await import("@/lib/server-client");
				const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
				const config = await serverClient.getProtectedResourceMetadata({
					resource: `${baseURL}/api/auth`,
					authorization_servers: [`${baseURL}/api/auth`],
				});
				const headers = new Headers();
				if (process.env.NODE_ENV === "development") {
					headers.set("Access-Control-Allow-Methods", "GET");
					headers.set("Access-Control-Allow-Origin", "*");
					headers.set(
						"Cache-Control",
						"public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
					);
				}
				return Response.json(config, { headers });
			},
		},
	},
});
