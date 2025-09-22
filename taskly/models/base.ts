import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db/database';
import database from '../db/database';
import { syncMetadata } from '../db/schema';
import { generateId } from '../lib/utils';

export type SyncStatus = 'synced' | 'pending' | 'conflict';
export type SyncOperation = 'create' | 'update' | 'delete';

export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncAt?: string | null;
}

export abstract class BaseRepository<T extends BaseModel, TInsert> {
  protected abstract tableName: string;
  protected abstract table: any;

  // Generate unique ID
  protected generateId(): string {
    return generateId();
  }

  // Get current timestamp
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Mark record for sync
  protected async markForSync(
    recordId: string,
    operation: SyncOperation,
    data?: any
  ): Promise<void> {
    try {
      await db.insert(syncMetadata).values({
        id: this.generateId(),
        tableName: this.tableName,
        recordId,
        operation,
        data: data ? JSON.stringify(data) : null,
        timestamp: this.getCurrentTimestamp(),
        retryCount: 0,
      });
    } catch (error) {
      console.error(`Failed to mark ${this.tableName} record for sync:`, error);
    }
  }

  // Update sync status
  public async updateSyncStatus(
    recordId: string,
    status: SyncStatus,
    lastSyncAt?: string
  ): Promise<void> {
    try {
      await db
        .update(this.table)
        .set({
          syncStatus: status,
          lastSyncAt: lastSyncAt || this.getCurrentTimestamp(),
          updatedAt: this.getCurrentTimestamp(),
        })
        .where(eq(this.table.id, recordId));
    } catch (error) {
      console.error(`Failed to update sync status for ${this.tableName}:`, error);
    }
  }

  // Get all records
  public async getAll(): Promise<T[]> {
    try {
      // Ensure database is initialized
      const isReady = await database.ensureInitialized();
      if (!isReady) {
        console.error(`Database not ready for ${this.tableName} operations`);
        return [];
      }
      
      return await db.select().from(this.table).orderBy(desc(this.table.createdAt));
    } catch (error) {
      console.error(`Failed to get all ${this.tableName} records:`, error);
      return [];
    }
  }

  // Get record by ID
  public async getById(id: string): Promise<T | null> {
    try {
      const results = await db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error(`Failed to get ${this.tableName} record by ID:`, error);
      return null;
    }
  }

  // Create new record
  public async create(data: Omit<TInsert, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<T> {
    const id = this.generateId();
    const timestamp = this.getCurrentTimestamp();
    
    const newRecord = {
      ...data,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'pending' as SyncStatus,
    } as TInsert;

    try {
      // Ensure database is initialized
      const isReady = await database.ensureInitialized();
      if (!isReady) {
        throw new Error(`Database not ready for ${this.tableName} operations`);
      }
      
      await db.insert(this.table).values(newRecord);
      await this.markForSync(id, 'create', newRecord);
      
      const created = await this.getById(id);
      if (!created) {
        throw new Error(`Failed to retrieve created ${this.tableName} record`);
      }
      
      return created;
    } catch (error) {
      console.error(`Failed to create ${this.tableName} record:`, error);
      throw error;
    }
  }

  // Update record
  public async update(id: string, data: Partial<Omit<TInsert, 'id' | 'createdAt'>>): Promise<T | null> {
    const timestamp = this.getCurrentTimestamp();
    
    const updateData = {
      ...data,
      updatedAt: timestamp,
      syncStatus: 'pending' as SyncStatus,
    };

    try {
      await db
        .update(this.table)
        .set(updateData)
        .where(eq(this.table.id, id));
      
      const updated = await this.getById(id);
      if (updated) {
        await this.markForSync(id, 'update', updated);
      }
      
      return updated;
    } catch (error) {
      console.error(`Failed to update ${this.tableName} record:`, error);
      throw error;
    }
  }

  // Delete record
  public async delete(id: string): Promise<boolean> {
    try {
      const record = await this.getById(id);
      if (!record) {
        return false;
      }

      await db.delete(this.table).where(eq(this.table.id, id));
      await this.markForSync(id, 'delete', record);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete ${this.tableName} record:`, error);
      return false;
    }
  }

  // Get records pending sync
  public async getPendingSync(): Promise<T[]> {
    try {
      return await db
        .select()
        .from(this.table)
        .where(eq(this.table.syncStatus, 'pending'))
        .orderBy(asc(this.table.updatedAt));
    } catch (error) {
      console.error(`Failed to get pending sync ${this.tableName} records:`, error);
      return [];
    }
  }

  // Get records with conflicts
  public async getConflicts(): Promise<T[]> {
    try {
      return await db
        .select()
        .from(this.table)
        .where(eq(this.table.syncStatus, 'conflict'))
        .orderBy(desc(this.table.updatedAt));
    } catch (error) {
      console.error(`Failed to get conflict ${this.tableName} records:`, error);
      return [];
    }
  }

  // Batch operations for sync
  public async batchCreate(records: Omit<TInsert, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>[]): Promise<T[]> {
    const timestamp = this.getCurrentTimestamp();
    const newRecords = records.map(record => ({
      ...record,
      id: this.generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'synced' as SyncStatus,
      lastSyncAt: timestamp,
    })) as TInsert[];

    try {
      await db.insert(this.table).values(newRecords);
      
      const created = await Promise.all(
        newRecords.map(record => this.getById((record as any).id))
      );
      
      return created.filter(Boolean) as T[];
    } catch (error) {
      console.error(`Failed to batch create ${this.tableName} records:`, error);
      throw error;
    }
  }
}