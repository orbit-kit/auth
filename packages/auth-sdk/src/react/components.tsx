import { useMemo, type ReactNode } from "react";
import type { OrbitAuthConfig, SignInOptions } from "../core/types";
import { createOrbitAuthClient } from "../core/client";
import { OrbitAuthProvider, useOrbitAuth } from "./hooks";

export type OrbitAuthWidgetProps = Omit<OrbitAuthConfig, "clientSecret"> & {
	clientSecret?: string;
	signInOptions?: SignInOptions;
	loading?: ReactNode;
	signedOut?: ReactNode;
	signedIn?: ReactNode;
	error?: (error: Error, retry: () => void) => ReactNode;
};

function DefaultSignedOut() {
	const { signIn } = useOrbitAuth();
	return (
		<button type="button" onClick={() => signIn()}>
			Sign in
		</button>
	);
}

function DefaultSignedIn() {
	const { session, signOut } = useOrbitAuth();
	return (
		<div>
			<div>{session?.user?.email}</div>
			<button type="button" onClick={() => signOut()}>
				Sign out
			</button>
		</div>
	);
}

function DefaultLoading() {
	return <div>Loading...</div>;
}

function DefaultError({ error, retry }: { error: Error; retry: () => void }) {
	return (
		<div>
			<div>{error.message}</div>
			<button type="button" onClick={retry}>
				Retry
			</button>
		</div>
	);
}

function OrbitAuthWidgetInner(props: OrbitAuthWidgetProps) {
	const { session, isLoading, error, refreshSession, signIn } = useOrbitAuth();

	if (isLoading) {
		return props.loading ?? <DefaultLoading />;
	}

	if (error) {
		const render = props.error ?? ((err, retry) => <DefaultError error={err} retry={retry} />);
		return render(error, refreshSession);
	}

	if (!session) {
		if (props.signedOut) return <>{props.signedOut}</>;
		if (props.signInOptions) {
			return (
				<button type="button" onClick={() => signIn(props.signInOptions)}>
					Sign in
				</button>
			);
		}
		return <DefaultSignedOut />;
	}

	return props.signedIn ? <>{props.signedIn}</> : <DefaultSignedIn />;
}

export function OrbitAuthWidget(props: OrbitAuthWidgetProps) {
	const { baseURL, clientId, clientSecret, scopes, redirectURI, storage } = props;
	const client = useMemo(() => {
		return createOrbitAuthClient({
			baseURL,
			clientId,
			clientSecret,
			scopes,
			redirectURI,
			storage,
		});
	}, [baseURL, clientId, clientSecret, scopes, redirectURI, storage]);

	return (
		<OrbitAuthProvider client={client}>
			<OrbitAuthWidgetInner {...props} />
		</OrbitAuthProvider>
	);
}

export function OrbitAuthSignInButton(props: { children?: ReactNode; options?: SignInOptions }) {
	const { signIn, isLoading } = useOrbitAuth();
	return (
		<button type="button" onClick={() => signIn(props.options)} disabled={isLoading}>
			{props.children ?? "Sign in"}
		</button>
	);
}

export function OrbitAuthSignOutButton(props: { children?: ReactNode }) {
	const { signOut, isLoading } = useOrbitAuth();
	return (
		<button type="button" onClick={() => signOut()} disabled={isLoading}>
			{props.children ?? "Sign out"}
		</button>
	);
}

export function OrbitAuthUser() {
	const { session } = useOrbitAuth();
	if (!session) return null;
	return (
		<div>
			<div>{session.user.name}</div>
			<div>{session.user.email}</div>
		</div>
	);
}

