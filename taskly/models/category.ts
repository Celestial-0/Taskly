import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/database';
import { categories, tasks, type Category, type NewCategory } from '../db/schema';
import { BaseRepository } from './base';

export interface CategoryWithStats extends Category {
  taskCount: number;
  completedTaskCount: number;
  completionPercentage: number;
}

export class CategoryRepository extends BaseRepository<Category, NewCategory> {
  protected tableName = 'categories';
  protected table = categories;

  // Get category with task statistics
  public async getCategoryWithStats(id: string): Promise<CategoryWithStats | null> {
    try {
      const category = await this.getById(id);
      if (!category) return null;

      // Get task counts
      const taskStats = await db
        .select({
          total: sql<number>`COUNT(*)`,
          completed: sql<number>`SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END)`,
        })
        .from(tasks)
        .where(eq(tasks.categoryId, id));

      const stats = taskStats[0];
      const taskCount = stats?.total || 0;
      const completedTaskCount = stats?.completed || 0;
      const completionPercentage = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

      return {
        ...category,
        taskCount,
        completedTaskCount,
        completionPercentage,
      };
    } catch (error) {
      console.error('Failed to get category with stats:', error);
      return null;
    }
  }

  // Get all categories with statistics
  public async getAllWithStats(): Promise<CategoryWithStats[]> {
    try {
      const allCategories = await this.getAll();
      
      const categoriesWithStats = await Promise.all(
        allCategories.map(async (category) => {
          const stats = await this.getCategoryWithStats(category.id);
          return stats || {
            ...category,
            taskCount: 0,
            completedTaskCount: 0,
            completionPercentage: 0,
          };
        })
      );

      return categoriesWithStats;
    } catch (error) {
      console.error('Failed to get categories with stats:', error);
      return [];
    }
  }

  // Get category by name
  public async getByName(name: string): Promise<Category | null> {
    try {
      const results = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error('Failed to get category by name:', error);
      return null;
    }
  }

  // Check if category name exists (for validation)
  public async nameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, name));

      if (excludeId) {
        // Add condition to exclude specific ID (for updates)
        const results = await query;
        return results.some(result => result.id !== excludeId);
      }

      const results = await query.limit(1);
      return results.length > 0;
    } catch (error) {
      console.error('Failed to check if category name exists:', error);
      return false;
    }
  }

  // Create category with validation
  public async createCategory(data: Omit<NewCategory, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Category> {
    // Check if name already exists
    const nameExists = await this.nameExists(data.name);
    if (nameExists) {
      throw new Error(`Category with name "${data.name}" already exists`);
    }

    return await this.create(data);
  }

  // Update category with validation
  public async updateCategory(id: string, data: Partial<Omit<NewCategory, 'id' | 'createdAt'>>): Promise<Category | null> {
    // Check if name already exists (excluding current category)
    if (data.name) {
      const nameExists = await this.nameExists(data.name, id);
      if (nameExists) {
        throw new Error(`Category with name "${data.name}" already exists`);
      }
    }

    return await this.update(id, data);
  }

  // Delete category and handle tasks
  public async deleteCategory(id: string, moveTasksToCategoryId?: string): Promise<boolean> {
    try {
      // First, handle tasks in this category
      if (moveTasksToCategoryId) {
        // Move tasks to another category
        await db
          .update(tasks)
          .set({
            categoryId: moveTasksToCategoryId,
            updatedAt: this.getCurrentTimestamp(),
            syncStatus: 'pending',
          })
          .where(eq(tasks.categoryId, id));
      } else {
        // Set tasks to have no category
        await db
          .update(tasks)
          .set({
            categoryId: null,
            updatedAt: this.getCurrentTimestamp(),
            syncStatus: 'pending',
          })
          .where(eq(tasks.categoryId, id));
      }

      // Now delete the category
      return await this.delete(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
      return false;
    }
  }

  // Get categories ordered by task count
  public async getByTaskCount(ascending: boolean = false): Promise<CategoryWithStats[]> {
    try {
      const categoriesWithStats = await this.getAllWithStats();
      
      return categoriesWithStats.sort((a, b) => {
        return ascending ? a.taskCount - b.taskCount : b.taskCount - a.taskCount;
      });
    } catch (error) {
      console.error('Failed to get categories by task count:', error);
      return [];
    }
  }

  // Get categories with no tasks
  public async getEmptyCategories(): Promise<Category[]> {
    try {
      const categoriesWithStats = await this.getAllWithStats();
      return categoriesWithStats
        .filter(category => category.taskCount === 0)
        .map(({ taskCount, completedTaskCount, completionPercentage, ...category }) => category);
    } catch (error) {
      console.error('Failed to get empty categories:', error);
      return [];
    }
  }

  // Get category statistics
  public async getStatistics(): Promise<{
    total: number;
    withTasks: number;
    empty: number;
    averageTasksPerCategory: number;
    mostUsedCategory: CategoryWithStats | null;
  }> {
    try {
      const categoriesWithStats = await this.getAllWithStats();
      const total = categoriesWithStats.length;
      const withTasks = categoriesWithStats.filter(c => c.taskCount > 0).length;
      const empty = total - withTasks;
      
      const totalTasks = categoriesWithStats.reduce((sum, c) => sum + c.taskCount, 0);
      const averageTasksPerCategory = total > 0 ? Math.round(totalTasks / total * 100) / 100 : 0;
      
      const mostUsedCategory = categoriesWithStats.reduce((max, current) => {
        return current.taskCount > (max?.taskCount || 0) ? current : max;
      }, null as CategoryWithStats | null);

      return {
        total,
        withTasks,
        empty,
        averageTasksPerCategory,
        mostUsedCategory,
      };
    } catch (error) {
      console.error('Failed to get category statistics:', error);
      return {
        total: 0,
        withTasks: 0,
        empty: 0,
        averageTasksPerCategory: 0,
        mostUsedCategory: null,
      };
    }
  }

  // Create default categories
  public async createDefaultCategories(): Promise<Category[]> {
    const defaultCategories = [
      { name: 'Work', color: '#3B82F6', icon: '💼' },
      { name: 'Personal', color: '#10B981', icon: '🏠' },
      { name: 'Health', color: '#F59E0B', icon: '🏃‍♂️' },
      { name: 'Learning', color: '#8B5CF6', icon: '📚' },
      { name: 'Shopping', color: '#EF4444', icon: '🛒' },
    ];

    const createdCategories: Category[] = [];

    for (const categoryData of defaultCategories) {
      try {
        // Check if category already exists
        const exists = await this.nameExists(categoryData.name);
        if (!exists) {
          const category = await this.create(categoryData);
          createdCategories.push(category);
        }
      } catch (error) {
        console.error(`Failed to create default category ${categoryData.name}:`, error);
      }
    }

    return createdCategories;
  }
}

// Export singleton instance
export const categoryRepository = new CategoryRepository();