import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { SparklesIcon, SaveIcon, WandIcon, XIcon } from 'lucide-react-native';

import { Task, TaskInput } from '@/lib/types';
import { useStore } from '@/lib/store';
import { enhancedCategorizeTask, getAIServiceStatus } from '@/services';
import { getPriorityLabel } from '@/lib/utils';

type TaskFormProps = {
  task?: Task;
  onClose: () => void;
};

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { addTask, updateTask, getAllCategories } = useStore();
  const [formData, setFormData] = useState<TaskInput>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'other',
    priority: task?.priority || 'low',
  });
  const [aiSuggestions, setAiSuggestions] = useState<{
    category: string;
    priority: Task['priority'];
    confidence: number;
  } | null>(null);
  const [aiStatus, setAiStatus] = useState(getAIServiceStatus());

  // Auto-categorize when title or description changes
  useEffect(() => {
    if (formData.title.trim() && !task) { // Only for new tasks
      const debounceTimer = setTimeout(async () => {
        try {
          const existingCategories = getAllCategories();
          const suggestions = await enhancedCategorizeTask(
            formData.title, 
            formData.description || '', 
            existingCategories
          );
          setAiSuggestions(suggestions);
        } catch (error) {
          console.error('AI categorization failed:', error);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    } else {
      setAiSuggestions(null);
    }
  }, [formData.title, formData.description, task, getAllCategories]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    if (task) {
      updateTask(task.id, formData);
    } else {
      addTask(formData);
    }

    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleApplyAiSuggestions = () => {
    if (aiSuggestions) {
      setFormData({
        ...formData,
        category: aiSuggestions.category,
        priority: aiSuggestions.priority,
      });
      setAiSuggestions(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b border-border px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
              <Icon as={task ? SaveIcon : SparklesIcon} size={20} className="text-primary" />
            </View>
            <View>
              <Text className="text-xl font-bold text-foreground">
                {task ? 'Edit Task' : 'New Task'}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {task ? 'Update your task details' : 'Create a new task'}
              </Text>
            </View>
          </View>
          <Button
            onPress={handleCancel}
            variant="ghost"
            size="sm"
            className="rounded-full w-10 h-10 p-0"
          >
            <Icon as={XIcon} size={20} className="text-muted-foreground" />
          </Button>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6 gap-6">
          {/* Title Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task Title</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                value={formData.title}
                onChangeText={(title) => setFormData({ ...formData, title })}
                placeholder="What needs to be done?"
                placeholderClassName="text-muted-foreground"
                className="text-base"
                autoFocus={!task}
              />
              {!formData.title.trim() && (
                <Text className="text-xs text-destructive mt-2">
                  Please enter a task title
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Description Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description</CardTitle>
              <Text className="text-sm text-muted-foreground">
                Add more details about this task (optional)
              </Text>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={formData.description}
                onChangeText={(description) => setFormData({ ...formData, description })}
                placeholder="Describe your task in more detail..."
                placeholderClassName="text-muted-foreground"
                numberOfLines={4}
                className="text-base"
              />
            </CardContent>
          </Card>

          {/* Category and Priority */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Organization</CardTitle>
              <Text className="text-sm text-muted-foreground">
                Categorize and prioritize your task
              </Text>
            </CardHeader>
            <CardContent className="pt-0 gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Category</Text>
                <Input
                  value={formData.category || ''}
                  onChangeText={(category) => setFormData({ ...formData, category })}
                  placeholder="Enter category (e.g., Work, Personal, Study...)"
                  placeholderClassName="text-muted-foreground"
                  className="text-base"
                />
                <Text className="text-xs text-muted-foreground mt-1">
                  Create a new category or use an existing one
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Priority</Text>
                <Select
                  defaultValue={{ 
                    value: formData.priority || 'low', 
                    label: getPriorityLabel(formData.priority || 'low')
                  }}
                  onValueChange={(option) => setFormData({ ...formData, priority: option?.value as Task['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" label="Low Priority" />
                    <SelectItem value="medium" label="Medium Priority" />
                    <SelectItem value="high" label="High Priority" />
                  </SelectContent>
                </Select>
              </View>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {aiSuggestions && aiSuggestions.confidence > 0 && (
            <Alert icon={WandIcon} className="border-primary/20 bg-primary/5">
              <AlertTitle className="flex-row items-center gap-2">
                <Text className="text-primary font-medium">
                  🤖 AI Suggestions {aiStatus.status === 'enhanced' ? '(Enhanced)' : '(Local)'}
                </Text>
                <Badge variant="secondary" className="bg-primary/10">
                  <Text className="text-xs text-primary">{aiSuggestions.confidence}% confidence</Text>
                </Badge>
              </AlertTitle>
              <AlertDescription>
                <Text className="text-muted-foreground mb-3">
                  {aiSuggestions.category ? (
                    <>
                      Suggested category: <Text className="font-medium text-foreground">{aiSuggestions.category}</Text>
                      {' • '}Priority: <Text className="font-medium text-foreground">
                        {getPriorityLabel(aiSuggestions.priority || 'low')}
                      </Text>
                    </>
                  ) : (
                    <>
                      Suggested priority: <Text className="font-medium text-foreground">
                        {getPriorityLabel(aiSuggestions.priority || 'low')}
                      </Text>
                    </>
                  )}
                </Text>
                <View className="flex-row gap-2">
                  <Button
                    onPress={handleApplyAiSuggestions}
                    size="sm"
                    variant="outline"
                    className="border-primary/30"
                  >
                    <Icon as={WandIcon} size={14} className="text-primary mr-2" />
                    <Text className="text-primary">Apply</Text>
                  </Button>
                  {aiStatus.status === 'local' && (
                    <Text className="text-xs text-muted-foreground self-center">
                      Add EXPO_PUBLIC_GEMINI_API_KEY for enhanced AI
                    </Text>
                  )}
                </View>
              </AlertDescription>
            </Alert>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="bg-card border-t border-border p-6 pb-12">
        <View className="flex-row gap-3">
          <Button
            onPress={handleCancel}
            variant="outline"
            className="flex-1"
          >
            <Text>Cancel</Text>
          </Button>
          <Button
            onPress={handleSubmit}
            disabled={!formData.title.trim()}
            className="flex-1"
          >
            <Icon as={SaveIcon} size={16} className="text-primary-foreground mr-2" />
            <Text className="text-primary-foreground font-medium">
              {task ? 'Update Task' : 'Create Task'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}