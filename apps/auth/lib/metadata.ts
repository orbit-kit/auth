import type { Metadata } from "next/types";

export function createMetadata(override: Metadata): Metadata {
	const base =
		override.metadataBase ||
		(process.env.BETTER_AUTH_URL
			? new URL(process.env.BETTER_AUTH_URL)
			: new URL("http://localhost:5000"));
	const ogImage =
		override.openGraph?.images ??
		(new URL("/og.png", base).toString());
	return {
		...override,
		openGraph: {
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			url: override.openGraph?.url ?? base.toString(),
			images: ogImage,
			siteName:
				override.openGraph?.siteName ??
				(typeof override.title === "string" ? override.title : undefined),
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			images: override.twitter?.images ?? ogImage,
			...override.twitter,
		},
	};
}

export const baseUrl =
	process.env.NODE_ENV === "development"
		? new URL("http://localhost:3000")
		: new URL(`https://${process.env.VERCEL_URL!}`);
