# Orbit Auth - OAuth 2.1 Provider

An open-source, self-hosted Authentication-as-a-Service platform built with Next.js and Better Auth. This server acts as a central OAuth 2.1 provider for your applications.

## Quick Start

### 1. Start the Auth Server (Port 5000)

```bash
cd apps/auth
bun install
npm run dev
```

The auth server will run at http://localhost:5000

### 2. Create an Admin Account

1. Open http://localhost:5000/sign-in
2. Click "Sign Up" and create a new account
3. The first user will automatically become an admin

### 3. Create an OAuth Client via Admin Dashboard

1. Sign in to the auth server
2. Navigate to **Admin Dashboard** (http://localhost:5000/admin)
3. Click on **OAuth Clients** card
4. Click **Create Client** button
5. Fill in the client details:
   - **Client Name**: Your app name (e.g., "Example Client")
   - **Redirect URIs**: `http://localhost:3000/api/auth/oauth2/callback/central-oauth`
   - **Confidential Client**: Toggle ON for web servers that can keep secrets
6. Click **Create Client**
7. **IMPORTANT**: Copy the Client ID and Client Secret immediately (the secret won't be shown again!)

### 4. Configure the Example Client

Copy the credentials from step 3 to `example/nextjs/.env`:

```env
OAUTH_CLIENT_ID=<client_id_from_dashboard>
OAUTH_CLIENT_SECRET=<client_secret_from_dashboard>
OAUTH_DISCOVERY_URL=http://localhost:5000/.well-known/openid-configuration
```

### 5. Start the Example Client (Port 3000)

```bash
cd example/nextjs
bun install
bun dev
```

The example client will run at http://localhost:3000

### 6. Test the OAuth Flow

1. Open http://localhost:3000
2. Click "Sign in with OAuth"
3. You'll be redirected to the auth server (port 5000) to log in
4. After logging in, you'll be asked to consent
5. After consent, you'll be redirected back to the client with an authenticated session

## Architecture

```
┌─────────────────────┐       OAuth 2.1       ┌─────────────────────┐
│   Example Client    │ ◄──────────────────►  │   Orbit Auth        │
│   (Port 3000)       │                       │   (Port 5000)       │
└─────────────────────┘                       └─────────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────────┐
                                              │   PostgreSQL DB     │
                                              └─────────────────────┘
```

## Admin Dashboard

The admin dashboard at `/admin` provides:

### User Management (`/admin`)
- View all users
- Create new users
- Delete users
- Revoke sessions
- Impersonate users
- Ban/Unban users

### OAuth Clients (`/admin/oauth-clients`)
- Create confidential or public OAuth clients
- View all registered clients
- Delete clients
- Copy credentials securely

## Available Scripts

### Auth Server (auth1/)

| Script | Description |
|--------|-------------|
| `bun dev` | Start auth server on port 5000 |
| `bun db:migrate` | Run database migrations |
| `bun db:push` | Push schema changes |

## Configuration

### Auth Server (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@hostname/database?sslmode=require

# Better Auth
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars

# Trusted Origins (comma-separated)
TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### Example Client (.env)

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# OAuth Provider (get these from admin dashboard)
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_DISCOVERY_URL=http://localhost:5000/.well-known/openid-configuration
```

## OAuth Endpoints

The auth server exposes these OAuth 2.1 endpoints:

| Endpoint | Description |
|----------|-------------|
| `/.well-known/openid-configuration` | OIDC Discovery metadata |
| `/.well-known/oauth-authorization-server` | OAuth 2.1 AS metadata |
| `/api/auth/oauth2/authorize` | Authorization endpoint |
| `/api/auth/oauth2/token` | Token endpoint |
| `/api/auth/oauth2/register` | Dynamic client registration |
| `/api/auth/oauth2/userinfo` | UserInfo endpoint |
| `/api/auth/oauth2/introspect` | Token introspection |
| `/api/auth/oauth2/revoke` | Token revocation |
| `/api/auth/jwks` | JSON Web Key Set |

## Features

- **OAuth 2.1 Provider**: Full OAuth 2.1 support with PKCE and S256
- **Admin Dashboard**: Secure management of users and OAuth clients
- **OIDC Compatible**: OpenID Connect compliant with id_token support
- **JWT Access Tokens**: Signed JWT tokens with JWKS verification
- **Consent Management**: User consent flow for third-party apps
- **Multiple Grant Types**: authorization_code, refresh_token, client_credentials

## Security Notes

- OAuth clients must be created through the admin dashboard (requires authentication)
- The client secret is only shown once upon creation
- Confidential clients (web servers) receive both client_id and client_secret
- Public clients (mobile/SPAs) only receive client_id and use PKCE

## Troubleshooting

See the documentation in the `docs/` folder:

- [Adding OAuth Clients](./docs/ADDING_OAUTH_CLIENTS.md) - Guide for registering new client applications
- [NetworkError Fix](./docs/NETWORK_ERROR_FIX.md) - Solution for "NetworkError when attempting to fetch resource"

## Learn More

- [Better Auth Documentation](https://better-auth.com/docs)
- [OAuth Provider Plugin](https://better-auth.com/docs/plugins/oauth-provider)
- [Generic OAuth Plugin](https://better-auth.com/docs/plugins/generic-oauth)
