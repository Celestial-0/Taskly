import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/database';
import { syncMetadata, type SyncMetadata } from '../db/schema';
import { taskRepository } from '../models/task';
import { categoryRepository } from '../models/category';
import { subtaskRepository } from '../models/subtask';
import { timeSessionRepository } from '../models/time-session';

export type SyncStatus = 'idle' | 'syncing' | 'error';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface SyncProgress {
  status: SyncStatus;
  progress: number; // 0-100
  message: string;
  totalItems: number;
  processedItems: number;
}

class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private syncListeners: ((progress: SyncProgress) => void)[] = [];

  private constructor() { }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Add sync progress listener
  public addSyncListener(listener: (progress: SyncProgress) => void): () => void {
    this.syncListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of sync progress
  private notifyListeners(progress: SyncProgress): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // Check if sync is currently in progress
  public isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Get pending sync items count
  public async getPendingSyncCount(): Promise<number> {
    try {
      const pendingItems = await db
        .select()
        .from(syncMetadata)
        .orderBy(desc(syncMetadata.timestamp));

      return pendingItems.length;
    } catch (error) {
      console.error('Failed to get pending sync count:', error);
      return 0;
    }
  }

  // Get all pending sync items
  public async getPendingSyncItems(): Promise<SyncMetadata[]> {
    try {
      return await db
        .select()
        .from(syncMetadata)
        .orderBy(desc(syncMetadata.timestamp));
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      return [];
    }
  }

  // Perform full sync
  public async performSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync is already in progress');
    }

    this.syncInProgress = true;
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      this.notifyListeners({
        status: 'syncing',
        progress: 0,
        message: 'Starting sync...',
        totalItems: 0,
        processedItems: 0,
      });

      // Get all pending sync items
      const pendingItems = await this.getPendingSyncItems();
      const totalItems = pendingItems.length;

      if (totalItems === 0) {
        this.notifyListeners({
          status: 'idle',
          progress: 100,
          message: 'No items to sync',
          totalItems: 0,
          processedItems: 0,
        });

        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      this.notifyListeners({
        status: 'syncing',
        progress: 0,
        message: `Syncing ${totalItems} items...`,
        totalItems,
        processedItems: 0,
      });

      // Process each sync item
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];

        try {
          await this.processSyncItem(item);
          syncedCount++;

          // Remove successfully synced item
          await db.delete(syncMetadata).where(eq(syncMetadata.id, item.id));
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to sync ${item.tableName} ${item.recordId}: ${errorMessage}`);

          // Update retry count and error message
          await db
            .update(syncMetadata)
            .set({
              retryCount: item.retryCount + 1,
              error: errorMessage,
            })
            .where(eq(syncMetadata.id, item.id));
        }

        // Update progress
        const progress = Math.round(((i + 1) / totalItems) * 100);
        this.notifyListeners({
          status: 'syncing',
          progress,
          message: `Synced ${syncedCount} of ${totalItems} items...`,
          totalItems,
          processedItems: i + 1,
        });
      }

      const success = failedCount === 0;
      const finalMessage = success
        ? `Successfully synced ${syncedCount} items`
        : `Synced ${syncedCount} items, ${failedCount} failed`;

      this.notifyListeners({
        status: success ? 'idle' : 'error',
        progress: 100,
        message: finalMessage,
        totalItems,
        processedItems: totalItems,
      });

      return {
        success,
        syncedCount,
        failedCount,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      errors.push(errorMessage);

      this.notifyListeners({
        status: 'error',
        progress: 0,
        message: `Sync failed: ${errorMessage}`,
        totalItems: 0,
        processedItems: 0,
      });

      return {
        success: false,
        syncedCount,
        failedCount: failedCount + 1,
        errors,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncMetadata): Promise<void> {
    // In a real app, this would make API calls to sync with a server
    // For now, we'll just simulate the sync process and mark items as synced

    console.log(`Processing sync item: ${item.tableName} ${item.recordId} (${item.operation})`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the record's sync status based on the table
    switch (item.tableName) {
      case 'tasks':
        await taskRepository.updateSyncStatus(item.recordId, 'synced');
        break;
      case 'categories':
        await categoryRepository.updateSyncStatus(item.recordId, 'synced');
        break;
      case 'subtasks':
        await subtaskRepository.updateSyncStatus(item.recordId, 'synced');
        break;
      case 'time_sessions':
        await timeSessionRepository.updateSyncStatus(item.recordId, 'synced');
        break;
      default:
        throw new Error(`Unknown table: ${item.tableName}`);
    }
  }

  // Force sync for specific record
  public async forceSyncRecord(tableName: string, recordId: string): Promise<boolean> {
    try {
      // Find the sync metadata for this record
      const syncItems = await db
        .select()
        .from(syncMetadata)
        .where(
          and(
            eq(syncMetadata.tableName, tableName),
            eq(syncMetadata.recordId, recordId)
          )
        );

      if (syncItems.length === 0) {
        console.warn(`No sync metadata found for ${tableName} ${recordId}`);
        return false;
      }

      // Process each sync item for this record
      for (const item of syncItems) {
        await this.processSyncItem(item);
        await db.delete(syncMetadata).where(eq(syncMetadata.id, item.id));
      }

      return true;
    } catch (error) {
      console.error(`Failed to force sync ${tableName} ${recordId}:`, error);
      return false;
    }
  }

  // Clear all sync metadata (use with caution)
  public async clearSyncMetadata(): Promise<number> {
    try {
      const allItems = await this.getPendingSyncItems();
      await db.delete(syncMetadata);
      return allItems.length;
    } catch (error) {
      console.error('Failed to clear sync metadata:', error);
      return 0;
    }
  }

  // Get sync statistics
  public async getSyncStatistics(): Promise<{
    pendingCount: number;
    failedCount: number;
    oldestPendingItem: SyncMetadata | null;
    mostRetriedItem: SyncMetadata | null;
  }> {
    try {
      const pendingItems = await this.getPendingSyncItems();
      const pendingCount = pendingItems.length;
      const failedCount = pendingItems.filter(item => item.error).length;

      const oldestPendingItem = pendingItems.length > 0
        ? pendingItems.reduce((oldest, current) =>
          new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
        )
        : null;

      const mostRetriedItem = pendingItems.length > 0
        ? pendingItems.reduce((mostRetried, current) =>
          current.retryCount > mostRetried.retryCount ? current : mostRetried
        )
        : null;

      return {
        pendingCount,
        failedCount,
        oldestPendingItem,
        mostRetriedItem,
      };
    } catch (error) {
      console.error('Failed to get sync statistics:', error);
      return {
        pendingCount: 0,
        failedCount: 0,
        oldestPendingItem: null,
        mostRetriedItem: null,
      };
    }
  }

  // Auto-sync functionality (call this periodically)
  public async autoSync(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    try {
      const pendingCount = await this.getPendingSyncCount();
      if (pendingCount > 0) {
        console.log(`Auto-sync: ${pendingCount} items pending`);
        await this.performSync();
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  // Check network connectivity (implement based on your needs)
  public async checkConnectivity(): Promise<boolean> {
    try {
      // In a real app, you might ping your server or check network status
      // For now, we'll assume we're always connected
      return true;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
export default syncService;