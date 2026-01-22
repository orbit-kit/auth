import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { OrbitAuthClient } from "../core/client";
import type { OrbitAuthSession, SignInOptions } from "../core/types";

interface OrbitAuthContextValue {
	client: OrbitAuthClient;
	session: OrbitAuthSession | null;
	isLoading: boolean;
	error: Error | null;
	signIn: (options?: SignInOptions) => Promise<void>;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<void>;
}

const OrbitAuthContext = createContext<OrbitAuthContextValue | null>(null);

interface OrbitAuthProviderProps {
	children: ReactNode;
	client: OrbitAuthClient;
	onSessionChange?: (session: OrbitAuthSession | null) => void;
}

export function OrbitAuthProvider({ children, client, onSessionChange }: OrbitAuthProviderProps) {
	const [session, setSession] = useState<OrbitAuthSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const refreshSession = useCallback(async () => {
		try {
			const storedSession = await client.getStoredSession();
			setSession(storedSession);
			setError(null);
			onSessionChange?.(storedSession);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Failed to refresh session"));
			onSessionChange?.(null);
		} finally {
			setIsLoading(false);
		}
	}, [client, onSessionChange]);

	useEffect(() => {
		const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
		const hasCode = url?.searchParams.get("code");
		const hasError = url?.searchParams.get("error");

		if (hasCode || hasError) {
			client.handleCallback()
				.then((newSession) => {
					if (newSession) {
						setSession(newSession);
						onSessionChange?.(newSession);
					}
					setError(null);
				})
				.catch((err) => {
					setError(err instanceof Error ? err : new Error("Callback failed"));
					onSessionChange?.(null);
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			refreshSession();
		}
	}, [client, refreshSession, onSessionChange]);

	const signIn = useCallback(
		async (options?: SignInOptions) => {
			setIsLoading(true);
			setError(null);
			try {
				await client.signIn(options);
			} catch (err) {
				setError(err instanceof Error ? err : new Error("Sign in failed"));
				setIsLoading(false);
			}
		},
		[client]
	);

	const signOut = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			await client.signOut();
			setSession(null);
			onSessionChange?.(null);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Sign out failed"));
		} finally {
			setIsLoading(false);
		}
	}, [client, onSessionChange]);

	return (
		<OrbitAuthContext.Provider
			value={{
				client,
				session,
				isLoading,
				error,
				signIn,
				signOut,
				refreshSession,
			}}
		>
			{children}
		</OrbitAuthContext.Provider>
	);
}

export function useOrbitAuth() {
	const context = useContext(OrbitAuthContext);
	if (!context) {
		throw new Error("useOrbitAuth must be used within an OrbitAuthProvider");
	}
	return context;
}

export function useSession() {
	const { session, isLoading, error } = useOrbitAuth();
	return { data: session, isLoading, error };
}
