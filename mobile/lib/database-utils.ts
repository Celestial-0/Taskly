/**
 * Database utility functions for troubleshooting and maintenance
 */

import database from '@/db/database';

export async function resetDatabase(): Promise<boolean> {
  try {
    console.log('Resetting database...');
    
    const sqliteDb = database.getSqliteDb();
    
    // Drop all tables
    const tables = ['sync_metadata', 'time_sessions', 'subtasks', 'tasks', 'categories'];
    
    for (const table of tables) {
      try {
        sqliteDb.execSync(`DROP TABLE IF EXISTS ${table};`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.warn(`Failed to drop table ${table}:`, error);
      }
    }
    
    // Reinitialize database
    await database.ensureInitialized();
    
    console.log('Database reset completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to reset database:', error);
    return false;
  }
}

export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  tables: string[];
  error?: string;
}> {
  try {
    const sqliteDb = database.getSqliteDb();
    
    // Check if database is accessible
    const testResult = sqliteDb.getFirstSync('SELECT 1 as test') as { test: number } | null;
    if (!testResult || testResult.test !== 1) {
      return {
        isHealthy: false,
        tables: [],
        error: 'Database connection test failed'
      };
    }
    
    // Get list of tables
    const tablesResult = sqliteDb.getAllSync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `) as Array<{ name: string }>;
    
    const tables = tablesResult.map(row => row.name);
    
    return {
      isHealthy: true,
      tables,
    };
  } catch (error) {
    return {
      isHealthy: false,
      tables: [],
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

export async function getDatabaseInfo(): Promise<{
  version: string;
  pageSize: number;
  encoding: string;
  journalMode: string;
}> {
  try {
    const sqliteDb = database.getSqliteDb();
    
    const versionResult = sqliteDb.getFirstSync('SELECT sqlite_version() as version') as { version: string } | null;
    const pageSizeResult = sqliteDb.getFirstSync('PRAGMA page_size') as { page_size: number } | null;
    const encodingResult = sqliteDb.getFirstSync('PRAGMA encoding') as { encoding: string } | null;
    const journalModeResult = sqliteDb.getFirstSync('PRAGMA journal_mode') as { journal_mode: string } | null;
    
    const version = versionResult?.version || 'unknown';
    const pageSize = pageSizeResult?.page_size || 0;
    const encoding = encodingResult?.encoding || 'unknown';
    const journalMode = journalModeResult?.journal_mode || 'unknown';
    
    return {
      version,
      pageSize,
      encoding,
      journalMode,
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {
      version: 'unknown',
      pageSize: 0,
      encoding: 'unknown',
      journalMode: 'unknown',
    };
  }
}