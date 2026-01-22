"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { oauthClient } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";

const DEFAULT_OAUTH_SCOPES = ["openid", "profile", "email", "offline_access"] as const;

export type OAuthClientCreateInput = {
    name: string;
    redirectUris: string[];
    isConfidential: boolean;
};

export type OAuthClientResult = {
    success: boolean;
    data?: {
        clientId: string;
        clientSecret?: string;
        name: string;
        redirectUris: string[];
        isPublic: boolean;
    };
    error?: string;
};

function generateId(): string {
    return crypto.randomBytes(16).toString("hex");
}

function generateClientId(): string {
    return crypto.randomBytes(32).toString("hex");
}

function generateClientSecret(): string {
    return crypto.randomBytes(64).toString("hex");
}

// Hash function matching the OAuth provider's default storage format
async function hashSecret(value: string): Promise<string> {
    const hash = crypto.createHash("sha256").update(value).digest();
    return hash.toString("base64url");
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	return "Unknown error";
}

export async function createOAuthClient(
    input: OAuthClientCreateInput
): Promise<OAuthClientResult> {
    try {
        const headersList = await headers();

        // Get the current session to get the user ID
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user) {
            return {
                success: false,
                error: "Not authenticated",
            };
        }

        // Generate client credentials
        const clientId = generateClientId();
        const rawClientSecret = input.isConfidential ? generateClientSecret() : null;
        const hashedClientSecret = rawClientSecret ? await hashSecret(rawClientSecret) : null;

        // Insert directly into the database
        // The jsonText custom column type handles serialization automatically
        // skipConsent: true - All clients are first-party, no consent screen needed
        await db.insert(oauthClient).values({
            id: generateId(),
            clientId: clientId,
            clientSecret: hashedClientSecret,
            name: input.name,
            redirectUris: input.redirectUris,
            scopes: [...DEFAULT_OAUTH_SCOPES],
            tokenEndpointAuthMethod: input.isConfidential ? "client_secret_basic" : "none",
            grantTypes: ["authorization_code", "refresh_token"],
            responseTypes: ["code"],
            type: input.isConfidential ? "web" : "native",
            public: !input.isConfidential,
            userId: session.user.id,
            skipConsent: true, // Skip consent for first-party clients
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return {
            success: true,
            data: {
                clientId: clientId,
                clientSecret: rawClientSecret || undefined, // Return the RAW secret (not hashed)
                name: input.name,
                redirectUris: input.redirectUris,
                isPublic: !input.isConfidential,
            },
        };
    } catch (error: unknown) {
        console.error("Failed to create OAuth client:", error);
        return {
            success: false,
            error: toErrorMessage(error) || "Failed to create OAuth client",
        };
    }
}

type OAuthClientRow = typeof oauthClient.$inferSelect;

export async function listOAuthClients(): Promise<{
    success: boolean;
    data?: Array<Pick<OAuthClientRow, "clientId" | "name" | "public" | "redirectUris" | "createdAt">>;
    error?: string;
}> {
    try {
        const headersList = await headers();

        // Get the current session
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user) {
            return {
                success: false,
                error: "Not authenticated",
            };
        }

        // Query clients owned by the current user
        const clients = await db.query.oauthClient.findMany({
            where: eq(oauthClient.userId, session.user.id),
        });

        return {
            success: true,
            data: clients.map((c) => ({
				clientId: c.clientId,
				name: c.name,
				public: c.public,
				redirectUris: c.redirectUris,
				createdAt: c.createdAt,
			})),
        };
    } catch (error: unknown) {
        console.error("Failed to list OAuth clients:", error);
        return {
            success: false,
            data: [],
            error: toErrorMessage(error) || "Failed to list OAuth clients",
        };
    }
}

export async function deleteOAuthClient(
    clientId: string
): Promise<OAuthClientResult> {
    try {
        const headersList = await headers();

        // Get the current session
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user) {
            return {
                success: false,
                error: "Not authenticated",
            };
        }

        const deleted = await db
			.delete(oauthClient)
			.where(and(eq(oauthClient.clientId, clientId), eq(oauthClient.userId, session.user.id)))
			.returning({ clientId: oauthClient.clientId });

		if (!deleted.length) {
			return {
				success: false,
				error: "Not authorized",
			};
		}

        return {
            success: true,
        };
    } catch (error: unknown) {
        console.error("Failed to delete OAuth client:", error);
        return {
            success: false,
            error: toErrorMessage(error) || "Failed to delete OAuth client",
        };
    }
}
