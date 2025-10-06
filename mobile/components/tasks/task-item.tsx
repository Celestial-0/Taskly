import React, { useRef, useCallback, useMemo } from 'react';
import { View, Pressable, Dimensions, Platform, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withTiming,
  cancelAnimation
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { CheckIcon, EditIcon, TrashIcon, AlertCircleIcon, ArrowUpIcon } from 'lucide-react-native';
import { Task } from '@/lib/types';
import { useStore } from '@/lib/store';
import { getPriorityLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type TaskItemProps = {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  swipeThresholds?: {
    show: number;
    delete: number;
  };
};

type GestureContext = {
  startX: number;
};

const PRIORITY_ICONS = {
  low: null,
  medium: AlertCircleIcon,
  high: ArrowUpIcon,
};

export function TaskItem({ task, onEdit, onDelete, swipeThresholds }: TaskItemProps) {
  // Safety check for task data
  if (!task || !task.id || !task.title) {
    console.error('TaskItem received invalid task data:', task);
    return null;
  }

  const { toggleTask, deleteTask } = useStore();
  const router = useRouter();

  // Integration with task store: Both swipe delete and button delete use the same 
  // store method (deleteTask) to ensure consistency in behavior and error handling

  // Memoize screen dimensions to prevent unnecessary recalculations
  const screenWidth = useMemo(() => Dimensions.get('window').width, []);

  // Memoize threshold calculations for performance optimization
  const thresholds = useMemo(() => {
    const showThreshold = swipeThresholds?.show ?? screenWidth * 0.25;
    const deleteThreshold = swipeThresholds?.delete ?? screenWidth * 0.5;

    // Ensure minimum thresholds for usability
    const minShowThreshold = 60; // 60px minimum
    const minDeleteThreshold = 120; // 120px minimum

    return {
      show: Math.max(showThreshold, minShowThreshold),
      delete: Math.max(deleteThreshold, minDeleteThreshold)
    };
  }, [screenWidth, swipeThresholds?.show, swipeThresholds?.delete]);

  const SHOW_THRESHOLD = thresholds.show;
  const DELETE_THRESHOLD = thresholds.delete;

  // Animation values with native driver optimization
  // Requirements: 5.1, 5.2 - Native animations for optimal performance and 60fps
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const backgroundWidth = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);

  // Gesture context and debouncing using shared values for worklet compatibility
  const gestureStartX = useSharedValue(0);
  const lastGestureTime = useSharedValue(0);
  const gestureDebounceMs = 16; // ~60fps debouncing

  // Haptic feedback tracking using shared values
  const hapticShowGiven = useSharedValue(false);
  const hapticDeleteGiven = useSharedValue(false);

  // Feature detection for gesture support
  const isGestureSupported = useMemo(() => {
    // Check if gesture handler is available and device supports gestures
    try {
      return Platform.OS === 'ios' || Platform.OS === 'android';
    } catch {
      return false;
    }
  }, []);

  // Haptic feedback function with fallback
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (Platform.OS === 'ios') {
        // iOS haptic feedback (requires expo-haptics or react-native-haptic-feedback)
        // For now, use basic vibration as fallback
        if (type === 'heavy') {
          Vibration.vibrate(100);
        } else if (type === 'medium') {
          Vibration.vibrate(50);
        } else {
          Vibration.vibrate(25);
        }
      } else if (Platform.OS === 'android') {
        // Android haptic feedback
        if (type === 'heavy') {
          Vibration.vibrate(100);
        } else if (type === 'medium') {
          Vibration.vibrate(50);
        } else {
          Vibration.vibrate(25);
        }
      }
    } catch (error) {
      // Graceful degradation - haptic feedback is optional
      console.log('Haptic feedback not available:', error);
    }
  }, []);

  // Cleanup function for animation memory management
  const cleanupAnimations = useCallback(() => {
    cancelAnimation(translateX);
    cancelAnimation(opacity);
    cancelAnimation(scale);
    cancelAnimation(backgroundWidth);
    cancelAnimation(backgroundOpacity);
    // Reset gesture state
    gestureStartX.value = 0;
    lastGestureTime.value = 0;
    hapticShowGiven.value = false;
    hapticDeleteGiven.value = false;
  }, [translateX, opacity, scale, backgroundWidth, backgroundOpacity, gestureStartX, lastGestureTime, hapticShowGiven, hapticDeleteGiven]);

  const handleToggle = useCallback(() => {
    toggleTask(task.id).catch(error => {
      console.error('Failed to toggle task:', error);
    });
  }, [toggleTask, task.id]);

  // Forward declaration for executeDelete
  const executeDeleteRef = useRef<() => void>(() => { });



  const handleEdit = useCallback(() => {
    onEdit?.(task);
  }, [onEdit, task]);

  // Enhanced threshold evaluation logic with memoization
  // Requirements: 1.2, 1.3, 1.4 - Threshold-based gesture state evaluation
  const evaluateGestureState = useCallback((translationX: number) => {
    const absTranslationX = Math.abs(translationX);

    // Only process left swipes (negative translation)
    if (translationX < 0) {
      // Deep swipe threshold (50% of screen width) - triggers automatic deletion
      // Requirement 1.3: 50% threshold triggers automatic deletion
      if (absTranslationX >= DELETE_THRESHOLD) {
        return 'delete';
      }
      // Show threshold (25% of screen width) - shows delete action state
      // Requirement 1.2: 25% threshold shows delete action state
      else if (absTranslationX >= SHOW_THRESHOLD) {
        return 'show';
      }
    }

    // Default state for no swipe or right swipe
    // Requirement 1.4: < 25% returns to original position
    return 'idle';
  }, [DELETE_THRESHOLD, SHOW_THRESHOLD]);

  // Calculate progress for visual feedback with memoization
  const calculateSwipeProgress = useCallback((translationX: number) => {
    const absTranslationX = Math.abs(translationX);

    if (translationX >= 0) return 0; // No progress for right swipes

    if (absTranslationX < SHOW_THRESHOLD) {
      // Before show threshold: no progress
      return 0;
    } else if (absTranslationX < DELETE_THRESHOLD) {
      // Between show and delete thresholds: 0 to 1 progress
      return (absTranslationX - SHOW_THRESHOLD) / (DELETE_THRESHOLD - SHOW_THRESHOLD);
    } else {
      // Beyond delete threshold: full progress
      return 1;
    }
  }, [SHOW_THRESHOLD, DELETE_THRESHOLD]);

  // Validate screen dimensions and thresholds with memoization
  const validateThresholds = useCallback(() => {
    if (SHOW_THRESHOLD <= 0 || DELETE_THRESHOLD <= 0) {
      console.warn('Invalid threshold values detected');
      return false;
    }
    if (SHOW_THRESHOLD >= DELETE_THRESHOLD) {
      console.warn('Show threshold should be less than delete threshold');
      return false;
    }
    if (DELETE_THRESHOLD > screenWidth) {
      console.warn('Delete threshold exceeds screen width');
      return false;
    }
    return true;
  }, [SHOW_THRESHOLD, DELETE_THRESHOLD, screenWidth]);

  // Initialize threshold validation with cleanup
  React.useEffect(() => {
    validateThresholds();

    // Cleanup function for component unmount
    return () => {
      cleanupAnimations();
    };
  }, [validateThresholds, cleanupAnimations]);

  // Enhanced reset animation with native driver optimization and memory management
  // Requirements: 3.1, 3.2, 3.3 - Gesture cancellation and reset functionality
  const resetPosition = useCallback(() => {
    // Cancel any ongoing animations before starting new ones
    cleanupAnimations();

    // Smooth spring animation back to original position with native driver
    // Requirement 3.3: Smooth animation back when cancelled
    translateX.value = withSpring(0, {
      damping: 25,        // Higher damping for quicker settle without bounce
      mass: 1,
      stiffness: 300,     // Higher stiffness for more responsive reset
      overshootClamping: false, // Allow slight overshoot for natural feel
    });

    // Ensure opacity and scale are reset smoothly if they were modified
    if (opacity.value !== 1) {
      opacity.value = withSpring(1, {
        damping: 20,
        mass: 1,
        stiffness: 200,
      });
    }

    if (scale.value !== 1) {
      scale.value = withSpring(1, {
        damping: 20,
        mass: 1,
        stiffness: 200,
      });
    }

    // Reset background values to ensure clean state
    backgroundWidth.value = withSpring(0, {
      damping: 20,
      mass: 1,
      stiffness: 200,
    });

    backgroundOpacity.value = withSpring(0, {
      damping: 20,
      mass: 1,
      stiffness: 200,
    });
  }, [cleanupAnimations, translateX, opacity, scale, backgroundWidth, backgroundOpacity]);

  // Enhanced delete animation with native driver optimization
  // Requirements: 1.5, 2.4, 2.5 - Deletion animation with fade and scale effects
  const executeDelete = useCallback(() => {
    // Cancel any ongoing animations before starting delete sequence
    cleanupAnimations();

    // Smooth fade out animation with native driver
    // Requirement 2.4: Fade out during deletion
    opacity.value = withTiming(0, {
      duration: 300,
    });

    // Scale down animation with slight delay for better visual effect
    // Requirement 1.5: Scale effects during deletion
    scale.value = withTiming(0.7, {
      duration: 250,
    });

    // Slide further left during deletion for complete visual feedback
    translateX.value = withTiming(-screenWidth * 0.8, {
      duration: 250,
    }, () => {
      // Execute actual delete operation after animations complete
      // Use runOnJS to properly handle the async delete operation
      runOnJS(performDelete)();
    });
  }, [cleanupAnimations, opacity, scale, translateX, screenWidth]);

  // Set the ref after function is defined
  executeDeleteRef.current = executeDelete;

  // Enhanced function to handle the actual delete operation with proper error handling
  // Requirements: 4.1, 4.2 - Store integration and error handling
  const performDelete = useCallback(() => {
    console.log('�️ Swipe Ddelete triggered for task:', task.title);
    // Use setTimeout to handle async operations outside of runOnJS context
    setTimeout(async () => {
      try {
        if (onDelete) {
          // Use custom delete handler if provided (maintains existing API compatibility)
          // Requirement 4.1: Existing delete button remains functional
          // This ensures the component works with different delete implementations
          onDelete(task.id);
        } else {
          // Use the store's deleteTask method which includes proper error handling
          // This integrates with the existing task store and maintains consistency
          await deleteTask(task.id);
        }

        console.log('✅ Task deleted successfully:', task.title);
        // If we reach here, the delete was successful
        // Requirement 2.5: Task removal from list after animation
        // The task will be removed from the store and the UI will update automatically

      } catch (error) {
        console.error('❌ Failed to delete task via swipe:', error);

        // Reset the task position if delete fails to provide immediate visual feedback
        // This gives the user clear indication that the delete operation failed
        resetPosition();

        // The store already handles error state management through its error property
        // The error will be available for the parent component to display
        // This maintains consistency with existing delete behavior where errors are
        // handled at the store level and can be displayed by parent components
      }
    }, 0);
  }, [onDelete, task.id, deleteTask, resetPosition, task.title]);

  // Enhanced gesture handler with debouncing and performance optimization
  // Requirements: 5.1, 5.2, 5.3 - Performance optimization and independent gesture handling
  const panGesture = useMemo(() => {
    try {
      return Gesture.Pan()
        .onStart(() => {
          gestureStartX.value = translateX.value;
          lastGestureTime.value = Date.now();
          // Reset haptic feedback tracking for new gesture
          hapticShowGiven.value = false;
          hapticDeleteGiven.value = false;
        })
        .onUpdate((event) => {
          // Gesture debouncing to prevent performance issues
          // Requirement 5.2: < 16ms frame time for 60fps
          const now = Date.now();
          if (now - lastGestureTime.value < gestureDebounceMs) {
            return;
          }
          lastGestureTime.value = now;

          // Handle empty event object or missing properties
          const translationX = event?.translationX ?? 0;

          // Skip if no meaningful translation
          if (Math.abs(translationX) < 0.1) {
            return;
          }

          // Real-time swipe tracking - onGestureEvent equivalent
          const newTranslateX = gestureStartX.value + translationX;

          // Handle both left and right swipes for cancellation behavior
          if (newTranslateX <= 0) {
            // Left swipe - delete action
            translateX.value = newTranslateX;

            // Provide haptic feedback at thresholds
            const absNewTranslateX = Math.abs(newTranslateX);
            const absStartX = Math.abs(gestureStartX.value);

            if (absNewTranslateX >= SHOW_THRESHOLD && absStartX < SHOW_THRESHOLD && !hapticShowGiven.value) {
              // First time crossing show threshold - light haptic feedback
              runOnJS(triggerHapticFeedback)('light');
              hapticShowGiven.value = true;
            }
            if (absNewTranslateX >= DELETE_THRESHOLD && absStartX < DELETE_THRESHOLD && !hapticDeleteGiven.value) {
              // First time crossing delete threshold - medium haptic feedback
              runOnJS(triggerHapticFeedback)('medium');
              hapticDeleteGiven.value = true;
            }
          } else if (gestureStartX.value < 0 && newTranslateX > gestureStartX.value) {
            // Right swipe from a left-swiped position - cancellation behavior
            // Allow right swipe to cancel and return to original position
            translateX.value = Math.min(newTranslateX, 0); // Don't allow positive values
          }
        })
        .onEnd((event) => {
          // Handle empty event object or missing properties gracefully
          const translationX = event?.translationX ?? 0;
          const velocityX = event?.velocityX ?? 0;

          // If we have no meaningful translation data, just reset
          if (Math.abs(translationX) < 1) {
            runOnJS(resetPosition)();
            return;
          }

          // Gesture completion handling - onHandlerStateChange equivalent
          const finalTranslationX = gestureStartX.value + translationX;

          // Calculate gesture state inline for worklet compatibility
          const absTranslationX = Math.abs(finalTranslationX);
          let gestureState = 'idle';
          if (finalTranslationX < 0) {
            if (absTranslationX >= DELETE_THRESHOLD) {
              gestureState = 'delete';
            } else if (absTranslationX >= SHOW_THRESHOLD) {
              gestureState = 'show';
            }
          }

          // Swipe-right-to-cancel behavior
          if (gestureStartX.value < 0 && translationX > 0 && velocityX > 200) {
            // Fast right swipe from left position - cancel and reset
            runOnJS(resetPosition)();
            return;
          }

          // Enhanced logic for automatic deletion at deep swipe threshold
          if (gestureState === 'delete') {
            // Automatic deletion when crossing delete threshold - heavy haptic feedback
            runOnJS(triggerHapticFeedback)('heavy');
            runOnJS(executeDelete)();
          } else if (gestureState === 'show' && velocityX < -500) {
            // Fast swipe velocity can trigger delete even if not at full threshold
            runOnJS(triggerHapticFeedback)('heavy');
            runOnJS(executeDelete)();
          } else {
            // Reset position for all other cases
            runOnJS(resetPosition)();
          }
        })
        .activeOffsetX([-10, 10])  // Minimum horizontal movement to activate gesture
        .failOffsetY([-5, 5])      // Fail gesture if vertical movement exceeds threshold
        .shouldCancelWhenOutside(true); // Cancel gesture when moving outside bounds
    } catch (error) {
      console.error('Error creating pan gesture:', error);
      // Return a no-op gesture if creation fails
      return Gesture.Pan();
    }
  }, [translateX, gestureStartX, lastGestureTime, hapticShowGiven, hapticDeleteGiven, SHOW_THRESHOLD, DELETE_THRESHOLD, resetPosition, triggerHapticFeedback]);

  const priorityIcon = PRIORITY_ICONS[task.priority || 'low'];

  // Enhanced task content animations
  const taskContentStyle = useAnimatedStyle(() => {
    const absTranslationX = Math.abs(translateX.value);

    // Calculate progress inline for worklet compatibility
    let progress = 0;
    if (translateX.value < 0) {
      if (absTranslationX < SHOW_THRESHOLD) {
        progress = 0;
      } else if (absTranslationX < DELETE_THRESHOLD) {
        progress = (absTranslationX - SHOW_THRESHOLD) / (DELETE_THRESHOLD - SHOW_THRESHOLD);
      } else {
        progress = 1;
      }
    }

    // Enhanced scale animation during swipe for visual feedback
    let swipeScale = 1;
    if (translateX.value < 0 && absTranslationX >= SHOW_THRESHOLD) {
      // Subtle scale down during swipe to indicate interaction
      swipeScale = 1 - (progress * 0.05); // Scale from 1.0 to 0.95
    }

    // Combine swipe scale with deletion scale
    const finalScale = scale.value * swipeScale;

    return {
      transform: [
        { translateX: translateX.value },
        { scale: finalScale }
      ],
      opacity: opacity.value,
    };
  });



  // Enhanced delete background style with proper positioning and interpolation
  // Requirement 2.2: Proportional opacity and width increase
  const deleteBackgroundContainerStyle = useAnimatedStyle(() => {
    // Calculate interpolated values based on swipe progress
    const absTranslationX = Math.abs(translateX.value);

    // Calculate progress inline for worklet compatibility
    let progress = 0;
    if (translateX.value < 0) {
      if (absTranslationX < SHOW_THRESHOLD) {
        progress = 0;
      } else if (absTranslationX < DELETE_THRESHOLD) {
        progress = (absTranslationX - SHOW_THRESHOLD) / (DELETE_THRESHOLD - SHOW_THRESHOLD);
      } else {
        progress = 1;
      }
    }

    // Width grows proportionally to swipe distance, capped at screen width
    const interpolatedWidth = Math.min(absTranslationX, screenWidth);

    // Opacity increases smoothly from 0 to 1 based on swipe progress
    // Requirement 2.2: Proportional opacity increase
    const interpolatedOpacity = absTranslationX >= SHOW_THRESHOLD
      ? Math.min(0.3 + (progress * 0.7), 1.0) // 0.3 to 1.0 range
      : 0;

    return {
      width: interpolatedWidth,
      opacity: interpolatedOpacity,
    };
  });

  // Enhanced tap-to-reset functionality for partially swiped tasks with memoization
  // Requirement 3.1: Tap to reset partially swiped task
  const handleTapToReset = useCallback(() => {
    // Check if task is in a swiped state (partially or fully)
    if (translateX.value < 0) {
      // Task is swiped left - reset to original position
      resetPosition();
      return true; // Indicate that reset was performed
    }
    return false; // No reset needed
  }, [translateX, resetPosition]);

  // Enhanced tap handler that prevents other actions when resetting
  // Requirement 4.3: No interference with existing actions
  const handleTaskPress = useCallback(() => {
    // If task is swiped, reset instead of performing other actions
    const wasReset = handleTapToReset();
    if (wasReset) {
      // Prevent other tap actions when resetting
      return;
    }
    // Navigate to task detail screen
    router.push(`/task/${task.id}`);
  }, [handleTapToReset, router, task.id]);

  return (
    <View
      className={`mb-4 ${task.completed ? 'opacity-50' : 'opacity-100'}`}
      testID="task-item"
    >
      <View className="relative overflow-hidden">
        {/* Enhanced Delete Background Component */}
        {/* Requirements: 2.1, 2.2, 2.3 - Red background with proportional feedback and trash icon */}
        <Animated.View
          style={[deleteBackgroundContainerStyle]}
          className="absolute right-0 top-0 bottom-0 bg-red-500 flex-row items-center justify-end overflow-hidden"
        >
          {/* Background gradient for visual depth */}
          {/* Requirement 2.1: Red background behind task during swipe */}
          <View className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-600" />

          {/* Trash icon container with proper positioning */}
          {/* Requirement 2.3: White trash icon display */}
          <View className="flex-row items-center justify-center px-6 h-full min-w-[60px]">
            <Animated.View
              style={useAnimatedStyle(() => {
                // Calculate progress inline for worklet compatibility
                const absTranslationX = Math.abs(translateX.value);
                let progress = 0;
                if (translateX.value < 0) {
                  if (absTranslationX < SHOW_THRESHOLD) {
                    progress = 0;
                  } else if (absTranslationX < DELETE_THRESHOLD) {
                    progress = (absTranslationX - SHOW_THRESHOLD) / (DELETE_THRESHOLD - SHOW_THRESHOLD);
                  } else {
                    progress = 1;
                  }
                }

                // Scale icon based on swipe progress for visual feedback
                const iconScale = 0.8 + (progress * 0.4); // Scale from 0.8 to 1.2

                return {
                  transform: [{ scale: Math.min(iconScale, 1.2) }],
                };
              })}
            >
              <Icon as={TrashIcon} size={24} className="text-white" />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Task content with conditional gesture handler for graceful degradation */}
        {/* Requirements: 4.4, 5.5 - Fallback support and gesture priority */}
        {isGestureSupported ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={taskContentStyle}>
              <Pressable
                onPress={handleTaskPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Task: ${task.title}${task.completed ? ', completed' : ', not completed'}`}
                accessibilityHint="Swipe left to delete. Tap to reset if partially swiped."
              >
                <View className="flex-row items-start gap-4 py-3 bg-background">
                  <Pressable
                    onPress={handleToggle}
                    className="p-2 -m-2 mt-0.5"
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    accessible={true}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: task.completed }}
                    accessibilityLabel={`Mark task ${task.completed ? 'incomplete' : 'complete'}`}
                    testID="toggle-button"
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
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel="Edit task"
                          testID="edit-button"
                        >
                          <Icon as={EditIcon} size={14} className="text-muted-foreground" />
                        </Button>

                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          </GestureDetector>
        ) : (
          // Fallback for devices without gesture support - same enhanced content without gesture handler
          <Animated.View style={taskContentStyle}>
            <Pressable
              onPress={handleTaskPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Task: ${task.title}${task.completed ? ', completed' : ', not completed'}`}
              accessibilityHint="Swipe left to delete this task."
            >
              <View className="flex-row items-start gap-4 py-3 bg-background">
                <Pressable
                  onPress={handleToggle}
                  className="p-1 -m-1 mt-1"
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  accessible={true}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.completed }}
                  accessibilityLabel={`Mark task ${task.completed ? 'incomplete' : 'complete'}`}
                >
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center transition-colors shadow-sm ${task.completed
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30 bg-background hover:border-primary/50'
                    }`}>
                    {task.completed && (
                      <Icon as={CheckIcon} size={14} className="text-primary-foreground" />
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

                      {/* Enhanced badges with better visual design */}
                      <View className="flex-row items-center gap-2 flex-wrap">
                        {task.category && task.category.trim() !== '' && (
                          <Badge variant="secondary" className="px-2 py-1">
                            <Text className="text-xs font-medium capitalize">
                              {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                            </Text>
                          </Badge>
                        )}

                        {task.priority && (
                          <Badge
                            variant={task.priority === 'high' ? 'destructive' :
                              task.priority === 'medium' ? 'default' : 'outline'}
                            className="px-2 py-1"
                          >
                            <View className="flex-row items-center gap-1">
                              {priorityIcon && (
                                <Icon as={priorityIcon} size={10} />
                              )}
                              <Text className="text-xs font-medium">
                                {getPriorityLabel(task.priority)}
                              </Text>
                            </View>
                          </Badge>
                        )}
                      </View>
                    </View>

                    {/* Enhanced action buttons */}
                    <View className="flex-row gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={handleEdit}
                        className="h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Edit task"
                      >
                        <Icon as={EditIcon} size={14} className="text-muted-foreground" />
                      </Button>

                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Subtle separator */}
        <View className="h-px bg-border/20 ml-9" />
      </View>
    </View>
  );
}