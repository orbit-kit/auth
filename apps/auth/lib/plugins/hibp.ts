import type { BetterAuthPlugin } from "@better-auth/core";
import { getCurrentAuthContext } from "@better-auth/core/context";
import { defineErrorCodes } from "@better-auth/core/utils";
import { createHash } from "@better-auth/utils/hash";
import { betterFetch } from "@better-fetch/fetch";
import { APIError } from "better-auth/api";
import { getFeatureFlagWithDefault } from "../setup";

const ERROR_CODES = defineErrorCodes({
	PASSWORD_COMPROMISED: "The password you entered has been compromised. Please choose a different password.",
});

type OrbitHibpOptions = {
	customPasswordCompromisedMessage?: string;
	paths?: string[];
	defaultEnabled?: boolean;
};

const DEFAULT_PATHS = ["/sign-up/email", "/change-password", "/reset-password"];

async function checkPasswordCompromise(password: string, customMessage?: string) {
	if (!password) return;
	const sha1Hash = (await createHash("SHA-1", "hex").digest(password)).toUpperCase();
	const prefix = sha1Hash.substring(0, 5);
	const suffix = sha1Hash.substring(5);

	const { data, error } = await betterFetch<string>(
		`https://api.pwnedpasswords.com/range/${prefix}`,
		{
			headers: {
				"Add-Padding": "true",
				"User-Agent": "BetterAuth Password Checker",
			},
		},
	);

	if (error) {
		throw new APIError("INTERNAL_SERVER_ERROR", {
			message: `Failed to check password. Status: ${error.status}`,
		});
	}

	const found = data
		.split("\n")
		.some((line: string) => line.split(":")[0]?.toUpperCase() === suffix.toUpperCase());

	if (found) {
		throw new APIError("BAD_REQUEST", {
			message: customMessage || ERROR_CODES.PASSWORD_COMPROMISED,
			code: "PASSWORD_COMPROMISED",
		});
	}
}

export function orbitHaveIBeenPwned(options?: OrbitHibpOptions): BetterAuthPlugin {
	const paths = options?.paths ?? DEFAULT_PATHS;
	const defaultEnabled = options?.defaultEnabled ?? true;

	return {
		id: "orbitHaveIBeenPwned",
		init(ctx: { password: { hash: (password: string) => Promise<string> } }) {
			return {
				context: {
					password: {
						...ctx.password,
						async hash(password: string) {
							const c = await getCurrentAuthContext();
							if (!c.path || !paths.includes(c.path)) return ctx.password.hash(password);

							const enabled = await getFeatureFlagWithDefault("hibp_passwords", defaultEnabled);

							if (!enabled) return ctx.password.hash(password);
							await checkPasswordCompromise(password, options?.customPasswordCompromisedMessage);
							return ctx.password.hash(password);
						},
					},
				},
			};
		},
		options,
		$ERROR_CODES: ERROR_CODES,
	} satisfies BetterAuthPlugin;
}
