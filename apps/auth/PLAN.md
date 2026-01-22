# Orbit Auth - MVP Development Plan

## 📋 Table of Contents
1. [Project Vision](#project-vision)
2. [MVP Scope Definition](#mvp-scope-definition)
3. [What's Included vs Excluded](#whats-included-vs-excluded)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [Implementation Phases](#implementation-phases)
7. [Security Considerations](#security-considerations)
8. [Post-MVP Roadmap](#post-mvp-roadmap)

---

## 🎯 Project Vision

**Orbit Auth** is an open-source, self-hosted Authentication-as-a-Service platform. It serves as a centralized OAuth provider that multiple applications can connect to for user authentication.

### Why Build This?
- **Unified Authentication**: Companies/developers managing multiple apps need one user base
- **Self-Hosted Control**: Data sovereignty, GDPR compliance, no vendor lock-in
- **Open Source**: Community-driven, transparent, customizable
- **Simplicity**: Easy setup without complex configuration

---

## ✅ MVP Scope Definition

### Core MVP Features

1. **Email/Password Authentication**
   - User registration
   - User login
   - Password reset flow
   - Email verification (toggleable per application)

2. **Social OAuth (Optional & Configurable)**
   - Google OAuth - user can enable/disable
   - GitHub OAuth - user can enable/disable
   - No ENV setup required if disabled

3. **OAuth Provider Functionality**
   - Act as OAuth 2.0 provider for connected applications
   - Authorization code flow
   - JWT token generation
   - Client application registration

4. **User Dashboard**
   - Control all settings from dashboard
   - Configure OAuth providers (Google/GitHub)
   - Manage connected applications
   - Set environment variables from UI
   - Toggle email verification per app

5. **Admin (Simple Role-Based)**
   - Admin = Regular user with `role: "admin"`
   - Can manage users
   - Can manage applications
   - No separate admin panel (MVP)

---

## 🚫 What's Included vs Excluded

### ✅ INCLUDED IN MVP

| Feature | Description |
|---------|-------------|
| Email/Password Auth | Core authentication method |
| Google OAuth | Optional, toggleable from dashboard |
| GitHub OAuth | Optional, toggleable from dashboard |
| Email Verification | Optional per application |
| PostgreSQL Database | Primary database |
| User Dashboard | Central control panel |
| Application Management | Register OAuth client apps |
| JWT Tokens | Token-based authentication |
| Password Reset | Email-based password recovery |
| Role-based Admin | Admin is user with admin role |

### ❌ EXCLUDED FROM MVP (Deferred)

| Feature | Reason | When |
|---------|--------|------|
| Payment/Subscription | Not core functionality | v2.0 |
| Test Users | Development convenience only | Post-MVP |
| Other OAuth Providers | Google & GitHub sufficient for MVP | v1.1 |
| Apple OAuth | Complexity, certificate requirements | v1.1 |
| Discord OAuth | Not essential | v1.1 |
| Twitter/X OAuth | Not essential | v1.1 |
| Admin Panel (Separate) | Admin role sufficient | v2.0 |
| Advanced Admin Security | Focus on core security first | v1.5 |
| Two-Factor Authentication | Add after core is stable | v1.1 |
| Webhook System | Advanced feature | v1.2 |
| Plugin System | Extensibility for later | v2.0 |
| Audit Logs | Important but not MVP | v1.1 |
| Analytics Dashboard | Nice to have | v1.2 |
| Multiple Database Support | PostgreSQL only for MVP | v1.1 |
| Horizontal Scaling | Single instance first | v2.0 |
| Organization/Teams | Complex feature | v1.5 |

---

## 🛠 Technology Stack

### Core Technologies

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14+ (App Router) | Full-stack, SSR, API routes |
| **Language** | TypeScript | Type safety, better DX |
| **Auth Library** | Better Auth | Modern, flexible, well-documented |
| **Database** | PostgreSQL | Reliable, scalable, industry standard |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great DX |
| **Styling** | Tailwind CSS | Utility-first, fast development |
| **UI Components** | Shadcn/ui | Already in project, customizable |
| **Deployment** | Docker | Easy self-hosting |

### Supporting Libraries

| Purpose | Library |
|---------|---------|
| Form Handling | React Hook Form + Zod |
| State Management | TanStack Query (React Query) |
| Email | Resend (or nodemailer for self-host) |
| Validation | Zod |
| Icons | Lucide React |
| Date Handling | date-fns |

---

## 🗃 Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ email (varchar, unique)                                      │
│ email_verified (boolean, default: false)                     │
│ password_hash (varchar, nullable - for OAuth users)          │
│ name (varchar)                                               │
│ image (varchar, nullable)                                    │
│ role (enum: 'user', 'admin', default: 'user')               │
│ created_at (timestamp)                                       │
│ updated_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        SESSIONS                              │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ user_id (uuid, FK → users)                                  │
│ token (varchar, unique)                                      │
│ expires_at (timestamp)                                       │
│ ip_address (varchar, nullable)                              │
│ user_agent (text, nullable)                                 │
│ created_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        ACCOUNTS                              │
│              (OAuth provider connections)                    │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ user_id (uuid, FK → users)                                  │
│ provider (varchar) - 'google', 'github'                     │
│ provider_account_id (varchar)                               │
│ access_token (text, nullable)                               │
│ refresh_token (text, nullable)                              │
│ expires_at (timestamp, nullable)                            │
│ created_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    APPLICATIONS                              │
│              (OAuth client applications)                     │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ name (varchar)                                               │
│ description (text, nullable)                                │
│ client_id (varchar, unique)                                 │
│ client_secret (varchar)                                      │
│ redirect_uris (text[])                                      │
│ logo_url (varchar, nullable)                                │
│ owner_id (uuid, FK → users)                                 │
│ require_email_verification (boolean, default: false)        │
│ created_at (timestamp)                                       │
│ updated_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION_CODES                         │
│              (OAuth authorization codes)                     │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ code (varchar, unique)                                       │
│ user_id (uuid, FK → users)                                  │
│ application_id (uuid, FK → applications)                    │
│ redirect_uri (varchar)                                       │
│ scope (varchar)                                              │
│ expires_at (timestamp)                                       │
│ used (boolean, default: false)                              │
│ created_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ACCESS_TOKENS                             │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ token (varchar, unique)                                      │
│ user_id (uuid, FK → users)                                  │
│ application_id (uuid, FK → applications)                    │
│ scope (varchar)                                              │
│ expires_at (timestamp)                                       │
│ created_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SYSTEM_SETTINGS                             │
│          (Dashboard-configurable settings)                   │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ key (varchar, unique)                                        │
│ value (text)                                                 │
│ type (enum: 'string', 'boolean', 'json')                    │
│ description (text, nullable)                                │
│ updated_at (timestamp)                                       │
│ updated_by (uuid, FK → users)                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                VERIFICATION_TOKENS                           │
│            (Email verification & password reset)             │
├─────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                               │
│ token (varchar, unique)                                      │
│ user_id (uuid, FK → users)                                  │
│ type (enum: 'email_verification', 'password_reset')         │
│ expires_at (timestamp)                                       │
│ created_at (timestamp)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Priority: CRITICAL**

#### 1.1 Project Setup & Cleanup
- [ ] Remove payment/subscription related code
- [ ] Remove test user functionality
- [ ] Remove unused OAuth providers (keep Google, GitHub)
- [ ] Remove organization/teams features (MVP simplification)
- [ ] Clean up unused components and routes
- [ ] Set up fresh database schema with Drizzle

#### 1.2 Database Setup
- [ ] Configure PostgreSQL connection
- [ ] Create Drizzle schema for all tables
- [ ] Set up migrations
- [ ] Create seed script for initial admin user

#### 1.3 Better Auth Configuration
- [ ] Configure Better Auth for email/password
- [ ] Set up session management
- [ ] Configure JWT settings

---

### Phase 2: Core Authentication (Week 2-3)
**Priority: CRITICAL**

#### 2.1 Email/Password Authentication
- [ ] Sign up page (email, password, name)
- [ ] Sign in page
- [ ] Password validation (strength requirements)
- [ ] Session creation and management
- [ ] Sign out functionality

#### 2.2 Password Reset Flow
- [ ] Forgot password page
- [ ] Email sending (password reset link)
- [ ] Reset password page
- [ ] Token validation and expiration

#### 2.3 Email Verification (Optional Feature)
- [ ] Verification token generation
- [ ] Verification email sending
- [ ] Verification confirmation page
- [ ] Toggle setting per application

---

### Phase 3: OAuth Provider Setup (Week 3-4)
**Priority: HIGH**

#### 3.1 Google OAuth (Optional)
- [ ] Google OAuth configuration in Better Auth
- [ ] Dashboard toggle to enable/disable
- [ ] Settings storage in database (not just ENV)
- [ ] Client ID/Secret input from dashboard
- [ ] Callback handling

#### 3.2 GitHub OAuth (Optional)
- [ ] GitHub OAuth configuration in Better Auth
- [ ] Dashboard toggle to enable/disable
- [ ] Settings storage in database
- [ ] Client ID/Secret input from dashboard
- [ ] Callback handling

#### 3.3 OAuth Provider UI
- [ ] Social login buttons (conditional rendering)
- [ ] Account linking (connect social to existing account)
- [ ] Provider status indicators in dashboard

---

### Phase 4: OAuth Provider Functionality (Week 4-5)
**Priority: HIGH**

> This is where Orbit Auth acts as an OAuth PROVIDER for other apps

#### 4.1 Application Registration
- [ ] Create application form
- [ ] Generate client ID and client secret
- [ ] Redirect URI configuration
- [ ] Application logo upload
- [ ] Application listing page

#### 4.2 OAuth 2.0 Authorization Server
- [ ] Authorization endpoint (`/oauth/authorize`)
- [ ] Token endpoint (`/oauth/token`)
- [ ] Authorization code generation
- [ ] Token generation (access token, refresh token)
- [ ] Token validation endpoint

#### 4.3 OAuth Flow Pages
- [ ] Consent screen (user approves app access)
- [ ] Account selection (if multiple sessions)
- [ ] Error pages (invalid client, expired code, etc.)

#### 4.4 OAuth Standards Compliance
- [ ] PKCE support (Proof Key for Code Exchange)
- [ ] Scope handling
- [ ] State parameter validation
- [ ] Token introspection endpoint

---

### Phase 5: User Dashboard (Week 5-6)
**Priority: HIGH**

#### 5.1 User Profile Management
- [ ] View profile information
- [ ] Update name and avatar
- [ ] Change password
- [ ] View connected OAuth providers
- [ ] Disconnect OAuth providers

#### 5.2 Session Management
- [ ] View active sessions
- [ ] Session details (IP, browser, location)
- [ ] Revoke individual sessions
- [ ] Revoke all other sessions

#### 5.3 Connected Applications
- [ ] View apps user has authorized
- [ ] Revoke application access
- [ ] Last used timestamp

---

### Phase 6: Admin Features (Week 6-7)
**Priority: MEDIUM**

#### 6.1 Admin Role Implementation
- [ ] Role field in user table
- [ ] Admin middleware/guards
- [ ] First user becomes admin (or seed admin)
- [ ] Promote/demote user role

#### 6.2 User Management (Admin)
- [ ] List all users
- [ ] Search and filter users
- [ ] View user details
- [ ] Edit user information
- [ ] Suspend/unsuspend user
- [ ] Delete user account

#### 6.3 Application Management (Admin)
- [ ] List all registered applications
- [ ] View application details
- [ ] Edit application settings
- [ ] Revoke application credentials
- [ ] Delete application

#### 6.4 System Settings (Admin)
- [ ] Configure Google OAuth (Client ID, Secret)
- [ ] Configure GitHub OAuth (Client ID, Secret)
- [ ] Toggle OAuth providers globally
- [ ] Email settings (SMTP configuration)
- [ ] General settings (app name, logo, etc.)

---

### Phase 7: Dashboard Configuration (Week 7-8)
**Priority: MEDIUM**

#### 7.1 Settings Management
- [ ] Store settings in database (not ENV only)
- [ ] Settings UI for all configurable options
- [ ] Environment-aware defaults
- [ ] Settings validation

#### 7.2 Configurable Options
- [ ] App name and branding
- [ ] OAuth provider credentials
- [ ] Email provider settings
- [ ] Security settings (token expiry, etc.)
- [ ] Default email verification requirement

#### 7.3 No-ENV Mode
- [ ] App works without .env for OAuth
- [ ] All secrets stored encrypted in DB
- [ ] First-time setup wizard

---

### Phase 8: Security Hardening (Week 8-9)
**Priority: CRITICAL**

#### 8.1 Input Validation
- [ ] Zod schemas for all inputs
- [ ] SQL injection prevention (Drizzle handles this)
- [ ] XSS prevention
- [ ] CSRF protection

#### 8.2 Rate Limiting
- [ ] Login attempt limiting
- [ ] Password reset rate limiting
- [ ] API rate limiting
- [ ] OAuth endpoint rate limiting

#### 8.3 Security Headers
- [ ] Helmet.js or Next.js security headers
- [ ] Content Security Policy
- [ ] CORS configuration
- [ ] Secure cookie settings

#### 8.4 Secret Management
- [ ] Encrypt secrets in database
- [ ] Secure session tokens
- [ ] Client secret hashing

---

### Phase 9: Deployment Preparation (Week 9-10)
**Priority: HIGH**

#### 9.1 Docker Setup
- [ ] Dockerfile for production
- [ ] docker-compose.yml (app + postgres)
- [ ] Environment variable documentation
- [ ] Health check endpoints

#### 9.2 Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] OAuth integration guide for clients
- [ ] Configuration reference

#### 9.3 Final Testing
- [ ] End-to-end testing of auth flows
- [ ] OAuth flow testing
- [ ] Security testing
- [ ] Performance testing

---

## 🔐 Security Considerations

### Authentication Security
- **Password Hashing**: bcrypt with appropriate cost factor
- **Session Tokens**: Cryptographically secure random tokens
- **JWT**: RS256 signing, short expiry, refresh rotation
- **Password Policy**: Minimum 8 characters, complexity optional

### OAuth Security
- **PKCE**: Required for public clients
- **State Parameter**: Mandatory, cryptographically random
- **Code Expiry**: 10 minutes maximum
- **Token Expiry**: Access (1 hour), Refresh (7 days)
- **Redirect URI**: Exact match validation

### Data Security
- **Secrets Encryption**: AES-256 for stored secrets
- **Database**: SSL connections, encrypted at rest
- **Cookies**: HttpOnly, Secure, SameSite=Lax

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Login | 5 attempts / 15 minutes |
| Password Reset | 3 requests / hour |
| OAuth Authorize | 10 / minute |
| API General | 100 / minute |

### Admin Security (MVP - Basic)
- Admin is user with `role: "admin"`
- Protected routes check role
- Basic audit trail (who changed what)
- **Note**: Advanced admin security deferred to post-MVP

---

## 🚀 Post-MVP Roadmap

### Version 1.1 (After MVP)
- [ ] Two-Factor Authentication (TOTP, Email OTP)
- [ ] Audit Logging
- [ ] Additional OAuth providers (Apple, Discord, Twitter)
- [ ] MySQL/SQLite support

### Version 1.2
- [ ] Webhook system
- [ ] Analytics dashboard
- [ ] Email templates customization
- [ ] Backup/restore functionality

### Version 1.5
- [ ] Organizations/Teams
- [ ] Advanced admin security
- [ ] Role-based access control (RBAC)
- [ ] API keys for applications

### Version 2.0
- [ ] Separate Admin Panel
- [ ] Payment/Subscription integration
- [ ] Plugin system
- [ ] Horizontal scaling
- [ ] Multi-tenant support

---

## 📁 Recommended File Structure (MVP)

```
orbit-auth/
├── app/
│   ├── (auth)/                    # Auth pages (public)
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-email/
│   ├── (oauth)/                   # OAuth provider endpoints
│   │   ├── authorize/
│   │   ├── consent/
│   │   └── callback/
│   ├── (dashboard)/               # Protected dashboard
│   │   ├── profile/
│   │   ├── sessions/
│   │   ├── applications/
│   │   └── settings/
│   ├── (admin)/                   # Admin routes
│   │   ├── users/
│   │   ├── applications/
│   │   └── settings/
│   └── api/
│       ├── auth/                  # Better Auth routes
│       └── oauth/                 # OAuth endpoints
│           ├── authorize/
│           ├── token/
│           └── userinfo/
├── components/
│   ├── ui/                        # Shadcn components
│   ├── forms/                     # Form components
│   └── layouts/                   # Layout components
├── lib/
│   ├── auth.ts                    # Better Auth config
│   ├── db/                        # Database
│   │   ├── index.ts              # Drizzle client
│   │   ├── schema.ts             # Schema definitions
│   │   └── migrations/
│   ├── oauth/                     # OAuth provider logic
│   └── utils/
├── hooks/
├── types/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

---

## ✅ MVP Definition of Done

The MVP is complete when:

1. ✅ User can register with email/password
2. ✅ User can log in and log out
3. ✅ User can reset password via email
4. ✅ Admin can enable/disable Google OAuth from dashboard
5. ✅ Admin can enable/disable GitHub OAuth from dashboard
6. ✅ User can log in with Google (if enabled)
7. ✅ User can log in with GitHub (if enabled)
8. ✅ Applications can be registered as OAuth clients
9. ✅ Orbit Auth functions as OAuth provider (auth code flow)
10. ✅ Email verification can be toggled per application
11. ✅ All settings configurable from dashboard
12. ✅ Admin can manage users (CRUD)
13. ✅ Admin can manage applications
14. ✅ Basic security measures implemented
15. ✅ Docker deployment works
16. ✅ Documentation complete

---

## 📝 Notes

- **Admin Security**: For MVP, admin is just a user with role. Proper admin security (separate login, IP whitelist, etc.) will be added post-MVP
- **OAuth Providers**: Only Google and GitHub for MVP. Others can be added later without major refactoring
- **Database**: PostgreSQL only for MVP. The schema is designed to be adaptable to other databases later
- **No Payment**: All payment/subscription code should be removed for clean MVP
- **Email**: Email verification is optional. If disabled, no SMTP setup needed
