import { create } from 'zustand';
import { Task, TaskInput } from './types';
import { taskRepository, categoryRepository } from '@/models';
import { enhancedCategorizeTask } from '@/services';
import { generateId } from './utils';

// Helper function to find or create category
const findOrCreateCategory = async (categoryName: string): Promise<string | null> => {
  if (!categoryName || categoryName.trim() === '') return null;
  
  try {
    // First try to find existing category (case-insensitive)
    const categories = await categoryRepository.getAll();
    const existing = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (existing) {
      return existing.id;
    }
    
    // Create new category if it doesn't exist
    const newCategory = await categoryRepository.create({
      name: categoryName.trim(),
      color: getRandomCategoryColor(),
    });
    
    return newCategory.id;
  } catch (error) {
    console.error('Failed to find or create category:', error);
    return null;
  }
};

// Generate random colors for new categories
const getRandomCategoryColor = (): string => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

type Store = {
  tasks: Task[];
  categories: Record<string, string>; // name -> id mapping
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskInput>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  
  // Getters
  getTasksByCategory: (category?: string) => Task[];
  getTasksByPriority: (priority: Task['priority']) => Task[];
  getAllCategories: () => string[]; // Get all unique categories from tasks
  getStats: () => {
    total: number;
    completed: number;
    active: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  
  // Database troubleshooting
  resetDatabase: () => Promise<boolean>;
  checkDatabaseHealth: () => Promise<{
    isHealthy: boolean;
    tables: string[];
    error?: string;
  }>;
  
  // Demo data
  addDemoData: () => Promise<{ success: boolean; message: string; tasksCreated: number }>;
  
  // Development utilities
  resetFirstLaunchStatus: () => Promise<void>;
};

const createTaskFromInput = async (input: TaskInput, existingCategories: string[] = []): Promise<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> => {
  // Use AI categorization if category/priority not provided
  let aiSuggestion: { category: string; priority: Task['priority']; confidence: number } = { 
    category: '', 
    priority: 'low', 
    confidence: 0 
  };
  
  if (!input.category || !input.priority) {
    try {
      aiSuggestion = await enhancedCategorizeTask(
        input.title, 
        input.description || '', 
        existingCategories
      );
    } catch (error) {
      console.error('AI categorization failed:', error);
    }
  }
  
  return {
    title: input.title,
    description: input.description,
    completed: false,
    category: input.category || aiSuggestion.category,
    priority: input.priority || aiSuggestion.priority,
  };
};

export const useStore = create<Store>((set, get) => ({
  tasks: [],
  categories: {},
  isLoading: false,
  error: null,

  loadCategories: async () => {
    try {
      const dbCategories = await categoryRepository.getAll();
      const categoryMap: Record<string, string> = {};
      
      dbCategories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
      
      set({ categories: categoryMap });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  loadTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Load categories first if not loaded
      const { categories } = get();
      if (Object.keys(categories).length === 0) {
        await get().loadCategories();
      }
      
      // Convert database tasks to store format
      const dbTasks = await taskRepository.getAll();
      const dbCategories = await categoryRepository.getAll();
      const categoryIdToName: Record<string, string> = {};
      
      console.log('Loaded tasks from database:', dbTasks.length);
      console.log('Loaded categories from database:', dbCategories.length);
      
      dbCategories.forEach(cat => {
        categoryIdToName[cat.id] = cat.name.toLowerCase();
      });
      
      const tasks: Task[] = dbTasks.map(dbTask => {
        // Use the actual category name from database, or undefined if no category
        const category = dbTask.categoryId && categoryIdToName[dbTask.categoryId] 
          ? categoryIdToName[dbTask.categoryId] 
          : undefined;
        
        // Ensure completed is a proper boolean
        const completed = Boolean(dbTask.completed);
        
        return {
          id: dbTask.id,
          title: dbTask.title,
          description: dbTask.description || undefined,
          completed,
          category,
          priority: dbTask.priority as Task['priority'],
          createdAt: new Date(dbTask.createdAt),
          updatedAt: new Date(dbTask.updatedAt),
        };
      });
      
      console.log('Converted tasks:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
      
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Set empty tasks array as fallback to prevent app crash
      set({ 
        tasks: [],
        error: error instanceof Error ? error.message : 'Failed to load tasks. Database may need to be reset.',
        isLoading: false 
      });
    }
  },

  addTask: async (input) => {
    try {
      set({ error: null });
      
      const { getAllCategories } = get();
      const existingCategories = getAllCategories();
      const taskData = await createTaskFromInput(input, existingCategories);
      
      // Find or create category in database
      const categoryId = await findOrCreateCategory(taskData.category || '');
      
      // Create in database
      const dbTask = await taskRepository.create({
        title: taskData.title,
        description: taskData.description,
        completed: taskData.completed,
        priority: taskData.priority,
        categoryId,
      });
      
      // Convert to store format and add to state
      const newTask: Task = {
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description || undefined,
        completed: dbTask.completed,
        category: taskData.category,
        priority: dbTask.priority as Task['priority'],
        createdAt: new Date(dbTask.createdAt),
        updatedAt: new Date(dbTask.updatedAt),
      };
      
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));
    } catch (error) {
      console.error('Failed to add task:', error);
      
      // Fallback: Add task to memory only if database fails
      const fallbackTask: Task = {
        id: generateId(),
        title: input.title,
        description: input.description,
        completed: false,
        category: input.category,
        priority: input.priority || 'low',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        tasks: [fallbackTask, ...state.tasks],
        error: 'Task added to memory only. Database connection issue.',
      }));
    }
  },

  updateTask: async (id, updates) => {
    try {
      set({ error: null });
      
      // Find or create category in database
      const categoryId = await findOrCreateCategory(updates.category || '');
      
      // Update in database
      const dbTask = await taskRepository.update(id, {
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        categoryId,
      });
      
      if (dbTask) {
        // Update in state
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { 
                  ...task, 
                  ...updates, 
                  updatedAt: new Date(dbTask.updatedAt) 
                }
              : task
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
    }
  },

  deleteTask: async (id) => {
    try {
      set({ error: null });
      
      // Delete from database
      const success = await taskRepository.delete(id);
      
      if (success) {
        // Remove from state
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
    }
  },

  toggleTask: async (id) => {
    try {
      set({ error: null });
      
      // Toggle in database
      const dbTask = await taskRepository.toggleCompletion(id);
      
      if (dbTask) {
        // Update in state
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { 
                  ...task, 
                  completed: dbTask.completed,
                  updatedAt: new Date(dbTask.updatedAt) 
                }
              : task
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle task' });
    }
  },

  clearCompleted: async () => {
    try {
      set({ error: null });
      
      const { tasks } = get();
      const completedTaskIds = tasks.filter(task => task.completed).map(task => task.id);
      
      // Delete completed tasks from database
      await Promise.all(
        completedTaskIds.map(id => taskRepository.delete(id))
      );
      
      // Remove from state
      set((state) => ({
        tasks: state.tasks.filter((task) => !task.completed),
      }));
    } catch (error) {
      console.error('Failed to clear completed tasks:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to clear completed tasks' });
    }
  },

  getTasksByCategory: (category) => {
    const { tasks } = get();
    return category ? tasks.filter((task) => task.category === category) : tasks;
  },

  getTasksByPriority: (priority) => {
    const { tasks } = get();
    return tasks.filter((task) => task.priority === priority);
  },

  getStats: () => {
    const { tasks } = get();
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      active: tasks.filter(t => !t.completed).length,
      byCategory: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
    };

    tasks.forEach(task => {
      const category = task.category || 'other';
      const priority = task.priority || 'low';
      
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    return stats;
  },

  getAllCategories: () => {
    const { tasks } = get();
    const categories = new Set<string>();
    
    tasks.forEach(task => {
      if (task.category && task.category.trim() !== '') {
        categories.add(task.category);
      }
    });
    
    return Array.from(categories).sort();
  },

  // Database troubleshooting methods
  resetDatabase: async () => {
    try {
      const { resetDatabase } = await import('@/lib/database-utils');
      const success = await resetDatabase();
      
      if (success) {
        // Clear store state
        set({ tasks: [], categories: {}, error: null });
        // Reload data
        await get().loadCategories();
        await get().loadTasks();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reset database:', error);
      set({ error: 'Failed to reset database' });
      return false;
    }
  },

  checkDatabaseHealth: async () => {
    try {
      const { checkDatabaseHealth } = await import('@/lib/database-utils');
      return await checkDatabaseHealth();
    } catch (error) {
      console.error('Failed to check database health:', error);
      return { isHealthy: false, tables: [], error: 'Health check failed' };
    }
  },

  addDemoData: async () => {
    try {
      const { seedDemoDataManually } = await import('@/lib/seed-data');
      const result = await seedDemoDataManually();
      
      if (result.success) {
        // Reload tasks to show the new demo data
        await get().loadTasks();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to add demo data:', error);
      return {
        success: false,
        message: 'Failed to add demo data. Please try again.',
        tasksCreated: 0,
      };
    }
  },

  resetFirstLaunchStatus: async () => {
    try {
      const { resetFirstLaunchStatus } = await import('@/lib/app-initialization');
      await resetFirstLaunchStatus();
      console.log('First launch status reset - app will show demo data on next restart');
    } catch (error) {
      console.error('Failed to reset first launch status:', error);
    }
  },
}));
