import React, { useState, useEffect } from 'react';
import { View, ScrollView, Vibration, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  SlideInRight
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { SparklesIcon, SaveIcon, WandIcon, XIcon, CheckIcon, EyeIcon, EditIcon } from 'lucide-react-native';

import { Task, TaskInput } from '@/lib/types';
import { useStore } from '@/lib/store';
import { enhancedCategorizeTask } from '@/services';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // Animation values
  const submitScale = useSharedValue(1);
  const aiSuggestionOpacity = useSharedValue(0);

  // Simple markdown renderer for preview
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Split text into lines and process each line
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      let processedLine = line;
      let isHeader = false;
      let isBold = false;
      let isItalic = false;
      let isCode = false;
      let isList = false;

      // Headers
      if (line.startsWith('### ')) {
        processedLine = line.substring(4);
        isHeader = true;
      } else if (line.startsWith('## ')) {
        processedLine = line.substring(3);
        isHeader = true;
      } else if (line.startsWith('# ')) {
        processedLine = line.substring(2);
        isHeader = true;
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        processedLine = '• ' + line.substring(2);
        isList = true;
      }
      // Code blocks (simple single line)
      else if (line.startsWith('```') && line.endsWith('```')) {
        processedLine = line.substring(3, line.length - 3);
        isCode = true;
      }
      // Inline code
      else if (line.includes('`')) {
        isCode = line.startsWith('`') && line.endsWith('`');
        if (isCode) {
          processedLine = line.substring(1, line.length - 1);
        }
      }

      // Bold and italic (simple detection)
      if (processedLine.includes('**')) {
        isBold = true;
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '$1');
      }
      if (processedLine.includes('*') && !isBold) {
        isItalic = true;
        processedLine = processedLine.replace(/\*(.*?)\*/g, '$1');
      }

      elements.push(
        <Text
          key={index}
          className={`
            ${isHeader ? 'text-base font-bold text-foreground' : 'text-sm text-muted-foreground'}
            ${isBold ? 'font-bold' : ''}
            ${isItalic ? 'italic' : ''}
            ${isCode ? 'font-mono bg-muted/50 px-1 rounded' : ''}
            ${isList ? 'ml-2' : ''}
          `}
          style={{ marginBottom: 4 }}
        >
          {processedLine || ' '}
        </Text>
      );
    });

    return elements;
  };

  // Haptic feedback function
  const triggerHapticFeedback = (type: 'light' | 'medium' = 'light') => {
    try {
      if (Platform.OS === 'ios') {
        Vibration.vibrate(type === 'light' ? 25 : 50);
      } else if (Platform.OS === 'android') {
        Vibration.vibrate(type === 'light' ? 30 : 60);
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  };

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
          // Animate AI suggestions appearance
          aiSuggestionOpacity.value = withSpring(1);
        } catch (error) {
          console.error('AI categorization failed:', error);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    } else {
      setAiSuggestions(null);
      aiSuggestionOpacity.value = withTiming(0);
    }
  }, [formData.title, formData.description, task, getAllCategories]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    triggerHapticFeedback('medium');

    // Animate submit button
    submitScale.value = withSpring(0.95, {}, () => {
      submitScale.value = withSpring(1);
    });

    try {
      if (task) {
        await updateTask(task.id, formData);
      } else {
        await addTask(formData);
      }

      // Success haptic feedback
      triggerHapticFeedback('light');
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    triggerHapticFeedback('light');
    onClose();
  };

  const handleApplyAiSuggestions = () => {
    if (aiSuggestions) {
      triggerHapticFeedback('light');
      setFormData({
        ...formData,
        category: aiSuggestions.category,
        priority: aiSuggestions.priority,
      });
      setAiSuggestions(null);
      aiSuggestionOpacity.value = withTiming(0);
    }
  };

  // // Animated styles
  // const submitButtonStyle = useAnimatedStyle(() => ({
  //   transform: [{ scale: submitScale.value }],
  // }));

  const aiSuggestionStyle = useAnimatedStyle(() => ({
    opacity: aiSuggestionOpacity.value,
  }));

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100)}
        className="px-6 py-4 flex-row items-center justify-between border-b border-border/10"
      >
        <View className="flex-row items-center gap-3">
          <Animated.View
            entering={FadeIn.delay(200)}
            className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center"
          >
            <Icon as={task ? SaveIcon : SparklesIcon} size={18} className="text-primary" />
          </Animated.View>
          <Animated.View entering={SlideInRight.delay(150)}>
            <Text className="text-lg font-semibold text-foreground">
              {task ? 'Edit Task' : 'New Task'}
            </Text>
          </Animated.View>
        </View>
        <Button
          onPress={handleCancel}
          variant="ghost"
          size="sm"
          className="rounded-full w-10 h-10 p-0"
        >
          <Icon as={XIcon} size={20} className="text-muted-foreground" />
        </Button>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-6 gap-6">
          {/* Title Input */}
          <Animated.View entering={FadeInDown.delay(200)} className="gap-3">
            <Text className="text-sm font-medium text-foreground">What needs to be done?</Text>
            <Input
              value={formData.title}
              onChangeText={(title) => setFormData({ ...formData, title })}
              placeholder="Enter task title..."
              placeholderTextColor="#9CA3AF"
              className="text-base border-0 bg-muted/30 rounded-lg"
              autoFocus={!task}
            />
            {!formData.title.trim() && (
              <Animated.View entering={FadeIn}>
                <Text className="text-xs text-destructive mt-1 ml-1">
                  Please enter a task title
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Description Input */}
          <Animated.View entering={FadeInDown.delay(300)} className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-foreground">Description</Text>
              <View className="flex-row gap-2">
                <Button
                  onPress={() => setShowMarkdownPreview(false)}
                  variant="ghost"
                  size="sm"
                  className={`px-2 py-1 ${!showMarkdownPreview ? 'bg-primary/10' : ''}`}
                >
                  <Icon as={EditIcon} size={14} className={!showMarkdownPreview ? 'text-primary' : 'text-muted-foreground'} />
                </Button>
                <Button
                  onPress={() => setShowMarkdownPreview(true)}
                  variant="ghost"
                  size="sm"
                  className={`px-2 py-1 ${showMarkdownPreview ? 'bg-primary/10' : ''}`}
                >
                  <Icon as={EyeIcon} size={14} className={showMarkdownPreview ? 'text-primary' : 'text-muted-foreground'} />
                </Button>
              </View>
            </View>

            {!showMarkdownPreview ? (
              <View className="gap-2">
                <Textarea
                  value={formData.description}
                  onChangeText={(description) => setFormData({ ...formData, description })}
                  placeholder="Add more details (optional)...&#10;&#10;Supports Markdown:&#10;# Header&#10;**bold** *italic*&#10;- List item&#10;`code`"
                  placeholderTextColor="#9CA3AF"
                  numberOfLines={6}
                  className="text-sm border-0 bg-muted/30 rounded-lg min-h-[120px]"
                  multiline
                  textAlignVertical="top"
                />
                <Text className="text-xs text-muted-foreground">
                  Supports Markdown: **bold**, *italic*, # headers, - lists, `code`
                </Text>
              </View>
            ) : (
              <View className="min-h-[120px] bg-muted/30 rounded-lg p-3 border-0">
                {formData.description ? (
                  <View className="gap-1">
                    {renderMarkdown(formData.description)}
                  </View>
                ) : (
                  <Text className="text-muted-foreground text-sm italic">
                    No description provided
                  </Text>
                )}
              </View>
            )}
          </Animated.View>

          {/* Category and Priority */}
          <Animated.View entering={FadeInDown.delay(400)} className="gap-5">
            <View className="gap-3">
              <Text className="text-sm font-medium text-foreground">Category</Text>
              <Input
                value={formData.category || ''}
                onChangeText={(category) => setFormData({ ...formData, category })}
                placeholder="Work, Personal, Study..."
                placeholderTextColor="#9CA3AF"
                className="text-sm border-0 bg-muted/30 rounded-lg "
              />
            </View>

            <View className="gap-3">
              <Text className="text-sm font-medium text-foreground">Priority</Text>
              <Select
                defaultValue={{
                  value: formData.priority || 'low',
                  label: getPriorityLabel(formData.priority || 'low'),
                }}
                onValueChange={(option) => {
                  // Handle both object and string values to prevent crashes
                  const priorityValue = typeof option === 'string' ? option : option?.value;
                  if (priorityValue && ['low', 'medium', 'high'].includes(priorityValue)) {
                    setFormData({ ...formData, priority: priorityValue as Task['priority'] });
                  }
                }}
              >
                <SelectTrigger className="border-0 bg-muted/30 rounded-lg h-12">
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" label="Low Priority" />
                  <SelectItem value="medium" label="Medium Priority" />
                  <SelectItem value="high" label="High Priority" />
                </SelectContent>
              </Select>
            </View>
          </Animated.View>

          {/* AI Suggestions */}
          {aiSuggestions && aiSuggestions.confidence > 0 && (
            <Animated.View
              style={aiSuggestionStyle}
              entering={FadeInDown.delay(500)}
              className="bg-primary/5 rounded-lg p-4 border border-primary/10"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Icon as={WandIcon} size={16} className="text-primary" />
                  <Text className="text-primary font-medium text-sm">AI Suggestion</Text>
                  <Badge variant="secondary" className="bg-primary/10 px-2 py-0.5">
                    <Text className="text-xs text-primary">{aiSuggestions.confidence}%</Text>
                  </Badge>
                </View>
              </View>

              <Text className="text-muted-foreground text-sm mb-4">
                {aiSuggestions.category ? (
                  <>
                    <Text className="font-medium text-foreground">{aiSuggestions.category}</Text>
                    {' • '}
                    <Text className="font-medium text-foreground">
                      {getPriorityLabel(aiSuggestions.priority || 'low')}
                    </Text>
                  </>
                ) : (
                  <Text className="font-medium text-foreground">
                    {getPriorityLabel(aiSuggestions.priority || 'low')} Priority
                  </Text>
                )}
              </Text>

              <Button
                onPress={handleApplyAiSuggestions}
                size="sm"
                variant="outline"
                className="border-primary/30 self-start"
              >
                <Icon as={CheckIcon} size={14} className="text-primary mr-1" />
                <Text className="text-primary text-sm">Apply</Text>
              </Button>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions - Fixed at bottom */}
      <Animated.View
        entering={FadeInDown.delay(600)}
        className="absolute bottom-0 left-0 right-0 px-8 py-6 pb-10 bg-background border-t border-border/10"
      >
        <View className="flex-row gap-3">
          <Button
            onPress={handleCancel}
            variant="ghost"
            className="flex-1 py-3 rounded-lg bg-muted/30"
          >
            <Text className="text-muted-foreground">Cancel</Text>
          </Button>
          <Button
            onPress={handleSubmit}
            disabled={!formData.title.trim() || isSubmitting}
            className="flex-1 py-3 rounded-lg"
          >
            {isSubmitting ? (
              <View className="flex-row items-center justify-center gap-2">
                <Animated.View
                  entering={FadeIn}
                  className=" border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
                <Text className="text-primary-foreground font-medium">Saving...</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center gap-2">
                <Icon as={SaveIcon} size={16} className="text-primary-foreground" />
                <Text className="text-primary-foreground font-medium">
                  {task ? 'Update' : 'Create'}
                </Text>
              </View>
            )}
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}