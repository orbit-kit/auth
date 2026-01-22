# @orbit-kit/auth-sdk

Orbit Auth client SDK (OAuth 2.1 / PKCE) + React helpers.

> Early alpha. APIs may change.

## Docs



## Install

```bash
bun add @orbit-kit/auth-sdk
```

## What you need first

1) Run the Orbit Auth server and create an OAuth client in the admin UI.

2) You need:

- `clientId` (required)
- `clientSecret` (optional for public clients)
- Your app redirect URI (example: `http://localhost:3000/auth/callback`)

## Quickstart (browser / SPA)

### Create the client

```ts
import { createOrbitAuthClient } from "@orbit-kit/auth-sdk";

export const orbitAuth = createOrbitAuthClient({
	baseURL: "http://localhost:5000",
	clientId: "YOUR_CLIENT_ID",
	clientSecret: "YOUR_CLIENT_SECRET",
	redirectURI: "http://localhost:3000/auth/callback",
	scopes: ["openid", "profile", "email"],
});
```

### Start sign-in

```ts
await orbitAuth.signIn();
```

### Handle callback

Create a route/page at your `redirectURI` and call:

```ts
await orbitAuth.handleCallback();
```

## React

```tsx
import { OrbitAuthProvider, useOrbitAuth } from "@orbit-kit/auth-sdk/react";
import { orbitAuth } from "./orbit-auth";

export function App() {
	return (
		<OrbitAuthProvider client={orbitAuth}>
			<Home />
		</OrbitAuthProvider>
	);
}

function Home() {
	const { session, isLoading, signIn, signOut } = useOrbitAuth();

	if (isLoading) return <div>Loading…</div>;
	if (!session) return <button onClick={() => signIn()}>Sign in</button>;

	return (
		<div>
			<div>{session.user.email}</div>
			<button onClick={() => signOut()}>Sign out</button>
		</div>
	);
}
```

## Exports

- `@orbit-kit/auth-sdk`: core client
- `@orbit-kit/auth-sdk/react`: React provider + hooks
- `@orbit-kit/auth-sdk/api`: helpers for server-side integrations (advanced)

## License

Apache-2.0
