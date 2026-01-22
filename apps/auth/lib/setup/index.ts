import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { setupStatus, systemSettings } from "@/lib/db/schema";

export interface SetupData {
	adminUrl: string;
	adminEmail: string;
	adminPassword: string;
	adminName?: string;
	features: {
		emailProvider: boolean;
		emailVerification: boolean;
		passwordReset: boolean;
		oAuthGoogle: boolean;
		oAuthGitHub: boolean;
		twoFactor: boolean;
	};
}

export async function isSetupCompleted(): Promise<boolean> {
	const result = await db.select().from(setupStatus).limit(1);
	if (result.length === 0) return false;
	return result[0].isCompleted;
}

export async function getSetupStatus() {
	const result = await db.select().from(setupStatus).limit(1);
	if (result.length === 0) {
		return {
			isCompleted: false,
			completedAt: null,
			setupData: null,
		};
	}
	return result[0];
}

export async function completeSetup(data: SetupData, userId: string) {
	const existing = await db.select().from(setupStatus).limit(1);

	const setupData = {
		adminUrl: data.adminUrl,
		adminEmail: data.adminEmail,
		adminName: data.adminName,
		features: data.features,
		completedAt: new Date(),
	};

	if (existing.length > 0) {
		await db
			.update(setupStatus)
			.set({
				isCompleted: true,
				completedAt: new Date(),
				setupData: setupData,
				updatedAt: new Date(),
			})
			.where(eq(setupStatus.id, existing[0].id));
	} else {
		await db.insert(setupStatus).values({
			isCompleted: true,
			completedAt: new Date(),
			setupData: setupData,
		});
	}

	await db.insert(systemSettings).values([
		{
			key: "admin_url",
			value: data.adminUrl,
			type: "string",
			description: "Admin panel URL",
			updatedBy: userId,
		},
		{
			key: "feature_email_provider",
			value: String(data.features.emailProvider),
			type: "boolean",
			description: "Enable email provider (for password reset and verification)",
			updatedBy: userId,
		},
		{
			key: "feature_email_verification",
			value: String(data.features.emailVerification),
			type: "boolean",
			description: "Enable email verification",
			updatedBy: userId,
		},
		{
			key: "feature_password_reset",
			value: String(data.features.passwordReset),
			type: "boolean",
			description: "Enable password reset functionality",
			updatedBy: userId,
		},
		{
			key: "feature_oauth_google",
			value: String(data.features.oAuthGoogle),
			type: "boolean",
			description: "Enable Google OAuth",
			updatedBy: userId,
		},
		{
			key: "feature_oauth_github",
			value: String(data.features.oAuthGitHub),
			type: "boolean",
			description: "Enable GitHub OAuth",
			updatedBy: userId,
		},
		{
			key: "feature_two_factor",
			value: String(data.features.twoFactor),
			type: "boolean",
			description: "Enable two-factor authentication",
			updatedBy: userId,
		},
	]);
}

export async function getFeatureFlag(key: string): Promise<boolean> {
	const result = await db
		.select()
		.from(systemSettings)
		.where(eq(systemSettings.key, `feature_${key}`));
	if (result.length === 0) return true;
	return result[0].value === "true";
}

export async function getFeatureFlagWithDefault(
	key: string,
	defaultValue: boolean,
): Promise<boolean> {
	const result = await db
		.select()
		.from(systemSettings)
		.where(eq(systemSettings.key, `feature_${key}`));
	if (result.length === 0) return defaultValue;
	return result[0].value === "true";
}

export async function setFeatureFlag(key: string, value: boolean, userId?: string) {
	const existing = await db
		.select()
		.from(systemSettings)
		.where(eq(systemSettings.key, `feature_${key}`));

	if (existing.length > 0) {
		await db
			.update(systemSettings)
			.set({
				value: String(value),
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.where(eq(systemSettings.key, `feature_${key}`));
	} else {
		await db.insert(systemSettings).values({
			key: `feature_${key}`,
			value: String(value),
			type: "boolean",
			description: `Feature flag for ${key}`,
			updatedBy: userId,
		});
	}
}

export async function getAdminUrl(): Promise<string> {
	const result = await db
		.select()
		.from(systemSettings)
		.where(eq(systemSettings.key, "admin_url"));
	if (result.length === 0) return "";
	return result[0].value;
}

export async function getSystemSetting(
	key: string,
	defaultValue: string,
): Promise<string> {
	const result = await db
		.select()
		.from(systemSettings)
		.where(eq(systemSettings.key, key));
	if (result.length === 0) return defaultValue;
	return result[0].value;
}

export async function setSystemSetting(
	key: string,
	value: string,
	userId?: string,
	description?: string,
) {
	const existing = await db
		.select()
		.from(systemSettings)
		.where(eq(systemSettings.key, key));

	if (existing.length > 0) {
		await db
			.update(systemSettings)
			.set({
				value,
				updatedAt: new Date(),
				updatedBy: userId,
				...(description ? { description } : null),
			})
			.where(eq(systemSettings.key, key));
	} else {
		await db.insert(systemSettings).values({
			key,
			value,
			type: "string",
			description: description || `Setting for ${key}`,
			updatedBy: userId,
		});
	}
}
