import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { getRootLayoutData } from "@/lib/auth-api";
import appCss from "./globals.css?url";

export const Route = createRootRoute({
	loader: async () => getRootLayoutData(),
	head: ({ loaderData }) => {
		const brandName = loaderData?.brandName ?? "Orbit Auth";
		const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:5000";

		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{ title: brandName },
				{
					name: "description",
					content: "Self-hosted Authentication-as-a-Service platform built with TanStack Start and Better Auth.",
				},
				{ property: "og:title", content: brandName },
				{
					property: "og:description",
					content: "Self-hosted Authentication-as-a-Service platform built with TanStack Start and Better Auth.",
				},
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: baseURL },
				{ property: "og:image", content: `${baseURL}/og.png` },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: brandName },
				{
					name: "twitter:description",
					content: "Self-hosted Authentication-as-a-Service platform built with TanStack Start and Better Auth.",
				},
				{ name: "twitter:image", content: `${baseURL}/og.png` },
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "icon", href: "/favicon/favicon.ico", sizes: "any" },
			],
		};
	},
	component: RootLayout,
});

function RootLayout() {
	const { brandName, showLogo } = Route.useLoaderData();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<Providers>
					<div className="relative mt-14 min-h-[calc(100vh-3.5rem)] w-full">
						<Header brandName={brandName} showLogo={showLogo} />
						<div className="pointer-events-none absolute inset-0 z-0 bg-grid-small text-black/2 dark:text-white/4" />
						<div className="relative z-10 mx-auto w-full max-w-4xl p-6">
							<Outlet />
						</div>
					</div>
				</Providers>
				<Scripts />
			</body>
		</html>
	);
}
