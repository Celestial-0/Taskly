import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('low').notNull(),
  dueDate: text('due_date'), // ISO string format
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  categoryId: text('category_id').references(() => categories.id),
  tags: text('tags'), // JSON string array
  estimatedTime: integer('estimated_time'), // minutes
  actualTime: integer('actual_time'), // minutes
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'conflict'] }).default('pending').notNull(),
  lastSyncAt: text('last_sync_at'),
});

// Categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'conflict'] }).default('pending').notNull(),
  lastSyncAt: text('last_sync_at'),
});

// Subtasks table
export const subtasks = sqliteTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'conflict'] }).default('pending').notNull(),
  lastSyncAt: text('last_sync_at'),
});

// Time tracking sessions
export const timeSessions = sqliteTable('time_sessions', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  startTime: text('start_time').notNull(), // ISO string
  endTime: text('end_time'), // ISO string, null if session is active
  duration: integer('duration'), // seconds, calculated when session ends
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'conflict'] }).default('pending').notNull(),
  lastSyncAt: text('last_sync_at'),
});

// Sync metadata for offline-first functionality
export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation', { enum: ['create', 'update', 'delete'] }).notNull(),
  data: text('data'), // JSON string of the record data
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  error: text('error'), // Error message if sync failed
});

// Export types for TypeScript
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
export type TimeSession = typeof timeSessions.$inferSelect;
export type NewTimeSession = typeof timeSessions.$inferInsert;
export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;