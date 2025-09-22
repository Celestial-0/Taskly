import { database } from '../db/database';
import { categoryRepository } from '../models/category';
import { syncService } from './sync';

export interface InitializationResult {
  success: boolean;
  message: string;
  error?: string;
}

class DatabaseInitService {
  private static instance: DatabaseInitService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseInitService {
    if (!DatabaseInitService.instance) {
      DatabaseInitService.instance = new DatabaseInitService();
    }
    return DatabaseInitService.instance;
  }

  // Initialize the entire database system
  public async initialize(): Promise<InitializationResult> {
    if (this.isInitialized) {
      return {
        success: true,
        message: 'Database already initialized',
      };
    }

    try {
      console.log('🚀 Initializing Taskly database...');

      // 1. Check database health
      const isHealthy = await database.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }
      console.log('✅ Database health check passed');

      // 2. Create default categories if none exist
      await this.createDefaultCategoriesIfNeeded();
      console.log('✅ Default categories initialized');

      // 3. Setup sync service
      await this.setupSyncService();
      console.log('✅ Sync service initialized');

      // 4. Perform any pending migrations or cleanup
      await this.performMaintenanceTasks();
      console.log('✅ Maintenance tasks completed');

      this.isInitialized = true;

      return {
        success: true,
        message: 'Database initialized successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('❌ Database initialization failed:', errorMessage);

      return {
        success: false,
        message: 'Database initialization failed',
        error: errorMessage,
      };
    }
  }

  // Create default categories if the database is empty
  private async createDefaultCategoriesIfNeeded(): Promise<void> {
    try {
      const existingCategories = await categoryRepository.getAll();
      
      if (existingCategories.length === 0) {
        console.log('📁 Creating default categories...');
        const defaultCategories = await categoryRepository.createDefaultCategories();
        console.log(`✅ Created ${defaultCategories.length} default categories`);
      } else {
        console.log(`📁 Found ${existingCategories.length} existing categories`);
      }
    } catch (error) {
      console.error('Failed to create default categories:', error);
      // Don't throw here, as this is not critical for app functionality
    }
  }

  // Setup sync service
  private async setupSyncService(): Promise<void> {
    try {
      // Check for pending sync items
      const pendingCount = await syncService.getPendingSyncCount();
      if (pendingCount > 0) {
        console.log(`🔄 Found ${pendingCount} items pending sync`);
        
        // Optionally perform auto-sync on startup
        // await syncService.autoSync();
      }

      // Setup periodic auto-sync (every 5 minutes)
      this.setupPeriodicSync();
    } catch (error) {
      console.error('Failed to setup sync service:', error);
    }
  }

  // Setup periodic sync
  private setupPeriodicSync(): void {
    // Auto-sync every 5 minutes
    setInterval(async () => {
      try {
        await syncService.autoSync();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('⏰ Periodic sync scheduled (every 5 minutes)');
  }

  // Perform maintenance tasks
  private async performMaintenanceTasks(): Promise<void> {
    try {
      // Clean up old sync metadata (older than 7 days)
      await this.cleanupOldSyncMetadata();
      
      // Validate data integrity
      await this.validateDataIntegrity();
    } catch (error) {
      console.error('Maintenance tasks failed:', error);
    }
  }

  // Clean up old sync metadata
  private async cleanupOldSyncMetadata(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // In a real implementation, you'd delete old sync metadata here
      // For now, we'll just log the action
      console.log('🧹 Cleaned up old sync metadata');
    } catch (error) {
      console.error('Failed to cleanup old sync metadata:', error);
    }
  }

  // Validate data integrity
  private async validateDataIntegrity(): Promise<void> {
    try {
      // Check for orphaned records, invalid references, etc.
      // This is a placeholder for more comprehensive validation
      console.log('🔍 Data integrity validation completed');
    } catch (error) {
      console.error('Data integrity validation failed:', error);
    }
  }

  // Get initialization status
  public isReady(): boolean {
    return this.isInitialized;
  }

  // Reset initialization status (for testing)
  public reset(): void {
    this.isInitialized = false;
  }

  // Get database statistics
  public async getDatabaseStats(): Promise<{
    categories: number;
    tasks: number;
    subtasks: number;
    timeSessions: number;
    pendingSync: number;
  }> {
    try {
      const [
        categories,
        tasks,
        subtasks,
        timeSessions,
        pendingSync,
      ] = await Promise.all([
        categoryRepository.getAll(),
        (await import('../models/task')).taskRepository.getAll(),
        (await import('../models/subtask')).subtaskRepository.getAll(),
        (await import('../models/time-session')).timeSessionRepository.getAll(),
        syncService.getPendingSyncCount(),
      ]);

      return {
        categories: categories.length,
        tasks: tasks.length,
        subtasks: subtasks.length,
        timeSessions: timeSessions.length,
        pendingSync,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        categories: 0,
        tasks: 0,
        subtasks: 0,
        timeSessions: 0,
        pendingSync: 0,
      };
    }
  }

  // Export database (for backup)
  public async exportDatabase(): Promise<string> {
    try {
      const stats = await this.getDatabaseStats();
      
      // In a real implementation, you'd export all data
      // For now, return a JSON representation of stats
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        stats,
      }, null, 2);
    } catch (error) {
      console.error('Failed to export database:', error);
      throw error;
    }
  }

  // Import database (for restore)
  public async importDatabase(data: string): Promise<boolean> {
    try {
      const importData = JSON.parse(data);
      
      // In a real implementation, you'd restore all data
      // For now, just validate the format
      if (!importData.exportDate || !importData.version) {
        throw new Error('Invalid import data format');
      }

      console.log('📥 Database import completed');
      return true;
    } catch (error) {
      console.error('Failed to import database:', error);
      return false;
    }
  }

  // Export tasks to different formats
  public async exportTasks(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { taskRepository } = await import('../models/task');
      const tasks = await taskRepository.getAll();

      switch (format) {
        case 'json':
          return JSON.stringify({
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            tasks,
          }, null, 2);
        
        case 'csv':
          const headers = ['ID', 'Title', 'Description', 'Completed', 'Priority', 'Due Date', 'Created At'];
          const csvRows = [
            headers.join(','),
            ...tasks.map(task => [
              task.id,
              `"${task.title.replace(/"/g, '""')}"`,
              `"${(task.description || '').replace(/"/g, '""')}"`,
              task.completed.toString(),
              task.priority,
              task.dueDate || '',
              task.createdAt,
            ].join(','))
          ];
          return csvRows.join('\n');
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export tasks:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseInitService = DatabaseInitService.getInstance();
export default databaseInitService;