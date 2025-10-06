import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';

// Database configuration
const DATABASE_NAME = 'taskly.db';
const DATABASE_VERSION = 1;

class Database {
  private static instance: Database;
  private db: ReturnType<typeof drizzle>;
  private sqliteDb: ReturnType<typeof openDatabaseSync>;

  private constructor() {
    // Open SQLite database
    this.sqliteDb = openDatabaseSync(DATABASE_NAME);

    // Initialize Drizzle ORM
    this.db = drizzle(this.sqliteDb, { schema });

    // Run migrations on initialization
    this.initializeDatabase();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async initializeDatabase() {
    try {
      // Enable foreign keys
      this.sqliteDb.execSync('PRAGMA foreign_keys = ON;');

      // Enable WAL mode for better performance
      this.sqliteDb.execSync('PRAGMA journal_mode = WAL;');

      // Run migrations
      await this.runMigrations();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw error to prevent app crash, just log it
      console.error('Database will continue with limited functionality');
    }
  }

  private async runMigrations() {
    try {
      // Create tables if they don't exist
      this.sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          icon TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          sync_status TEXT DEFAULT 'pending' NOT NULL,
          last_sync_at TEXT
        );
      `);

      this.sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          completed INTEGER DEFAULT 0 NOT NULL,
          priority TEXT DEFAULT 'low' NOT NULL,
          due_date TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          category_id TEXT REFERENCES categories(id),
          tags TEXT,
          estimated_time INTEGER,
          actual_time INTEGER,
          sync_status TEXT DEFAULT 'pending' NOT NULL,
          last_sync_at TEXT
        );
      `);

      this.sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id TEXT PRIMARY KEY,
          task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          completed INTEGER DEFAULT 0 NOT NULL,
          "order" INTEGER DEFAULT 0 NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          sync_status TEXT DEFAULT 'pending' NOT NULL,
          last_sync_at TEXT
        );
      `);

      this.sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS time_sessions (
          id TEXT PRIMARY KEY,
          task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration INTEGER,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          sync_status TEXT DEFAULT 'pending' NOT NULL,
          last_sync_at TEXT
        );
      `);

      this.sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          retry_count INTEGER DEFAULT 0 NOT NULL,
          error TEXT
        );
      `);

      // Create indexes for better performance
      this.sqliteDb.execSync(`
        CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(sync_status);
        CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
        CREATE INDEX IF NOT EXISTS idx_time_sessions_task_id ON time_sessions(task_id);
        CREATE INDEX IF NOT EXISTS idx_sync_metadata_table_record ON sync_metadata(table_name, record_id);
      `);

      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  public getDb() {
    return this.db;
  }

  public getSqliteDb() {
    return this.sqliteDb;
  }

  // Ensure database is ready for operations
  public async ensureInitialized(): Promise<boolean> {
    try {
      // Test basic database operation
      const result = this.sqliteDb.getFirstSync('SELECT 1 as test') as { test: number } | null;
      return result?.test === 1;
    } catch (error) {
      console.error('Database not properly initialized:', error);
      // Try to reinitialize
      try {
        await this.initializeDatabase();
        return true;
      } catch (reinitError) {
        console.error('Failed to reinitialize database:', reinitError);
        return false;
      }
    }
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      const result = this.sqliteDb.getFirstSync('SELECT 1 as test') as { test: number } | null;
      return result?.test === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Close database connection
  public close() {
    try {
      this.sqliteDb.closeSync();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Export singleton instance
export const database = Database.getInstance();
export const db = database.getDb();
export default database;