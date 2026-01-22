import { auth } from "@/lib/auth";
import { completeSetup, isSetupCompleted } from "@/lib/setup";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

function generateId(): string {
	return crypto.randomBytes(16).toString("hex");
}

export async function POST(req: Request) {
	try {
		const isCompleted = await isSetupCompleted();
		if (isCompleted) {
			return NextResponse.json(
				{ error: "Setup already completed" },
				{ status: 400 },
			);
		}

		const body = await req.json();
		const { adminUrl, adminEmail, adminPassword, adminName, features } = body;

		if (!adminUrl || !adminEmail || !adminPassword) {
			return NextResponse.json(
				{ error: "Admin URL, email, and password are required" },
				{ status: 400 },
			);
		}

		if (adminPassword.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters" },
				{ status: 400 },
			);
		}

		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, adminEmail))
			.limit(1);

		if (existingUser.length > 0) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 },
			);
		}

		const hashedPassword = await hashPassword(adminPassword);
		const userId = generateId();

		// Create user
		const newUser = await db
			.insert(user)
			.values({
				id: userId,
				email: adminEmail,
				name: adminName || "Admin",
				role: "admin",
				emailVerified: true,
			})
			.returning({ id: user.id })
			.then((r) => r[0]);

		// Create credential account with password
		await db.insert(account).values({
			id: generateId(),
			userId: newUser.id,
			accountId: newUser.id,
			providerId: "credential",
			password: hashedPassword,
		});

		await completeSetup(
			{
				adminUrl,
				adminEmail,
				adminPassword: "",
				adminName,
				features: {
					emailProvider: features?.emailProvider ?? false,
					emailVerification: features?.emailVerification ?? false,
					passwordReset: features?.passwordReset ?? false,
					oAuthGoogle: features?.oAuthGoogle ?? false,
					oAuthGitHub: features?.oAuthGitHub ?? false,
					twoFactor: features?.twoFactor ?? false,
				},
			},
			newUser.id,
		);

		// Try to sign in the user (optional, redirect to sign-in page on failure)
		try {
			await auth.api.signInEmail({
				body: {
					email: adminEmail,
					password: adminPassword,
				},
				headers: await headers(),
			});
		} catch {
			// If sign-in fails, user can sign in manually
			return NextResponse.json(
				{ success: true, message: "Setup completed. Please sign in manually." },
				{ status: 200 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				message: "Setup completed successfully",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Setup error:", error);
		return NextResponse.json(
			{ error: "An error occurred during setup" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	const isCompleted = await isSetupCompleted();
	return NextResponse.json({ isCompleted });
}
