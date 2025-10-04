import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { database } from '@/db';
import { categoryRepository } from '@/models';
import { seedDatabase } from '@/lib/seed-data';
import { getAppInitializationInfo } from '@/lib/app-initialization';

// Configure Reanimated to disable strict mode warnings
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode warnings
});

interface AppContextType {
  isInitialized: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType>({
  isInitialized: false,
  error: null,
});

export const useApp = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Taskly app...');

      // Get app initialization info
      const initInfo = await getAppInitializationInfo();
      console.log('📱 App initialization info:', {
        isFirstLaunch: initInfo.isFirstLaunch,
        currentVersion: initInfo.currentVersion,
        storedVersion: initInfo.storedVersion,
      });

      // Check database health
      const isHealthy = await database.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }

      console.log('✅ Database is healthy');

      // Create default categories if they don't exist
      const createdCategories = await categoryRepository.createDefaultCategories();
      console.log(`✅ Default categories ready (${createdCategories.length} created)`);

      // Seed database with demo data (only on first launch)
      await seedDatabase();

      setIsInitialized(true);
      console.log('🎉 App initialization complete');

    } catch (err) {
      console.error('❌ App initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
    }
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-background">
        <Text className="text-red-500 text-center text-lg font-semibold mb-2">
          Initialization Error
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          {error}
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-2xl font-bold text-primary mb-2">Taskly</Text>
        <Text className="text-gray-600 dark:text-gray-400">Initializing...</Text>
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ isInitialized, error }}>
      {children}
    </AppContext.Provider>
  );
}