import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Share, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  ShareIcon,
  CopyIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  CircleIcon,
  PlayIcon,
  PauseIcon,
  AlertCircleIcon,
  ArrowUpIcon
} from 'lucide-react-native';

import { TaskWithDetails, taskRepository } from '@/models/task';
import { categoryRepository } from '@/models/category';
import { TaskForm } from '@/components/tasks/task-form';
import { SubtaskManager } from '@/components/tasks/subtask-manager';
import { TimeTracker } from '@/components/tasks/time-tracker';
import { CategoryBadge } from '@/components/tasks/category-badge';
import { THEME } from '@/lib/theme';
import { formatDistanceToNow, format } from 'date-fns';

const PRIORITY_COLORS = {
  low: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
  high: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
};

const PRIORITY_ICONS = {
  low: null,
  medium: AlertCircleIcon,
  high: ArrowUpIcon,
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [categoryName, setCategoryName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load task details
  const loadTaskDetails = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const taskDetails = await taskRepository.getTaskWithDetails(id);

      if (!taskDetails) {
        setError('Task not found');
        return;
      }

      setTask(taskDetails);

      // Load category name if categoryId exists
      if (taskDetails.categoryId) {
        try {
          const category = await categoryRepository.getById(taskDetails.categoryId);
          setCategoryName(category?.name);
        } catch (err) {
          console.error('Failed to load category:', err);
          setCategoryName(undefined);
        }
      } else {
        setCategoryName(undefined);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
      setError('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTaskDetails();
  }, [loadTaskDetails]);

  // Handle task completion toggle
  const handleToggleCompletion = useCallback(async () => {
    if (!task) return;

    try {
      const updatedTask = await taskRepository.toggleCompletion(task.id);
      if (updatedTask) {
        // Reload full task details to get updated completion percentage
        await loadTaskDetails();
      }
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      setErrorMessage('Failed to update task completion status');
      setErrorDialogOpen(true);
    }
  }, [task, loadTaskDetails]);

  // Handle task deletion
  const handleDelete = useCallback(() => {
    if (!task) return;
    setDeleteDialogOpen(true);
  }, [task]);

  // Confirm task deletion
  const confirmDelete = useCallback(async () => {
    if (!task) return;

    try {
      setIsDeleting(true);
      await taskRepository.delete(task.id);
      router.back();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setErrorMessage('Failed to delete task');
      setErrorDialogOpen(true);
      setIsDeleting(false);
    } finally {
      setDeleteDialogOpen(false);
    }
  }, [task, router]);

  // Handle task duplication
  const handleDuplicate = useCallback(async () => {
    if (!task) return;

    try {
      const duplicatedTask = await taskRepository.create({
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        categoryId: task.categoryId,
        estimatedTime: task.estimatedTime,
        tags: task.tags,
      });

      if (duplicatedTask) {
        setSuccessMessage('Task duplicated successfully');
        setSuccessDialogOpen(true);
        // Navigate to the new task after a short delay
        setTimeout(() => {
          router.replace(`/task/${duplicatedTask.id}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to duplicate task:', err);
      setErrorMessage('Failed to duplicate task');
      setErrorDialogOpen(true);
    }
  }, [task, router]);

  // Handle task sharing
  const handleShare = useCallback(async () => {
    if (!task) return;

    try {
      const shareContent = `Task: ${task.title}\n\n${task.description || 'No description'}\n\nPriority: ${task.priority}\nStatus: ${task.completed ? 'Completed' : 'Pending'}`;

      await Share.share({
        message: shareContent,
        title: task.title,
      });
    } catch (err) {
      console.error('Failed to share task:', err);
    }
  }, [task]);

  // Format time duration
  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }, []);

  // Screen options
  const screenOptions = {
    title: '',
    headerLeft: () => (
      <Button
        onPress={() => router.back()}
        variant="ghost"
        size="icon"
        className="rounded-full"
      >
        <Icon as={ArrowLeftIcon} className="size-5 text-foreground" />
      </Button>
    ),
    headerRight: () => (
      <View className="flex-row gap-1 pr-2">
        <Button
          onPress={() => setShowEditForm(true)}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Icon as={EditIcon} className="size-5 text-foreground" />
        </Button>
        <Button
          onPress={handleShare}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Icon as={ShareIcon} className="size-5 text-foreground" />
        </Button>
      </View>
    ),
    headerStyle: { backgroundColor: THEME[colorScheme ?? 'light'].background },
  };

  if (showEditForm && task) {
    return (
      <TaskForm
        task={{
          id: task.id,
          title: task.title,
          description: task.description ?? undefined,
          completed: task.completed,
          category: categoryName,
          priority: task.priority,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }}
        onClose={() => {
          setShowEditForm(false);
          loadTaskDetails(); // Reload to get updated data
        }}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <View className="flex-1 bg-background">
        {isLoading ? (
          <ScrollView className="flex-1 p-4">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-20 w-full mb-6" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-16 w-full" />
          </ScrollView>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Button onPress={loadTaskDetails} variant="outline">
              <Text>Retry</Text>
            </Button>
          </View>
        ) : task ? (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <Animated.View entering={FadeInDown.delay(100)} className="p-6 pb-4">
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-2xl font-bold text-foreground mb-2">
                    {task.title}
                  </Text>

                  {/* Status and Priority Badges */}
                  <View className="flex-row items-center gap-2 mb-3">
                    <Badge
                      variant={task.completed ? "default" : "outline"}
                      className={task.completed ? "bg-green-500" : ""}
                    >
                      <Icon
                        as={task.completed ? CheckCircleIcon : CircleIcon}
                        size={12}
                        className={task.completed ? "text-white mr-1" : "text-muted-foreground mr-1"}
                      />
                      <Text className={task.completed ? "text-white" : "text-muted-foreground"}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </Text>
                    </Badge>

                    {task.priority && (
                      <Badge variant="outline" className={PRIORITY_COLORS[task.priority].bg}>
                        {PRIORITY_ICONS[task.priority] && (
                          <Icon
                            as={PRIORITY_ICONS[task.priority]!}
                            size={12}
                            className={`${PRIORITY_COLORS[task.priority].text} mr-1`}
                          />
                        )}
                        <Text className={PRIORITY_COLORS[task.priority].text}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Text>
                      </Badge>
                    )}
                  </View>
                </View>

                {/* Completion Toggle */}
                <Button
                  onPress={handleToggleCompletion}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Icon
                    as={task.completed ? CheckCircleIcon : CircleIcon}
                    size={24}
                    className={task.completed ? "text-green-500" : "text-muted-foreground"}
                  />
                </Button>
              </View>

              {/* Progress Bar */}
              {task.completionPercentage !== undefined && (
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">Progress</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {task.completionPercentage}%
                    </Text>
                  </View>
                  <Progress
                    value={task.completionPercentage}
                    className="h-2"
                    key={`progress-${task.completionPercentage}-${task.completed}-${task.subtasks?.filter(st => st.completed).length || 0}-${task.subtasks?.length || 0}`}
                  />
                </View>
              )}
            </Animated.View>

            {/* Description Section */}
            {task.description && (
              <Animated.View entering={FadeInDown.delay(200)} className="px-6 pb-4">
                <Card>
                  <CardContent className="p-4">
                    <Text className="text-sm font-medium text-foreground mb-2">Description</Text>
                    <Text className="text-sm text-muted-foreground leading-relaxed">
                      {task.description}
                    </Text>
                  </CardContent>
                </Card>
              </Animated.View>
            )}

            {/* Meta Information */}
            <Animated.View entering={FadeInDown.delay(300)} className="px-6 pb-4">
              <Card>
                <CardContent className="p-4">
                  <Text className="text-sm font-medium text-foreground mb-3">Details</Text>

                  <View className="gap-3">
                    {/* Created Date */}
                    <View className="flex-row items-center gap-3">
                      <Icon as={CalendarIcon} size={16} className="text-muted-foreground" />
                      <View className="flex-1">
                        <Text className="text-xs text-muted-foreground">Created</Text>
                        <Text className="text-sm text-foreground">
                          {format(new Date(task.createdAt), 'MMM d, yyyy')} • {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                        </Text>
                      </View>
                    </View>

                    {/* Updated Date */}
                    {task.updatedAt !== task.createdAt && (
                      <View className="flex-row items-center gap-3">
                        <Icon as={EditIcon} size={16} className="text-muted-foreground" />
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground">Last updated</Text>
                          <Text className="text-sm text-foreground">
                            {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Due Date */}
                    {task.dueDate && (
                      <View className="flex-row items-center gap-3">
                        <Icon as={CalendarIcon} size={16} className="text-muted-foreground" />
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground">Due date</Text>
                          <Text className="text-sm text-foreground">
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Time Tracking */}
                    {task.totalTimeSpent !== undefined && task.totalTimeSpent > 0 && (
                      <View className="flex-row items-center gap-3">
                        <Icon as={ClockIcon} size={16} className="text-muted-foreground" />
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground">Time spent</Text>
                          <Text className="text-sm text-foreground">
                            {formatDuration(task.totalTimeSpent)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Category */}
                    {task.categoryId && categoryName && (
                      <View className="flex-row items-center gap-3">
                        <Icon as={TagIcon} size={16} className="text-muted-foreground" />
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground">Category</Text>
                          <View className="mt-1">
                            <CategoryBadge
                              categoryId={task.categoryId}
                              categoryName={categoryName}
                              size="md"
                              showIcon={false}
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Tags */}
                    {task.tags && (
                      <View className="flex-row items-start gap-3">
                        <Icon as={TagIcon} size={16} className="text-muted-foreground mt-0.5" />
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground mb-1">Tags</Text>
                          <View className="flex-row flex-wrap gap-1">
                            {JSON.parse(task.tags).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="bg-muted/50">
                                <Text className="text-xs text-muted-foreground">{tag}</Text>
                              </Badge>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            </Animated.View>

            {/* Subtasks Section */}
            <Animated.View entering={FadeInDown.delay(400)} className="px-6 pb-4">
              <Card>
                <CardContent className="p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-medium text-foreground">
                      Subtasks {task.subtasks && task.subtasks.length > 0 && (
                        <Text className="text-muted-foreground">
                          ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                        </Text>
                      )}
                    </Text>
                  </View>

                  <SubtaskManager
                    taskId={task.id}
                    subtasks={task.subtasks || []}
                    onSubtasksChange={async (updatedSubtasks) => {
                      // Update subtasks immediately for UI responsiveness
                      setTask(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);

                      // Reload full task details to recalculate completion percentage
                      try {
                        await loadTaskDetails();
                      } catch (error) {
                        console.error('Failed to reload task details after subtask change:', error);
                      }
                    }}
                    editable={true}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Time Tracking Section */}
            <Animated.View entering={FadeInDown.delay(500)} className="px-6 pb-4">
              <Card>
                <CardContent className="p-4">
                  <Text className="text-sm font-medium text-foreground mb-3">
                    Time Tracking
                  </Text>

                  <TimeTracker
                    taskId={task.id}
                    timeSessions={task.timeSessions || []}
                    onSessionsChange={(updatedSessions) => {
                      setTask(prev => prev ? { ...prev, timeSessions: updatedSessions } : null);
                    }}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Time Sessions History */}
            {task.timeSessions && task.timeSessions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(600)} className="px-6 pb-4">
                <Card>
                  <CardContent className="p-4">
                    <Text className="text-sm font-medium text-foreground mb-3">
                      Session History ({task.timeSessions.length})
                    </Text>

                    <View className="gap-3">
                      {task.timeSessions.slice(0, 5).map((session) => (
                        <View key={session.id} className="flex-row items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                          <View className="flex-1">
                            <Text className="text-sm text-foreground">
                              {format(new Date(session.startTime), 'MMM d, h:mm a')}
                            </Text>
                            {session.notes && (
                              <Text className="text-xs text-muted-foreground mt-1">
                                {session.notes}
                              </Text>
                            )}
                          </View>
                          <Text className="text-sm font-medium text-foreground">
                            {session.duration ? formatDuration(Math.round(session.duration / 60)) : 'Active'}
                          </Text>
                        </View>
                      ))}

                      {task.timeSessions.length > 5 && (
                        <Text className="text-xs text-muted-foreground text-center pt-2">
                          +{task.timeSessions.length - 5} more sessions
                        </Text>
                      )}
                    </View>
                  </CardContent>
                </Card>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <Animated.View entering={FadeInDown.delay(700)} className="p-6 pt-2">
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <Button
                    onPress={() => setShowEditForm(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Icon as={EditIcon} size={16} className="text-foreground mr-2" />
                    <Text>Edit</Text>
                  </Button>

                  <Button
                    onPress={handleDuplicate}
                    variant="outline"
                    className="flex-1"
                  >
                    <Icon as={CopyIcon} size={16} className="text-foreground mr-2" />
                    <Text>Duplicate</Text>
                  </Button>
                </View>

                <Button
                  onPress={handleDelete}
                  variant="outline"
                  disabled={isDeleting}
                  className="border-red-200 dark:border-red-800"
                >
                  <Icon as={TrashIcon} size={16} className="text-red-500 mr-2" />
                  <Text className="text-red-500">
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                  </Text>
                </Button>
              </View>
            </Animated.View>
          </ScrollView>
        ) : null}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{task?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Text>Cancel</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={confirmDelete}>
                <Text>Delete</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Error Dialog */}
        <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error</AlertDialogTitle>
              <AlertDialogDescription>
                {errorMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onPress={() => setErrorDialogOpen(false)}>
                <Text>OK</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success Dialog */}
        <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Success</AlertDialogTitle>
              <AlertDialogDescription>
                {successMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onPress={() => setSuccessDialogOpen(false)}>
                <Text>OK</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </View>
    </>
  );
}