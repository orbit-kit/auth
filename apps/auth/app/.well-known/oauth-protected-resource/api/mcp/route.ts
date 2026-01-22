import { NextResponse } from "next/server";
import { serverClient } from "@/lib/server-client";

export async function GET(): Promise<NextResponse> {
	const baseURL = process.env.BETTER_AUTH_URL || "https://demo.better-auth.com";
	const config = await serverClient.getProtectedResourceMetadata({
		resource: `${baseURL}/api/mcp`,
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
	return NextResponse.json(config, {
		headers,
	});
}
