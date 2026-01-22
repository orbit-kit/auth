import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

function getCorsHeaders(requestHeaders: Headers) {
	const corsHeaders: Record<string, string> = {
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Max-Age": "86400",
	};
	const origin = requestHeaders.get("origin");
	if (origin && isAllowedOrigin(origin)) {
		corsHeaders["Access-Control-Allow-Origin"] = origin;
		corsHeaders["Vary"] = "Origin";
	}
	return corsHeaders;
}

export async function GET() {
    try {
		const requestHeaders = await headers();
        const session = await auth.api.getSession({
            headers: requestHeaders,
        });

        // Return minimal session info for SSO check
        if (session?.user) {
            return NextResponse.json({
                authenticated: true,
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name,
                },
            }, {
                headers: getCorsHeaders(requestHeaders),
            });
        }

        return NextResponse.json({
            authenticated: false,
        }, {
            headers: getCorsHeaders(requestHeaders),
        });
    } catch (error) {
        console.error("[Session Check] Error:", error);
        return NextResponse.json({
            authenticated: false,
            error: "Failed to check session",
        }, {
            status: 500,
            headers: getCorsHeaders(await headers()),
        });
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(await headers()),
    });
}
