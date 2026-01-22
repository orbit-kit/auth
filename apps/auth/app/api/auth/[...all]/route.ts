import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFeatureFlagWithDefault } from "@/lib/setup";

// Add CORS headers for development to allow cross-origin requests
function getAllowedOrigins(): string[] {
	const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";
	const additional = (process.env.TRUSTED_ORIGINS || "")
		.split(",")
		.map((o) => o.trim())
		.filter(Boolean);
	return [baseUrl, ...additional];
}

function isAllowedOrigin(origin: string): boolean {
	try {
		const url = new URL(origin);
		if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
		if (url.hostname.endsWith(".localhost")) return true;
	} catch {
		return false;
	}
	return getAllowedOrigins().includes(origin);
}

function addCorsHeaders(headers: Headers, req: NextRequest) {
	if (process.env.NODE_ENV === "development") {
		headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		headers.set("Access-Control-Allow-Headers", "authorization, content-type, cookie");
		const origin = req.headers.get("origin");
		if (origin && isAllowedOrigin(origin)) {
			headers.set("Access-Control-Allow-Origin", origin);
			headers.set("Access-Control-Allow-Credentials", "true");
			headers.set("Vary", "Origin");
		}
	}
}

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
	if (req.nextUrl.pathname.endsWith("/callback/google")) {
		const enabled = await getFeatureFlagWithDefault("oauth_google", false);
		const configured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
		if (!enabled) {
			return NextResponse.json(
				{ error: "Google sign-in is disabled" },
				{ status: 403 },
			);
		}
		if (!configured) {
			return NextResponse.json(
				{ error: "Google sign-in is not configured" },
				{ status: 503 },
			);
		}
	}
	const res = await handler.GET(req);
	try {
		if (process.env.NODE_ENV === "development" && req.nextUrl.pathname.endsWith("/oauth2/userinfo") && res.status >= 400) {
			const text = await res.clone().text();
			if (text) console.error("OAuth userinfo error:", res.status, text);
		}
	} catch {
	}
	addCorsHeaders(res.headers, req);
	return res;
}

async function getBodyProvider(req: NextRequest): Promise<string | undefined> {
	const contentType = req.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		const json = (await req.clone().json().catch(() => undefined)) as unknown;
		if (!json || typeof json !== "object") return undefined;
		const record = json as Record<string, unknown>;
		return typeof record.provider === "string" ? record.provider : undefined;
	}
	if (contentType.includes("application/x-www-form-urlencoded")) {
		const text = await req.clone().text().catch(() => "");
		const params = new URLSearchParams(text);
		return params.get("provider") ?? undefined;
	}
	return undefined;
}

export async function POST(req: NextRequest) {
	if (req.nextUrl.pathname.endsWith("/sign-in/social") || req.nextUrl.pathname.endsWith("/link-social")) {
		const provider = await getBodyProvider(req);
		if (provider === "google") {
			const enabled = await getFeatureFlagWithDefault("oauth_google", false);
			const configured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
			if (!enabled) {
				return NextResponse.json(
					{ error: "Google sign-in is disabled" },
					{ status: 403 },
				);
			}
			if (!configured) {
				return NextResponse.json(
					{ error: "Google sign-in is not configured" },
					{ status: 503 },
				);
			}
		}
	}
	const res = await handler.POST(req);
	addCorsHeaders(res.headers, req);
	return res;
}

export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
	const headers = new Headers();
	addCorsHeaders(headers, req);
	return new NextResponse(null, {
		status: 204,
		headers,
	});
}
