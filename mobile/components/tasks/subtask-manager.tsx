import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  CheckCircleIcon, 
  PlusIcon, 
  TrashIcon, 
  XIcon,
  SaveIcon
} from 'lucide-react-native';

import { Subtask } from '@/db/schema';
import { subtaskRepository } from '@/models/subtask';
import { Icon } from '../ui/icon';

type SubtaskManagerProps = {
  taskId: string;
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  editable?: boolean;
};

export function SubtaskManager({ 
  taskId, 
  subtasks, 
  onSubtasksChange, 
  editable = false 
}: SubtaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Toggle subtask completion
  const handleToggleSubtask = useCallback(async (subtaskId: string) => {
    try {
      const updatedSubtask = await subtaskRepository.toggleCompletion(subtaskId);
      if (updatedSubtask) {
        const updatedSubtasks = subtasks.map(st => 
          st.id === subtaskId ? updatedSubtask : st
        );
        onSubtasksChange(updatedSubtasks);
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
      setErrorMessage('Failed to update subtask');
      setErrorDialogOpen(true);
    }
  }, [subtasks, onSubtasksChange]);

  // Add new subtask
  const handleAddSubtask = useCallback(async () => {
    if (!newSubtaskTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newSubtask = await subtaskRepository.createSubtask({
        taskId,
        title: newSubtaskTitle.trim(),
        completed: false,
      });

      const updatedSubtasks = [...subtasks, newSubtask].sort((a, b) => a.order - b.order);
      onSubtasksChange(updatedSubtasks);
      
      setNewSubtaskTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add subtask:', error);
      setErrorMessage('Failed to add subtask');
      setErrorDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [taskId, newSubtaskTitle, subtasks, onSubtasksChange, isSubmitting]);

  // Delete subtask
  const handleDeleteSubtask = useCallback((subtaskId: string, subtaskTitle: string) => {
    setSubtaskToDelete({ id: subtaskId, title: subtaskTitle });
    setDeleteDialogOpen(true);
  }, []);

  // Confirm delete subtask
  const confirmDeleteSubtask = useCallback(async () => {
    if (!subtaskToDelete) return;

    try {
      const success = await subtaskRepository.delete(subtaskToDelete.id);
      if (success) {
        const updatedSubtasks = subtasks.filter(st => st.id !== subtaskToDelete.id);
        onSubtasksChange(updatedSubtasks);
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      setErrorMessage('Failed to delete subtask');
      setErrorDialogOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setSubtaskToDelete(null);
    }
  }, [subtaskToDelete, subtasks, onSubtasksChange]);

  // Cancel adding
  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewSubtaskTitle('');
  }, []);

  return (
    <View className="gap-2">
      {/* Existing Subtasks */}
      {subtasks.map((subtask) => (
        <Animated.View 
          key={subtask.id}
          entering={FadeIn}
          exiting={FadeOut}
          className="flex-row items-center gap-3 py-2"
        >
          <Button
            onPress={() => handleToggleSubtask(subtask.id)}
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0 rounded-full"
          >
            <View className={`w-4 h-4 rounded border-2 items-center justify-center ${
              subtask.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-muted-foreground bg-transparent'
            }`}>
              {subtask.completed && (
                <CheckCircleIcon size={10} color="white" />
              )}
            </View>
          </Button>
          
          <Text className={`flex-1 text-sm ${
            subtask.completed 
              ? 'line-through text-muted-foreground' 
              : 'text-foreground'
          }`}>
            {subtask.title}
          </Text>

          {editable && (
            <Button
              onPress={() => handleDeleteSubtask(subtask.id, subtask.title)}
              variant="ghost"
              size="icon"
              className="w-6 h-6 p-0 rounded-full opacity-60"
            >
              <TrashIcon size={12} color="#ef4444" />
            </Button>
          )}
        </Animated.View>
      ))}

      {/* Add New Subtask */}
      {editable && (
        <>
          {isAdding ? (
            <Animated.View 
              entering={SlideInRight}
              className="flex-row items-center gap-2 py-2"
            >
              <Input
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                placeholder="Enter subtask title..."
                className="flex-1 text-sm border-0 bg-muted/30 rounded-lg"
                autoFocus
                onSubmitEditing={handleAddSubtask}
              />
              
              <Button
                onPress={handleAddSubtask}
                disabled={!newSubtaskTitle.trim() || isSubmitting}
                variant="ghost"
                size="icon"
                className="w-8 h-8 p-0 rounded-full"
              >
                <SaveIcon size={14} color="#22c55e" />
              </Button>
              
              <Button
                onPress={handleCancelAdd}
                variant="ghost"
                size="icon"
                className="w-8 h-8 p-0 rounded-full"
              >
                <XIcon size={14} color="#6b7280" />
              </Button>
            </Animated.View>
          ) : (
            <Button
              onPress={() => setIsAdding(true)}
              variant="ghost"
              className="flex-row items-center justify-start gap-2 py-2 px-0"
            >
              <PlusIcon size={14} color="#6b7280" />
              <Text className="text-sm text-muted-foreground">Add subtask</Text>
            </Button>
          )}
        </>
      )}

      {/* Empty State */}
      {subtasks.length === 0 && !isAdding && (
        <View className="py-4">
          <Text className="text-sm text-muted-foreground text-center">
            {editable ? 'No subtasks yet. Tap "Add subtask" to create one.' : 'No subtasks'}
          </Text>
        </View>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subtaskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmDeleteSubtask}>
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
    </View>
  );
}