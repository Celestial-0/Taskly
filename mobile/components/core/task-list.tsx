import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Icon } from '@/components/ui/icon';
import { PlusIcon, TrashIcon, FilterIcon } from 'lucide-react-native';

import { Task } from '@/lib/types';
import { useStore } from '@/lib/store';
import { TaskItem } from './task-item';
import { TaskForm } from './task-form';

type FilterType = 'all' | 'active' | 'completed' | string; // Allow any string for dynamic categories

function TaskListContent() {
  const { tasks, isLoading, error, loadTasks, loadCategories, clearCompleted, getAllCategories } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filter, setFilter] = useState<FilterType>('all');

  // Load tasks and categories on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing task list...');
        
        // Check database health first
        const { checkDatabaseHealth } = await import('@/lib/database-utils');
        const healthCheck = await checkDatabaseHealth();
        
        if (!healthCheck.isHealthy) {
          console.error('Database health check failed:', healthCheck.error);
          console.log('Available tables:', healthCheck.tables);
        } else {
          console.log('Database is healthy. Tables:', healthCheck.tables);
        }
        
        await loadCategories();
        await loadTasks();
        console.log('Task list initialized successfully');
      } catch (error) {
        console.error('Failed to initialize task list:', error);
      }
    };
    initialize();
  }, [loadTasks, loadCategories]);

  const filteredTasks = tasks.filter((task) => {
    try {
      switch (filter) {
        case 'all':
          return true;
        case 'active':
          return task.completed === false;
        case 'completed':
          return task.completed === true;
        default:
          // For dynamic categories, match the category name
          return task.category === filter;
      }
    } catch (error) {
      console.error('Error filtering task:', task, error);
      return false;
    }
  });

  const activeTasks = tasks.filter(task => task.completed === false).length;
  const completedTasks = tasks.filter(task => task.completed === true).length;



  const handleAddTask = () => {
    setEditingTask(undefined);
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleClearCompleted = () => {
    clearCompleted();
  };

  if (showForm) {
    return (
      <TaskForm
        task={editingTask}
        onClose={handleCloseForm}
      />
    );
  }

  // Show loading state with skeletons
  if (isLoading) {
    return (
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </View>
          <Skeleton className="h-9 w-16" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </View>
        </ScrollView>

        <View className="gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <View className="flex-row gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <View className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <View className="flex-row gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Button onPress={loadTasks} variant="outline">
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Minimalist Header */}
      <View className="px-4 py-6 bg-background">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-foreground">Tasks</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {activeTasks} active • {completedTasks} completed
            </Text>
          </View>
          <Button onPress={handleAddTask} size="sm" className="rounded-full">
            <Icon as={PlusIcon} size={18} className="text-primary-foreground" />
          </Button>
        </View>

        {/* Minimalist Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2 px-1">
            {(() => {
              const baseFilters = [
                { key: 'all', label: 'All', count: tasks.length },
                { key: 'active', label: 'Active', count: activeTasks },
                { key: 'completed', label: 'Completed', count: completedTasks },
              ];

              // Get dynamic categories from tasks
              const allCategories = getAllCategories();
              const categoryFilters = allCategories.map(category => ({
                key: category,
                label: category.charAt(0).toUpperCase() + category.slice(1),
                count: tasks.filter(t => t.category === category).length,
              })).filter(f => f.count > 0); // Only show categories with tasks

              return [...baseFilters, ...categoryFilters].map(({ key, label, count }) => (
                <Button
                  key={key}
                  onPress={() => setFilter(key as FilterType)}
                  variant={filter === key ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-full px-4 ${filter === key ? 'bg-primary' : 'bg-muted/50'}`}
                >
                  <Text className={`text-xs font-medium ${filter === key ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {label} {count > 0 && `(${count})`}
                  </Text>
                </Button>
              ));
            })()}
          </View>
        </ScrollView>
      </View>

      {/* Clear Completed Button - Minimalist */}
      {completedTasks > 0 && filter === 'completed' && (
        <View className="px-4 mb-3">
          <Button
            onPress={handleClearCompleted}
            variant="ghost"
            size="sm"
            className="self-start rounded-full"
          >
            <Icon as={TrashIcon} size={14} className="text-destructive mr-2" />
            <Text className="text-destructive text-xs">Clear {completedTasks} completed</Text>
          </Button>
        </View>
      )}

      {/* Minimalist Task List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Icon
              as={filter === 'all' ? PlusIcon : FilterIcon}
              size={64}
              className="text-muted-foreground/30 mb-6"
            />
            <Text className="text-muted-foreground text-center text-xl font-light mb-2">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </Text>
            <Text className="text-muted-foreground/70 text-center text-sm mb-8">
              {filter === 'all'
                ? 'Tap the + button to create your first task'
                : `Switch filters or create some ${filter} tasks`
              }
            </Text>
            {filter === 'all' && (
              <Button onPress={handleAddTask} className="rounded-full px-6">
                <Icon as={PlusIcon} size={16} className="text-primary-foreground mr-2" />
                <Text className="text-primary-foreground">Create Task</Text>
              </Button>
            )}
          </View>
        ) : (
          <View className="pb-6">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function TaskList() {
  return (
    <ErrorBoundary>
      <TaskListContent />
    </ErrorBoundary>
  );
}