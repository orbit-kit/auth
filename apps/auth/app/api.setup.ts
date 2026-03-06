import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/setup")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const [
						crypto,
						{ eq },
						{ hashPassword },
						{ auth },
						{ db },
						{ account, user },
						{ completeSetup, isSetupCompleted },
					] = await Promise.all([
						import("node:crypto"),
						import("drizzle-orm"),
						import("better-auth/crypto"),
						import("@/lib/auth"),
						import("@/lib/db"),
						import("@/lib/db/schema"),
						import("@/lib/setup"),
					]);
					const generateId = () => crypto.randomBytes(16).toString("hex");
					const isCompleted = await isSetupCompleted();
					if (isCompleted) {
						return Response.json(
							{ error: "Setup already completed" },
							{ status: 400 },
						);
					}

					const body = await request.json();
					const { adminUrl, adminEmail, adminPassword, adminName, features } = body;

					if (!adminUrl || !adminEmail || !adminPassword) {
						return Response.json(
							{ error: "Admin URL, email, and password are required" },
							{ status: 400 },
						);
					}

					if (adminPassword.length < 8) {
						return Response.json(
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
						return Response.json(
							{ error: "User with this email already exists" },
							{ status: 400 },
						);
					}

					const hashedPassword = await hashPassword(adminPassword);
					const userId = generateId();

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
						.then((rows) => rows[0]);

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

					try {
						await auth.api.signInEmail({
							body: {
								email: adminEmail,
								password: adminPassword,
							},
							headers: request.headers,
						});
					} catch {
						return Response.json(
							{ success: true, message: "Setup completed. Please sign in manually." },
							{ status: 200 },
						);
					}

					return Response.json(
						{
							success: true,
							message: "Setup completed successfully",
						},
						{ status: 200 },
					);
				} catch (error) {
					console.error("Setup error:", error);
					return Response.json(
						{ error: "An error occurred during setup" },
						{ status: 500 },
					);
				}
			},
			GET: async () => {
				const { isSetupCompleted } = await import("@/lib/setup");
				const isCompleted = await isSetupCompleted();
				return Response.json({ isCompleted });
			},
		},
	},
});
