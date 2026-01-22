export interface RequestLike {
	url: string;
	headers: {
		get(name: string): string | null;
	};
	cookies: {
		get(name: string): { value: string } | undefined;
	};
}

export interface ResponseLike {
	headers: Headers;
	status: number;
	statusText: string;
	json(): Promise<unknown>;
	text(): Promise<string>;
}

export interface AuthHandlers {
	handleCallback(request: RequestLike): Promise<ResponseLike | void>;
	handleSignOut(request: RequestLike): Promise<ResponseLike | void>;
	getSession(request: RequestLike): Promise<ResponseLike>;
	handleRefresh(request: RequestLike): Promise<ResponseLike>;
}

export function createOrbitAuthHandlers(client: {
	config: { clientId: string; clientSecret?: string };
	baseURL: string;
}): AuthHandlers {
	const baseURL = client.baseURL;
	const clientId = client.config.clientId;
	const clientSecret = client.config.clientSecret || "";

	type CookieOptions = {
		maxAge?: number;
		httpOnly?: boolean;
		secure?: boolean;
		path?: string;
		domain?: string;
		sameSite?: "lax" | "strict" | "none";
	};

	function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
		const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
		if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
		if (options.domain) parts.push(`Domain=${options.domain}`);
		parts.push(`Path=${options.path ?? "/"}`);
		if (options.httpOnly) parts.push("HttpOnly");
		if (options.secure) parts.push("Secure");
		if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
		return parts.join("; ");
	}

	function parseTokenPayload(payload: unknown): {
		accessToken: string;
		refreshToken?: string;
		expiresIn: number;
	} {
		if (!payload || typeof payload !== "object") {
			throw new Error("Invalid token response");
		}
		const record = payload as Record<string, unknown>;
		const accessToken = record.access_token;
		const refreshToken = record.refresh_token;
		const expiresIn = record.expires_in;
		if (typeof accessToken !== "string" || !accessToken.length) {
			throw new Error("Token response missing access_token");
		}
		return {
			accessToken,
			refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
			expiresIn: typeof expiresIn === "number" && Number.isFinite(expiresIn) ? expiresIn : 3600,
		};
	}

	async function redirect(
		url: string,
		cookies?: Array<{ name: string; value: string; options: CookieOptions }>,
	): Promise<ResponseLike> {
		const response = new Response(null, {
			status: 302,
			statusText: "Found",
			headers: new Headers(),
		});
		response.headers.set("Location", url);
		for (const cookie of cookies ?? []) {
			response.headers.append(
				"Set-Cookie",
				serializeCookie(cookie.name, cookie.value, cookie.options),
			);
		}
		return response;
	}

	async function json(data: unknown, status = 200): Promise<ResponseLike> {
		return new Response(JSON.stringify(data), {
			status,
			headers: new Headers({ "Content-Type": "application/json" }),
		});
	}

	async function handleCallback(request: RequestLike): Promise<ResponseLike | void> {
		try {
			const url = new URL(request.url);
			const code = url.searchParams.get("code");
			const state = url.searchParams.get("state");
			const error = url.searchParams.get("error");
			const errorDescription = url.searchParams.get("error_description");
			const callbackURL = url.searchParams.get("callback_url") || url.searchParams.get("redirect_uri") || "/";

			if (error) {
				const errorCallbackURL = url.searchParams.get("error_callback_url") || "/?error=true";
				return redirect(new URL(errorCallbackURL, request.url).toString());
			}

			if (!code || !state) {
				return redirect(new URL("/?error=missing_params", request.url).toString());
			}

			const stateCookie = request.cookies.get("orbit_auth_state")?.value;
			if (stateCookie && state !== stateCookie) {
				return redirect(new URL("/?error=csrf", request.url).toString());
			}

			const response = await fetch(`${baseURL}/oauth2/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "authorization_code",
					code,
					redirect_uri: `${new URL(request.url).origin}/api/auth/callback`,
					client_id: clientId,
					client_secret: clientSecret,
				}),
			});

			if (!response.ok) {
				const errorCallbackURL = url.searchParams.get("error_callback_url") || "/?error=token_exchange_failed";
				return redirect(new URL(errorCallbackURL, request.url).toString());
			}

			const data: unknown = await response.json();
			const { accessToken, refreshToken, expiresIn } = parseTokenPayload(data);

			const userInfoResponse = await fetch(`${baseURL}/oauth2/userinfo`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (!userInfoResponse.ok) {
				const errorCallbackURL = url.searchParams.get("error_callback_url") || "/?error=user_info_failed";
				return redirect(new URL(errorCallbackURL, request.url).toString());
			}

			const redirectURL = new URL(callbackURL, request.url);
			redirectURL.searchParams.set("authenticated", "true");

			const cookies: Array<{ name: string; value: string; options: CookieOptions }> = [
				{
					name: "orbit_access_token",
					value: accessToken,
					options: { maxAge: expiresIn, httpOnly: true, sameSite: "lax" },
				},
				{ name: "orbit_auth_state", value: "", options: { maxAge: 0 } },
			];
			if (refreshToken) {
				cookies.splice(1, 0, {
					name: "orbit_refresh_token",
					value: refreshToken,
					options: { maxAge: 30 * 24 * 60 * 60, httpOnly: true, sameSite: "lax" },
				});
			}
			return redirect(redirectURL.toString(), cookies);
		} catch (err) {
			console.error("OAuth callback error:", err);
			const url = new URL(request.url);
			const errorCallbackURL = url.searchParams.get("error_callback_url") || "/?error=internal_error";
			return redirect(new URL(errorCallbackURL, request.url).toString());
		}
	}

	async function handleSignOut(request: RequestLike): Promise<ResponseLike> {
		try {
			const accessToken = request.cookies.get("orbit_access_token")?.value;
			if (accessToken) {
				await fetch(`${baseURL}/oauth2/revoke`, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({ token: accessToken, client_id: clientId, client_secret: clientSecret }),
				});
			}
		} catch (err) {
			console.error("Sign out error:", err);
		}

		return redirect(new URL("/", request.url).toString(), [
			{ name: "orbit_access_token", value: "", options: { maxAge: 0 } },
			{ name: "orbit_refresh_token", value: "", options: { maxAge: 0 } },
			{ name: "orbit_auth_state", value: "", options: { maxAge: 0 } },
		]);
	}

	async function getSession(request: RequestLike): Promise<ResponseLike> {
		try {
			const accessToken = request.cookies.get("orbit_access_token")?.value;
			if (!accessToken) {
				return json({ user: null, session: null });
			}

			const response = await fetch(`${baseURL}/oauth2/userinfo`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (!response.ok) {
				return json({ user: null, session: null });
			}

			const userInfo: unknown = await response.json();
			if (!userInfo || typeof userInfo !== "object") {
				return json({ user: null, session: null });
			}
			const record = userInfo as Record<string, unknown>;
			if (typeof record.sub !== "string") {
				return json({ user: null, session: null });
			}
			return json({
				user: {
					id: record.sub,
					email: typeof record.email === "string" ? record.email : "",
					name: typeof record.name === "string" ? record.name : "",
					image: typeof record.picture === "string" ? record.picture : undefined,
					emailVerified: typeof record.email_verified === "boolean" ? record.email_verified : false,
				},
				session: { accessToken },
			});
		} catch {
			return json({ user: null, session: null });
		}
	}

	async function handleRefresh(request: RequestLike): Promise<ResponseLike> {
		try {
			const refreshToken = request.cookies.get("orbit_refresh_token")?.value;
			if (!refreshToken) {
				return json({ error: "No refresh token" }, 401);
			}

			const response = await fetch(`${baseURL}/oauth2/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: refreshToken,
					client_id: clientId,
					client_secret: clientSecret,
				}),
			});

			if (!response.ok) {
				return json({ error: "Failed to refresh" }, 401);
			}

			const data: unknown = await response.json();
			const { accessToken, refreshToken: newRefreshToken, expiresIn } = parseTokenPayload(data);

			const cookies: Array<{ name: string; value: string; options: CookieOptions }> = [
				{ name: "orbit_access_token", value: accessToken, options: { maxAge: expiresIn, httpOnly: true, sameSite: "lax" } },
			];

			if (newRefreshToken) {
				cookies.push({ name: "orbit_refresh_token", value: newRefreshToken, options: { maxAge: 30 * 24 * 60 * 60, httpOnly: true, sameSite: "lax" } });
			}

			return json({ success: true });
		} catch {
			return json({ error: "Refresh failed" }, 500);
		}
	}

	return { handleCallback, handleSignOut, getSession, handleRefresh };
}
