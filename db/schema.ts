import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const inquiries = sqliteTable('inquiries', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  kind: text('kind', { enum: ['contact', 'membership', 'event', 'event-registration'] }).notNull(),
  name: text('name').notNull(), email: text('email').notNull(), company: text('company').notNull(),
  interest: text('interest').notNull(), message: text('message').notNull(),
  consent: integer('consent', { mode: 'boolean' }).notNull(),
  payloadHash: text('payload_hash').notNull(),
  receivedAt: text('received_at').notNull(),
  status: text('status', { enum: ['new', 'reviewed', 'closed'] }).notNull().default('new')
}, table => [index('inquiries_received_idx').on(table.receivedAt)]);
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull()
}, table => [index('rate_limits_expiry_idx').on(table.expiresAt)]);
