import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { createMetadata } from "@/lib/metadata";
import { getSystemSetting } from "@/lib/setup";

export async function generateMetadata(): Promise<Metadata> {
	const brandName = await getSystemSetting("brand_name", "Orbit Auth");
	const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:5000";
	return createMetadata({
		title: {
			template: `%s | ${brandName}`,
			default: brandName,
		},
		description: "Self-hosted Authentication-as-a-Service platform built with Next.js and Better Auth.",
		metadataBase: new URL(baseURL),
		openGraph: {
			siteName: brandName,
		},
	});
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon/favicon.ico" sizes="any" />
			</head>
			<body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
				<Providers>
					<div className="min-h-[calc(100vh-3.5rem)] mt-14 w-full relative">
						{/* Site Header */}
						<Header />

						{/* Background Grid */}
						<div className="absolute inset-0 z-0 bg-grid-small text-black/2 dark:text-white/4 pointer-events-none" />

						{/* Content */}
						<div className="relative z-10 max-w-4xl w-full p-6 mx-auto">
							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
