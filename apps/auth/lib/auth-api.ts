import { createServerFn } from "@tanstack/react-start";

export type AuthenticatedUser = {
	id: string;
	email: string;
	name: string;
	role?: string | null;
};

function normalizeUser(user: {
	id: string;
	email: string;
	name: string;
	role?: string | null;
}): AuthenticatedUser {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role ?? "user",
	};
}

export function isAdminRole(role: unknown): boolean {
	if (role === "admin") return true;
	if (Array.isArray(role)) return role.includes("admin");
	if (typeof role === "string") {
		return role
			.split(",")
			.map((value) => value.trim())
			.includes("admin");
	}
	return false;
}

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
	const [{ auth }, { getRequestHeaders }] = await Promise.all([
		import("@/lib/auth"),
		import("@tanstack/react-start/server"),
	]);
	const session = await auth.api.getSession({
		headers: getRequestHeaders(),
	});

	if (!session?.user) {
		return null;
	}

	return normalizeUser(session.user);
});

export const getRootLayoutData = createServerFn({ method: "GET" }).handler(async () => {
	const { getFeatureFlagWithDefault, getSystemSetting } = await import("@/lib/setup");
	const [showLogo, brandName] = await Promise.all([
		getFeatureFlagWithDefault("show_logo", true),
		getSystemSetting("brand_name", "Orbit Auth"),
	]);

	return {
		showLogo,
		brandName,
	};
});

export const getSignInRouteData = createServerFn({ method: "GET" }).handler(async () => {
	const { getFeatureFlagWithDefault } = await import("@/lib/setup");
	const googleEnabledFlag = await getFeatureFlagWithDefault("oauth_google", false);
	const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

	return {
		googleEnabled: googleEnabledFlag && googleConfigured,
	};
});

export const getSetupState = createServerFn({ method: "GET" }).handler(async () => {
	const { isSetupCompleted } = await import("@/lib/setup");
	return {
		isCompleted: await isSetupCompleted(),
	};
});
