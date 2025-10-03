import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db/database';
import { subtasks, type Subtask, type NewSubtask } from '../db/schema';
import { BaseRepository } from './base';

export class SubtaskRepository extends BaseRepository<Subtask, NewSubtask> {
  protected tableName = 'subtasks';
  protected table = subtasks;

  // Get subtasks by task ID
  public async getByTaskId(taskId: string): Promise<Subtask[]> {
    try {
      return await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.taskId, taskId))
        .orderBy(asc(subtasks.order), asc(subtasks.createdAt));
    } catch (error) {
      console.error('Failed to get subtasks by task ID:', error);
      return [];
    }
  }

  // Create subtask with automatic ordering
  public async createSubtask(data: Omit<NewSubtask, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'order'>): Promise<Subtask> {
    try {
      // Get the next order number for this task
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`MAX("order")` })
        .from(subtasks)
        .where(eq(subtasks.taskId, data.taskId));

      const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

      return await this.create({
        ...data,
        order: nextOrder,
      });
    } catch (error) {
      console.error('Failed to create subtask:', error);
      throw error;
    }
  }

  // Toggle subtask completion
  public async toggleCompletion(id: string): Promise<Subtask | null> {
    try {
      const subtask = await this.getById(id);
      if (!subtask) return null;

      return await this.update(id, {
        completed: !subtask.completed,
      });
    } catch (error) {
      console.error('Failed to toggle subtask completion:', error);
      return null;
    }
  }

  // Reorder subtasks
  public async reorderSubtasks(taskId: string, subtaskIds: string[]): Promise<boolean> {
    try {
      // Update each subtask with its new order
      const updatePromises = subtaskIds.map((subtaskId, index) =>
        this.update(subtaskId, { order: index + 1 })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Failed to reorder subtasks:', error);
      return false;
    }
  }

  // Move subtask up in order
  public async moveUp(id: string): Promise<boolean> {
    try {
      const subtask = await this.getById(id);
      if (!subtask || subtask.order <= 1) return false;

      // Find the subtask with the previous order
      const previousSubtasks = await db
        .select()
        .from(subtasks)
        .where(
          and(
            eq(subtasks.taskId, subtask.taskId),
            eq(subtasks.order, subtask.order - 1)
          )
        )
        .limit(1);

      if (previousSubtasks.length === 0) return false;

      const previousSubtask = previousSubtasks[0];

      // Swap orders
      await Promise.all([
        this.update(subtask.id, { order: previousSubtask.order }),
        this.update(previousSubtask.id, { order: subtask.order }),
      ]);

      return true;
    } catch (error) {
      console.error('Failed to move subtask up:', error);
      return false;
    }
  }

  // Move subtask down in order
  public async moveDown(id: string): Promise<boolean> {
    try {
      const subtask = await this.getById(id);
      if (!subtask) return false;

      // Find the subtask with the next order
      const nextSubtasks = await db
        .select()
        .from(subtasks)
        .where(
          and(
            eq(subtasks.taskId, subtask.taskId),
            eq(subtasks.order, subtask.order + 1)
          )
        )
        .limit(1);

      if (nextSubtasks.length === 0) return false;

      const nextSubtask = nextSubtasks[0];

      // Swap orders
      await Promise.all([
        this.update(subtask.id, { order: nextSubtask.order }),
        this.update(nextSubtask.id, { order: subtask.order }),
      ]);

      return true;
    } catch (error) {
      console.error('Failed to move subtask down:', error);
      return false;
    }
  }

  // Get subtask completion statistics for a task
  public async getTaskCompletionStats(taskId: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    try {
      const taskSubtasks = await this.getByTaskId(taskId);
      const total = taskSubtasks.length;
      const completed = taskSubtasks.filter(st => st.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, percentage };
    } catch (error) {
      console.error('Failed to get task completion stats:', error);
      return { total: 0, completed: 0, percentage: 0 };
    }
  }

  // Bulk toggle completion for multiple subtasks
  public async bulkToggleCompletion(ids: string[], completed: boolean): Promise<number> {
    try {
      let updatedCount = 0;

      // Update each subtask individually (since Drizzle doesn't support IN operator directly)
      for (const id of ids) {
        const result = await this.update(id, { completed });
        if (result) updatedCount++;
      }

      return updatedCount;
    } catch (error) {
      console.error('Failed to bulk toggle subtask completion:', error);
      return 0;
    }
  }

  // Delete all subtasks for a task
  public async deleteByTaskId(taskId: string): Promise<number> {
    try {
      const taskSubtasks = await this.getByTaskId(taskId);
      let deletedCount = 0;

      for (const subtask of taskSubtasks) {
        const success = await this.delete(subtask.id);
        if (success) deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to delete subtasks by task ID:', error);
      return 0;
    }
  }

  // Get all completed subtasks
  public async getCompleted(): Promise<Subtask[]> {
    try {
      return await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.completed, true))
        .orderBy(desc(subtasks.updatedAt));
    } catch (error) {
      console.error('Failed to get completed subtasks:', error);
      return [];
    }
  }

  // Get all pending subtasks
  public async getPending(): Promise<Subtask[]> {
    try {
      return await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.completed, false))
        .orderBy(asc(subtasks.order), asc(subtasks.createdAt));
    } catch (error) {
      console.error('Failed to get pending subtasks:', error);
      return [];
    }
  }

  // Get subtask statistics
  public async getStatistics(): Promise<{
    total: number;
    completed: number;
    pending: number;
    completionPercentage: number;
    averageSubtasksPerTask: number;
  }> {
    try {
      const allSubtasks = await this.getAll();
      const total = allSubtasks.length;
      const completed = allSubtasks.filter(st => st.completed).length;
      const pending = total - completed;
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate average subtasks per task
      const uniqueTaskIds = [...new Set(allSubtasks.map(st => st.taskId))];
      const averageSubtasksPerTask = uniqueTaskIds.length > 0 
        ? Math.round((total / uniqueTaskIds.length) * 100) / 100 
        : 0;

      return {
        total,
        completed,
        pending,
        completionPercentage,
        averageSubtasksPerTask,
      };
    } catch (error) {
      console.error('Failed to get subtask statistics:', error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        completionPercentage: 0,
        averageSubtasksPerTask: 0,
      };
    }
  }
}

// Export singleton instance
export const subtaskRepository = new SubtaskRepository();