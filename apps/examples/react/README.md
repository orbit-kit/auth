# Orbit Auth React Example

A minimal React application demonstrating how to use `@orbit-kit/auth-sdk` for authentication with Orbit Auth.

## Prerequisites

- Node.js 18+
- pnpm (or npm/bun)
- Orbit Auth server running (see main repo)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment file and configure:

```bash
cp .env.example .env
```

3. Update `.env` with your Orbit Auth credentials:

```
VITE_ORBIT_AUTH_URL=http://localhost:5000
VITE_ORBIT_CLIENT_ID=your-client-id
VITE_ORBIT_CLIENT_SECRET=your-client-secret
```

4. Start the development server:

```bash
pnpm dev
```

5. Open http://localhost:5173

## Usage

The app demonstrates:

- **Sign In**: Redirects to Orbit Auth for authentication
- **Session State**: Displays user info after successful login
- **Sign Out**: Clears session and tokens

### Code Overview

```tsx
// src/App.tsx
import { OrbitAuthProvider, useOrbitAuth } from "@orbit-kit/auth-sdk/react";
import { orbitAuth } from "./lib/auth";

function App() {
  return (
    <OrbitAuthProvider client={orbitAuth}>
      <YourApp />
    </OrbitAuthProvider>
  );
}

// In any component
const { session, signIn, signOut } = useOrbitAuth();
```

## How It Works

1. User clicks "Sign in with Orbit Auth"
2. Redirects to Orbit Auth's `/oauth2/authorize` with PKCE
3. User logs in on Orbit Auth
4. Orbit Auth redirects back with authorization code
5. SDK exchanges code for tokens (client-side)
6. Tokens stored in cookies
7. Session state updates automatically

## OAuth Flow

This example uses **client-side callback handling**:

- Callbacks are processed in the browser via `handleCallback()`
- Tokens are stored in cookies
- No server-side API routes required

For production apps with a backend, consider using the server-side handlers in `@orbit-kit/auth-sdk/api`.
