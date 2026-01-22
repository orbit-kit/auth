import { pgTable, uuid, varchar, boolean, timestamp, text, jsonb, pgEnum, customType } from "drizzle-orm/pg-core";

// Custom text column type that automatically parses JSON arrays
const jsonText = customType<{ data: string[]; driverData: string }>({
	dataType() {
		return "text";
	},
	fromDriver(value: string): string[] {
		if (!value) return [];
		if (typeof value === "string") {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed) ? parsed : [value];
			} catch {
				const trimmed = value.trim();
				if (!trimmed) return [];
				const normalized =
					trimmed.startsWith("{") && trimmed.endsWith("}")
						? trimmed.slice(1, -1)
						: trimmed;
				return normalized
					.split(/[,\s]+/)
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
			}
		}
		return Array.isArray(value) ? value : [];
	},
	toDriver(value: string[]): string {
		return JSON.stringify(value || []);
	},
});

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const verificationTokenTypeEnum = pgEnum("verification_token_type", ["email_verification", "password_reset"]);

// Better Auth core tables
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: userRoleEnum("role").notNull().default("user"),
	// Admin plugin fields
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Custom application tables
export const applications = pgTable("applications", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	clientId: varchar("client_id", { length: 255 }).notNull().unique(),
	clientSecret: varchar("client_secret", { length: 255 }).notNull(),
	redirectUris: jsonb("redirect_uris").notNull(),
	logoUrl: varchar("logo_url", { length: 255 }),
	ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	requireEmailVerification: boolean("require_email_verification").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authorizationCodes = pgTable("authorization_codes", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 255 }).notNull().unique(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
	redirectUri: varchar("redirect_uri", { length: 500 }).notNull(),
	scope: varchar("scope", { length: 255 }),
	expiresAt: timestamp("expires_at").notNull(),
	used: boolean("used").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accessTokens = pgTable("access_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	token: varchar("token", { length: 255 }).notNull().unique(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
	scope: varchar("scope", { length: 255 }),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
	id: uuid("id").primaryKey().defaultRandom(),
	key: varchar("key", { length: 255 }).notNull().unique(),
	value: text("value").notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	description: text("description"),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
});

export const setupStatus = pgTable("setup_status", {
	id: uuid("id").primaryKey().defaultRandom(),
	isCompleted: boolean("is_completed").notNull().default(false),
	completedAt: timestamp("completed_at"),
	setupData: jsonb("setup_data"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// OAuth Provider tables (Better Auth OAuth 2.1 Provider Plugin)
export const oauthClient = pgTable("oauth_client", {
	id: text("id").primaryKey(),
	clientId: text("client_id").notNull().unique(),
	clientSecret: text("client_secret"),
	disabled: boolean("disabled").default(false),
	skipConsent: boolean("skip_consent").default(false),
	enableEndSession: boolean("enable_end_session").default(false),
	scopes: jsonText("scopes"), // JSON array auto-parsed
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	name: text("name"),
	uri: text("uri"),
	icon: text("icon"),
	contacts: jsonText("contacts"), // JSON array auto-parsed
	tos: text("tos"),
	policy: text("policy"),
	softwareId: text("software_id"),
	softwareVersion: text("software_version"),
	softwareStatement: text("software_statement"),
	redirectUris: jsonText("redirect_uris").notNull(), // JSON array auto-parsed
	tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
	grantTypes: jsonText("grant_types"), // JSON array auto-parsed
	responseTypes: jsonText("response_types"), // JSON array auto-parsed
	public: boolean("public").default(false),
	type: text("type"),
	metadata: jsonb("metadata"),
});

export const oauthRefreshToken = pgTable("oauth_refresh_token", {
	id: text("id").primaryKey(),
	token: text("token").notNull(),
	clientId: text("client_id").notNull().references(() => oauthClient.clientId, { onDelete: "cascade" }),
	sessionId: text("session_id").references(() => session.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	scopes: jsonText("scopes").notNull(), // JSON array auto-parsed
	revoked: timestamp("revoked"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	expiresAt: timestamp("expires_at").notNull(),
});

export const oauthAccessToken = pgTable("oauth_access_token", {
	id: text("id").primaryKey(),
	token: text("token").notNull(),
	clientId: text("client_id").notNull().references(() => oauthClient.clientId, { onDelete: "cascade" }),
	sessionId: text("session_id").references(() => session.id, { onDelete: "cascade" }),
	refreshId: text("refresh_id").references(() => oauthRefreshToken.id, { onDelete: "cascade" }),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	scopes: jsonText("scopes").notNull(), // JSON array auto-parsed
	createdAt: timestamp("created_at").notNull().defaultNow(),
	expiresAt: timestamp("expires_at").notNull(),
});

export const oauthConsent = pgTable("oauth_consent", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	clientId: text("client_id").notNull().references(() => oauthClient.clientId, { onDelete: "cascade" }),
	referenceId: text("reference_id"),
	scopes: jsonText("scopes").notNull(), // JSON array auto-parsed
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// JWT plugin table (required by OAuth Provider)
export const jwks = pgTable("jwks", {
	id: text("id").primaryKey(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Legacy aliases for backward compatibility (if needed elsewhere in the codebase)
export const users = user;
export const sessions = session;
export const accounts = account;
export const verificationTokens = verification;
