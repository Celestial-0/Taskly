import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { CheckIcon, EditIcon, TrashIcon, AlertCircleIcon, ArrowUpIcon } from 'lucide-react-native';
import { Task } from '@/lib/types';
import { useStore } from '@/lib/store';
import { getPriorityLabel } from '@/lib/utils';

type TaskItemProps = {
  task: Task;
  onEdit?: (task: Task) => void;
};

const PRIORITY_ICONS = {
  low: null,
  medium: AlertCircleIcon,
  high: ArrowUpIcon,
};

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const { toggleTask, deleteTask } = useStore();

  const handleToggle = () => {
    toggleTask(task.id).catch(error => {
      console.error('Failed to toggle task:', error);
    });
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  const handleEdit = () => {
    onEdit?.(task);
  };

  const priorityIcon = PRIORITY_ICONS[task.priority || 'low'];

  return (
    <View className={`mb-4 ${task.completed ? 'opacity-50' : 'opacity-100'}`}>
      <View className="flex-row items-start gap-4 py-3">
        <Pressable
          onPress={handleToggle}
          className="p-2 -m-2 mt-0.5"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-400 dark:border-gray-500 bg-transparent'
            }`}>
            {task.completed && (
              <Icon as={CheckIcon} size={14} className="text-white" />
            )}
          </View>
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <Text
                className={`text-base font-medium leading-tight ${task.completed
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
                  }`}
              >
                {task.title}
              </Text>

              {task.description && (
                <Text className={`text-sm mt-1 leading-relaxed ${task.completed
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground/80'
                  }`}>
                  {task.description}
                </Text>
              )}

              {/* Minimalist badges - only show if not default values */}
              <View className="flex-row items-center gap-2 mt-2">
                {task.category && task.category.trim() !== '' && (
                  <View className="bg-muted/50 px-2 py-1 rounded-full">
                    <Text className="text-xs text-muted-foreground capitalize">
                      {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                    </Text>
                  </View>
                )}

                {task.priority && (
                  <View className={`px-2 py-1 rounded-full ${task.priority === 'high'
                    ? 'bg-red-100 dark:bg-red-900/20'
                    : task.priority === 'low'
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-yellow-100 dark:bg-yellow-900/20'
                    }`}>
                    <View className="flex-row items-center gap-1">
                      {priorityIcon && (
                        <Icon as={priorityIcon} size={8} className={
                          task.priority === 'high'
                            ? 'text-red-600 dark:text-red-400'
                            : task.priority === 'low'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                        } />
                      )}
                      <Text className={`text-xs ${task.priority === 'high'
                        ? 'text-red-600 dark:text-red-400'
                        : task.priority === 'low'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                        {getPriorityLabel(task.priority)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row gap-1">
              <Button
                size="sm"
                variant="ghost"
                onPress={handleEdit}
                className="h-7 w-7 p-0 rounded-full opacity-60"
              >
                <Icon as={EditIcon} size={14} className="text-muted-foreground" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onPress={handleDelete}
                className="h-7 w-7 p-0 rounded-full opacity-60"
              >
                <Icon as={TrashIcon} size={14} className="text-destructive/70" />
              </Button>
            </View>
          </View>
        </View>
      </View>

      {/* Subtle separator */}
      <View className="h-px bg-border/20 ml-9" />
    </View>
  );
}