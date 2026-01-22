# Orbit Auth

An open-source, self-hosted Authentication-as-a-Service platform built with Next.js and Better Auth.

## Overview

Orbit Auth is a centralized authentication service that allows multiple applications to authenticate users via OAuth. Applications connect to Orbit Auth as an OAuth provider, redirect users to the central login page, and receive authenticated users back.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI Library**: React
- **Authentication**: Better Auth
- **Database**: PostgreSQL (configurable)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Deployment**: Docker support for self-hosting

## Core Features

### OAuth Provider
- Acts as a central OAuth provider for all connected applications
- Standard OAuth 2.0 authorization code flow
- JWT token generation and validation
- Application registration and client credentials management

### User Management
- User registration and authentication
- Profile management
- Password reset functionality
- Email verification

### Admin Dashboard
- **User Moderation**: View, edit, suspend, or delete user accounts
- **Application Management**: Register and manage OAuth client applications
- **Database Management**: Add databases, run migrations, manage schema
- **OAuth Providers**: Configure and manage external OAuth providers (Google, GitHub, etc.)
- **Analytics**: View authentication metrics and usage statistics
- **Audit Logs**: Track authentication events and administrative actions

### Extensibility
- Plugin system for custom authentication methods
- Webhook support for real-time event notifications
- API access for programmatic management
- Role-based access control (RBAC)

## Self-Hosted Deployment

Orbit Auth is designed to be easily self-hosted:
- Docker containers for simplified deployment
- Environment-based configuration
- Database-agnostic (supports PostgreSQL, MySQL, SQLite)
- Horizontal scaling support
- Export/import configurations

## Use Cases

- Companies managing multiple applications with a unified user base
- SaaS providers offering authentication as part of their platform
- Open-source projects needing a centralized auth solution
- Organizations requiring self-hosted authentication (GDPR, SOC2 compliance)

## Architecture

```
┌─────────────┐       OAuth       ┌──────────────┐
│   Client    │ ◄──────────────►  │  Orbit Auth  │
│   App       │                   │  (Provider)  │
└─────────────┘                   └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   Database   │
                                  └──────────────┘
```

## License

Open source - Apache-2.0
