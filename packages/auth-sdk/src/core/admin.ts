export type OrbitAdminClientOptions = {
	baseURL?: string;
	authPath?: string;
	fetch?: typeof fetch;
};

export type OrbitAdminUserRole = string | string[];

export type OrbitAdminCreateUserInput = {
	email: string;
	password: string;
	name: string;
	role?: OrbitAdminUserRole;
	data?: Record<string, unknown>;
};

export type OrbitAdminListUsersQuery = {
	searchValue?: string;
	searchField?: "email" | "name";
	searchOperator?: "contains" | "starts_with" | "ends_with";
	limit?: string | number;
	offset?: string | number;
	sortBy?: string;
	sortDirection?: "asc" | "desc";
	filterField?: string;
	filterValue?: string | number | boolean;
	filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "contains";
};

export type OrbitAdminBanUserInput = {
	userId: string;
	banReason?: string;
	banExpiresIn?: number;
};

export type OrbitAdminSetRoleInput = {
	userId?: string;
	role: OrbitAdminUserRole;
};

type JsonObject = Record<string, unknown>;

async function readJson(response: Response): Promise<unknown> {
	if (response.status === 204) return null;
	return await response.json().catch(() => null);
}

function asErrorMessage(payload: unknown): string {
	if (!payload || typeof payload !== "object") return "Request failed";
	const record = payload as Record<string, unknown>;
	if (typeof record.message === "string" && record.message) return record.message;
	if (typeof record.error === "string" && record.error) return record.error;
	if (typeof record.error_description === "string" && record.error_description) return record.error_description;
	return "Request failed";
}

function buildBase(options: OrbitAdminClientOptions) {
	const baseURL = options.baseURL ?? "";
	const authPath = options.authPath ?? "/api/auth";
	return `${baseURL}${authPath}`;
}

export function createOrbitAdminClient(options: OrbitAdminClientOptions = {}) {
	const fetchImpl = options.fetch ?? fetch;
	const base = buildBase(options);

	async function requestJson(
		path: string,
		init: RequestInit & { method: "GET" | "POST" },
	): Promise<JsonObject> {
		const res = await fetchImpl(`${base}${path}`, {
			credentials: "include",
			...init,
			headers: {
				"Content-Type": "application/json",
				...(init.headers ?? {}),
			},
		});

		const payload = await readJson(res);
		if (!res.ok) {
			throw new Error(asErrorMessage(payload));
		}
		if (!payload || typeof payload !== "object") return {};
		return payload as JsonObject;
	}

	return {
		createUser: async (input: OrbitAdminCreateUserInput) => {
			return await requestJson("/admin/create-user", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
		listUsers: async (query: OrbitAdminListUsersQuery = {}) => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined) continue;
				params.set(key, String(value));
			}
			const qs = params.toString();
			return await requestJson(`/admin/list-users${qs ? `?${qs}` : ""}`, {
				method: "GET",
			});
		},
		setRole: async (input: OrbitAdminSetRoleInput) => {
			return await requestJson("/admin/set-role", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
		banUser: async (input: OrbitAdminBanUserInput) => {
			return await requestJson("/admin/ban-user", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
		unbanUser: async (input: { userId: string }) => {
			return await requestJson("/admin/unban-user", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
		impersonateUser: async (input: { userId: string }) => {
			return await requestJson("/admin/impersonate-user", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
		stopImpersonating: async () => {
			return await requestJson("/admin/stop-impersonating", {
				method: "POST",
				body: JSON.stringify({}),
			});
		},
		revokeUserSessions: async (input: { userId: string }) => {
			return await requestJson("/admin/revoke-user-sessions", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
		removeUser: async (input: { userId: string }) => {
			return await requestJson("/admin/remove-user", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
	};
}

