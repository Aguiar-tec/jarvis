import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// The primary key isolates users. Validated snapshots and optimistic versioning
// make multi-record changes atomic, including relationship cleanup on deletion.
export const workspaces = sqliteTable('jarvis_workspaces', {
  userId: text('user_id').primaryKey(),
  data: text('data').notNull(),
  version: integer('version').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable('jarvis_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull(),
  githubId: text('github_id').notNull(),
  login: text('login').notNull(),
  displayName: text('display_name').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('jarvis_sessions_expiry').on(table.expiresAt)]);

export const oauthFlows = sqliteTable('jarvis_oauth_flows', {
  stateHash: text('state_hash').primaryKey(),
  browserHash: text('browser_hash').notNull(),
  verifier: text('verifier').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('jarvis_oauth_flows_expiry').on(table.expiresAt)]);
