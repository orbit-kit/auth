"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFeatureFlagWithDefault, getSystemSetting, setFeatureFlag, setSystemSetting } from "@/lib/setup";

function isAdmin(role: unknown): boolean {
	if (role === "admin") return true;
	if (Array.isArray(role)) return role.includes("admin");
	if (typeof role === "string") return role.split(",").map((r) => r.trim()).includes("admin");
	return false;
}

export async function getGlobalSettings(): Promise<{
	success: boolean;
	data?: {
		hibpPasswordsEnabled: boolean;
		googleEnabled: boolean;
		showLogo: boolean;
		brandName: string;
	};
	error?: string;
}> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user || !isAdmin((session.user as unknown as { role?: unknown }).role)) {
			return { success: false, error: "Not authorized" };
		}

		const [hibpPasswordsEnabled, googleEnabled, showLogo, brandName] = await Promise.all([
			getFeatureFlagWithDefault("hibp_passwords", true),
			getFeatureFlagWithDefault("oauth_google", false),
			getFeatureFlagWithDefault("show_logo", true),
			getSystemSetting("brand_name", "Orbit Auth"),
		]);

		return {
			success: true,
			data: {
				hibpPasswordsEnabled,
				googleEnabled,
				showLogo,
				brandName,
			},
		};
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load settings";
		return { success: false, error: message };
	}
}

export async function updateGlobalSettings(input: {
	hibpPasswordsEnabled: boolean;
	googleEnabled: boolean;
	showLogo: boolean;
	brandName: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user || !isAdmin((session.user as unknown as { role?: unknown }).role)) {
			return { success: false, error: "Not authorized" };
		}

		await Promise.all([
			setFeatureFlag("hibp_passwords", input.hibpPasswordsEnabled, session.user.id),
			setFeatureFlag("oauth_google", input.googleEnabled, session.user.id),
			setFeatureFlag("show_logo", input.showLogo, session.user.id),
			setSystemSetting("brand_name", input.brandName, session.user.id, "Auth server display name"),
		]);

		return { success: true };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to update settings";
		return { success: false, error: message };
	}
}
