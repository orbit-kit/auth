import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { BackgroundRippleEffect } from "@/components/background-ripple-effect";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { AutoLoginProvider } from "@/components/auto-login-provider";
import { auth } from "@/lib/auth";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
	title: {
		template: "%s | Orbit Auth Example",
		default: "Orbit Auth Example",
	},
	description: "A simple OAuth client connecting to your central authentication server",
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	),
});

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Get session on the server
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const hasLocalSession = !!session?.session;

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon/favicon.ico" sizes="any" />
			</head>
			<body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
				<Providers>
					<AutoLoginProvider hasLocalSession={hasLocalSession}>
						<div className="min-h-[calc(100vh-3.5rem)] mt-14 w-full relative">
							{/* Site Header */}
							<Header />

							{/* Background Ripple Effect */}
							<div className="absolute inset-0 z-0">
								<BackgroundRippleEffect />
							</div>

							{/* Content */}
							<div className="relative z-10 max-w-4xl w-full p-6 mx-auto">
								{children}
							</div>
						</div>
					</AutoLoginProvider>
				</Providers>
			</body>
		</html>
	);
}
