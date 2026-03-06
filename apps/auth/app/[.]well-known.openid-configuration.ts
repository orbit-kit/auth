import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/openid-configuration")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const { auth } = await import("@/lib/auth");
				return oauthProviderOpenIdConfigMetadata(auth)(request);
			},
		},
	},
});
