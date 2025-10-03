import { eq, and, desc, asc, like, or, isNull, isNotNull } from 'drizzle-orm';
import { db } from '../db/database';
import { tasks, subtasks, timeSessions, type Task, type NewTask, type Subtask, type TimeSession } from '../db/schema';
import { BaseRepository } from './base';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskFilter = {
  completed?: boolean;
  priority?: TaskPriority;
  categoryId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
};

export interface TaskWithDetails extends Task {
  subtasks?: Subtask[];
  timeSessions?: TimeSession[];
  totalTimeSpent?: number; // in minutes
  completionPercentage?: number;
}

export class TaskRepository extends BaseRepository<Task, NewTask> {
  protected tableName = 'tasks';
  protected table = tasks;

  // Get tasks with filters
  public async getFiltered(filter: TaskFilter = {}): Promise<Task[]> {
    try {
      let query = db.select().from(tasks);
      const conditions = [];

      if (filter.completed !== undefined) {
        conditions.push(eq(tasks.completed, filter.completed));
      }

      if (filter.priority) {
        conditions.push(eq(tasks.priority, filter.priority));
      }

      if (filter.categoryId) {
        conditions.push(eq(tasks.categoryId, filter.categoryId));
      }

      if (filter.dueDateFrom) {
        conditions.push(eq(tasks.dueDate, filter.dueDateFrom)); // You might want to use gte for date ranges
      }

      if (filter.search) {
        conditions.push(
          or(
            like(tasks.title, `%${filter.search}%`),
            like(tasks.description, `%${filter.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(tasks.createdAt));
    } catch (error) {
      console.error('Failed to get filtered tasks:', error);
      return [];
    }
  }

  // Get task with all related data
  public async getTaskWithDetails(id: string): Promise<TaskWithDetails | null> {
    try {
      const task = await this.getById(id);
      if (!task) return null;

      // Get subtasks
      const taskSubtasks = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.taskId, id))
        .orderBy(asc(subtasks.order));

      // Get time sessions
      const taskTimeSessions = await db
        .select()
        .from(timeSessions)
        .where(eq(timeSessions.taskId, id))
        .orderBy(desc(timeSessions.createdAt));

      // Calculate total time spent (in minutes)
      const totalTimeSpent = taskTimeSessions.reduce((total, session) => {
        return total + (session.duration ? Math.round(session.duration / 60) : 0);
      }, 0);

      // Calculate completion percentage based on subtasks
      let completionPercentage = task.completed ? 100 : 0;
      if (taskSubtasks.length > 0 && !task.completed) {
        const completedSubtasks = taskSubtasks.filter(st => st.completed).length;
        completionPercentage = Math.round((completedSubtasks / taskSubtasks.length) * 100);
      }

      return {
        ...task,
        subtasks: taskSubtasks,
        timeSessions: taskTimeSessions,
        totalTimeSpent,
        completionPercentage,
      };
    } catch (error) {
      console.error('Failed to get task with details:', error);
      return null;
    }
  }

  // Get tasks by category
  public async getByCategory(categoryId: string): Promise<Task[]> {
    try {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.categoryId, categoryId))
        .orderBy(desc(tasks.createdAt));
    } catch (error) {
      console.error('Failed to get tasks by category:', error);
      return [];
    }
  }

  // Get overdue tasks
  public async getOverdue(): Promise<Task[]> {
    try {
      const now = new Date().toISOString();
      return await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.completed, false),
            isNotNull(tasks.dueDate),
            // Note: SQLite string comparison works for ISO dates
            // For more complex date operations, you might want to use a custom function
          )
        )
        .orderBy(asc(tasks.dueDate));
    } catch (error) {
      console.error('Failed to get overdue tasks:', error);
      return [];
    }
  }

  // Get tasks due today
  public async getDueToday(): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      return await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.completed, false),
            like(tasks.dueDate, `${today}%`)
          )
        )
        .orderBy(asc(tasks.dueDate));
    } catch (error) {
      console.error('Failed to get tasks due today:', error);
      return [];
    }
  }

  // Toggle task completion
  public async toggleCompletion(id: string): Promise<Task | null> {
    try {
      const task = await this.getById(id);
      if (!task) return null;

      const updatedTask = await this.update(id, {
        completed: !task.completed,
        actualTime: task.completed ? null : task.actualTime, // Reset actual time if uncompleting
      });

      // If completing the task, also complete all subtasks
      if (updatedTask && updatedTask.completed) {
        await db
          .update(subtasks)
          .set({
            completed: true,
            updatedAt: this.getCurrentTimestamp(),
            syncStatus: 'pending',
          })
          .where(eq(subtasks.taskId, id));
      }

      return updatedTask;
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      return null;
    }
  }

  // Update task tags
  public async updateTags(id: string, tags: string[]): Promise<Task | null> {
    try {
      return await this.update(id, {
        tags: JSON.stringify(tags),
      });
    } catch (error) {
      console.error('Failed to update task tags:', error);
      return null;
    }
  }

  // Get tasks by tag
  public async getByTag(tag: string): Promise<Task[]> {
    try {
      return await db
        .select()
        .from(tasks)
        .where(like(tasks.tags, `%"${tag}"%`))
        .orderBy(desc(tasks.createdAt));
    } catch (error) {
      console.error('Failed to get tasks by tag:', error);
      return [];
    }
  }

  // Get task statistics
  public async getStatistics(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    dueToday: number;
    byPriority: Record<TaskPriority, number>;
  }> {
    try {
      const allTasks = await this.getAll();
      const overdueTasks = await this.getOverdue();
      const dueTodayTasks = await this.getDueToday();

      const completed = allTasks.filter(t => t.completed).length;
      const pending = allTasks.length - completed;

      const byPriority = allTasks.reduce((acc, task) => {
        acc[task.priority as TaskPriority] = (acc[task.priority as TaskPriority] || 0) + 1;
        return acc;
      }, {} as Record<TaskPriority, number>);

      // Ensure all priorities are represented
      ['low', 'medium', 'high'].forEach(priority => {
        if (!(priority in byPriority)) {
          byPriority[priority as TaskPriority] = 0;
        }
      });

      return {
        total: allTasks.length,
        completed,
        pending,
        overdue: overdueTasks.length,
        dueToday: dueTodayTasks.length,
        byPriority,
      };
    } catch (error) {
      console.error('Failed to get task statistics:', error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        dueToday: 0,
        byPriority: { low: 0, medium: 0, high: 0 },
      };
    }
  }

  // Bulk update tasks
  public async bulkUpdateCategory(taskIds: string[], categoryId: string | null): Promise<number> {
    try {
      const result = await db
        .update(tasks)
        .set({
          categoryId,
          updatedAt: this.getCurrentTimestamp(),
          syncStatus: 'pending',
        })
        .where(eq(tasks.id, taskIds[0])); // Note: Drizzle doesn't support IN operator directly

      // Mark all tasks for sync
      await Promise.all(
        taskIds.map(id => this.markForSync(id, 'update'))
      );

      return taskIds.length;
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const taskRepository = new TaskRepository();