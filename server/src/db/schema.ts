import { pgTable, serial, bigint, varchar, timestamp, uuid, integer, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: bigint('telegram_id', { mode: 'number' }).unique().notNull(),
  telegramChatId: bigint('telegram_chat_id', { mode: 'number' }),
  username: varchar('username', { length: 100 }),
  firstName: varchar('first_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const drafts = pgTable('drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  shortCode: varchar('short_code', { length: 8 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  creatorId: integer('creator_id').references(() => users.id),
  status: varchar('status', { length: 20 }).default('waiting').notNull(),
  maxManagers: integer('max_managers').default(4).notNull(),
  maxRounds: integer('max_rounds').default(18).notNull(),
  datasetId: varchar('dataset_id', { length: 50 }).default('fc-2026').notNull(),
  currentManagerIndex: integer('current_manager_index').default(0).notNull(),
  currentRound: integer('current_round').default(1).notNull(),
  isSnakeDirection: boolean('is_snake_direction').default(false).notNull(),
  lastPickAt: timestamp('last_pick_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const draftManagers = pgTable('draft_managers', {
  id: serial('id').primaryKey(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  slotIndex: integer('slot_index').notNull(),
  formation: varchar('formation', { length: 30 }).default('4-3-3 Attack'),
  fieldPositions: jsonb('field_positions'),
  benchPlayerIds: jsonb('bench_player_ids').default([]),
  lastSeenAt: timestamp('last_seen_at'),
});

export const picks = pgTable('picks', {
  id: serial('id').primaryKey(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  managerId: integer('manager_id').references(() => draftManagers.id).notNull(),
  playerId: integer('player_id').notNull(),
  round: integer('round').notNull(),
  pickOrder: integer('pick_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
