import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const { auth } = await import("@/lib/auth");
				return oauthProviderAuthServerMetadata(auth)(request);
			},
		},
	},
});
