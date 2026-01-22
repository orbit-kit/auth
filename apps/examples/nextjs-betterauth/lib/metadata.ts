import type { Metadata } from "next/types";

export function createMetadata(override: Metadata): Metadata {
	return {
		...override,
		openGraph: {
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			url:
				process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
			images:
				process.env.NEXT_PUBLIC_APP_URL ||
					"http://localhost:3000/og.png",
			siteName: "Orbit Auth Example",
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			images:
				process.env.NEXT_PUBLIC_APP_URL ||
					"http://localhost:3000/og.png",
			...override.twitter,
		},
	};
}
