import { db } from "./index";
import { user, account } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";

function generateId(): string {
	return crypto.randomBytes(16).toString("hex");
}

async function seed() {
	console.log("Starting database seed...");

	const adminEmail = process.env.ADMIN_EMAIL || "admin@orbitauth.com";
	const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

	const existingAdmin = await db.query.user.findFirst({
		where: eq(user.email, adminEmail),
	});

	if (existingAdmin) {
		console.log("Admin user already exists");
		return;
	}

	const hashedPassword = await hashPassword(adminPassword);
	const userId = generateId();

	// Create user
	await db.insert(user).values({
		id: userId,
		email: adminEmail,
		name: "Admin",
		role: "admin",
		emailVerified: true,
	});

	// Create credential account with password
	await db.insert(account).values({
		id: generateId(),
		userId: userId,
		accountId: userId,
		providerId: "credential",
		password: hashedPassword,
	});

	console.log("Admin user created successfully");
	console.log(`Email: ${adminEmail}`);
	console.log(`Password: ${adminPassword}`);
}

seed().catch(console.error);
