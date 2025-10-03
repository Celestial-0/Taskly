import { taskRepository, categoryRepository } from '@/models';
import { isFirstLaunch, markFirstLaunchCompleted } from './app-initialization';

export async function seedDatabase() {
  try {
    console.log('Checking if demo data should be seeded...');

    // Only seed on first launch
    const firstLaunch = await isFirstLaunch();
    if (!firstLaunch) {
      console.log('Not first launch, skipping demo data seeding');
      return;
    }

    console.log('First launch detected, seeding with demo data...');

    // Double-check if we already have data (safety check)
    const existingTasks = await taskRepository.getAll();
    if (existingTasks.length > 0) {
      console.log('Database already has data, marking first launch as completed');
      await markFirstLaunchCompleted();
      return;
    }

    // Get existing categories (they should already be created by createDefaultCategories)
    console.log('Getting existing categories...');
    const allCategories = await categoryRepository.getAll();
    console.log('Found categories:', allCategories.map(c => c.name));

    // Find categories by name
    const workCategory = allCategories.find(c => c.name === 'Work');
    const personalCategory = allCategories.find(c => c.name === 'Personal');
    const learningCategory = allCategories.find(c => c.name === 'Learning');

    // Create sample tasks
    console.log('Creating tasks...');
    const sampleTasks = [
      {
        title: 'Complete project proposal',
        description: 'Write and submit the Q4 project proposal',
        completed: false,
        priority: 'high' as const,
        categoryId: workCategory?.id || null,
      },
      {
        title: 'Buy groceries',
        description: 'Milk, bread, eggs, and vegetables',
        completed: false,
        priority: 'low' as const,
        categoryId: personalCategory?.id || null,
      },
      {
        title: 'Learn React Native',
        description: 'Complete the React Native tutorial',
        completed: false,
        priority: 'low' as const,
        categoryId: learningCategory?.id || null,
      },
    ];

    for (const task of sampleTasks) {
      try {
        console.log('Creating task:', task.title, 'with categoryId:', task.categoryId);
        const created = await taskRepository.create(task);
        console.log('Created task:', created.title, 'with ID:', created.id);
      } catch (error) {
        console.error('Failed to create task:', task.title, error);
        throw error;
      }
    }

    // Mark first launch as completed after successful seeding
    await markFirstLaunchCompleted();
    
    // Mark first launch as completed after successful seeding
    await markFirstLaunchCompleted();
    
    console.log('✅ Demo data seeded successfully with', sampleTasks.length, 'tasks');
    console.log('🎉 First launch initialization completed');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    // Don't mark first launch as completed if seeding failed
  }
}

/**
 * Manually seed demo data (for users who want to add demo data later)
 */
export async function seedDemoDataManually(): Promise<{ success: boolean; message: string; tasksCreated: number }> {
  try {
    console.log('Manually seeding demo data...');

    // Get existing categories
    const allCategories = await categoryRepository.getAll();
    console.log('Found categories:', allCategories.map(c => c.name));

    // Find categories by name
    const workCategory = allCategories.find(c => c.name === 'Work');
    const personalCategory = allCategories.find(c => c.name === 'Personal');
    const learningCategory = allCategories.find(c => c.name === 'Learning');

    // Create sample tasks
    const sampleTasks = [
      {
        title: '📋 Complete project proposal',
        description: 'Write and submit the Q4 project proposal with detailed timeline',
        completed: false,
        priority: 'high' as const,
        categoryId: workCategory?.id || null,
      },
      {
        title: '🛒 Buy groceries',
        description: 'Milk, bread, eggs, vegetables, and fruits for the week',
        completed: false,
        priority: 'low' as const,
        categoryId: personalCategory?.id || null,
      },
      {
        title: '📱 Learn React Native',
        description: 'Complete the React Native tutorial and build a sample app',
        completed: false,
        priority: 'low' as const,
        categoryId: learningCategory?.id || null,
      },
      {
        title: '💪 Morning workout',
        description: '30-minute cardio and strength training session',
        completed: true,
        priority: 'medium' as const,
        categoryId: personalCategory?.id || null,
      },
      {
        title: '📚 Read productivity book',
        description: 'Finish reading "Getting Things Done" by David Allen',
        completed: false,
        priority: 'low' as const,
        categoryId: learningCategory?.id || null,
      },
    ];

    let tasksCreated = 0;
    for (const task of sampleTasks) {
      try {
        await taskRepository.create(task);
        tasksCreated++;
        console.log('Created demo task:', task.title);
      } catch (error) {
        console.error('Failed to create demo task:', task.title, error);
      }
    }

    return {
      success: tasksCreated > 0,
      message: tasksCreated > 0 
        ? `Successfully added ${tasksCreated} demo tasks!` 
        : 'Failed to add demo tasks',
      tasksCreated,
    };
  } catch (error) {
    console.error('Failed to manually seed demo data:', error);
    return {
      success: false,
      message: 'Failed to add demo data. Please try again.',
      tasksCreated: 0,
    };
  }
}