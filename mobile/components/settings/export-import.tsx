import React, { useState } from 'react';
import { View, Alert, Share, Vibration, Platform } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import {
  DownloadIcon,
  UploadIcon,
  ShareIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  TrendingUpIcon,
  DatabaseIcon,
  InfoIcon
} from 'lucide-react-native';

import { useStore } from '@/lib/store';
import { exportTasks, importTasks, generateFileName, ExportFormat } from '@/services';
import { Task } from '@/lib/types';

export function ExportImport() {
  const { tasks, addTask, getStats } = useStore();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importFormat, setImportFormat] = useState<ExportFormat>('json');
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const triggerHapticFeedback = React.useCallback(() => {
    try { Platform.OS === 'ios' ? Vibration.vibrate(25) : Vibration.vibrate(30); } catch { }
  }, []);

  const handleExport = async () => {
    triggerHapticFeedback();
    if (tasks.length === 0) {
      Alert.alert('No Tasks', 'You have no tasks to export.');
      return;
    }

    try {
      const exportedData = exportTasks(tasks, exportFormat);
      const fileName = generateFileName(exportFormat);

      // Use Share API to export data
      await Share.share({
        message: exportedData,
        title: `Export Tasks (${fileName})`,
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        error instanceof Error ? error.message : 'Failed to export tasks. Please try again.'
      );
    }
  };

  const handleImport = async () => {
    triggerHapticFeedback();
    if (!importData.trim()) {
      Alert.alert('Import Error', 'Please paste the data to import.');
      return;
    }

    try {
      setIsImporting(true);
      const importedTasks = importTasks(importData, importFormat);

      if (importedTasks.length === 0) {
        Alert.alert('No Tasks Found', 'No valid tasks found in the provided data.');
        return;
      }

      Alert.alert(
        'Import Tasks',
        `Found ${importedTasks.length} tasks. Do you want to import them?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                let successCount = 0;
                for (const task of importedTasks) {
                  try {
                    await addTask({
                      title: task.title,
                      description: task.description,
                      category: validateCategory(task.category),
                      priority: validatePriority(task.priority),
                    });
                    successCount++;
                  } catch (taskError) {
                    console.warn(`Failed to import task "${task.title}":`, taskError);
                  }
                }
                setImportData('');
                Alert.alert(
                  'Import Complete',
                  `Successfully imported ${successCount} out of ${importedTasks.length} tasks!`
                );
              } catch (importError) {
                Alert.alert(
                  'Import Error',
                  'Failed to import some tasks. Please try again.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to import tasks. Please check your data format.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Helper functions for validation
  const validateCategory = (category?: string): Task['category'] => {
    const validCategories: Task['category'][] = ['work', 'personal', 'study', 'health', 'learning', 'shopping', 'other'];
    return validCategories.includes(category as Task['category']) ? category as Task['category'] : 'other';
  };

  const validatePriority = (priority?: string): Task['priority'] => {
    const validPriorities: Task['priority'][] = ['low', 'medium', 'high'];
    return validPriorities.includes(priority as Task['priority']) ? priority as Task['priority'] : 'low';
  };

  const getPlaceholderText = (format: ExportFormat): string => {
    if (format === 'json') {
      return `Paste your JSON data here...

Example JSON format:
{
  "tasks": [
    {
      "title": "Complete project",
      "description": "Finish the task manager",
      "completed": false,
      "category": "work",
      "priority": "high"
    }
  ]
}`;
    } else {
      return `Paste your CSV data here...

Example CSV format:
title,description,completed,category,priority
Complete project,Finish the task manager,false,work,high
Buy groceries,Get milk and bread,false,personal,medium`;
    }
  };

  const stats = getStats();



  return (
    <View className="px-0 pb-6">
      <Card className="shadow-sm border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="px-6">
          <View className="items-center">
            <CardTitle className="flex-row items-center gap-3 justify-center">
              <View className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl">
                <Icon as={DatabaseIcon} size={50} className="text-white" />
              </View>
              <View className="flex-1">
                <Text variant="h2" className="text-foreground text-center">Data Management</Text>
                <Text className="text-xs text-muted-foreground mt-0.5 text-center">Backup and restore your tasks</Text>
              </View>
            </CardTitle>
            <CardDescription className="mt-2 text-center">Export your tasks for backup or import from other sources</CardDescription>
          </View>
        </CardHeader>

        <CardContent className="gap-6">
          {/* Export Section */}
          <NativeOnlyAnimatedView entering={FadeInUp} className="gap-4">
            <View className="bg-muted/10 rounded-xl p-4 border border-border/50">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="bg-orange-500/10 p-2 rounded-lg">

                    <Icon as={UploadIcon} size={18} className="text-orange-600" />
                  </View>

                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">Export Tasks</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Create a backup of your tasks</Text>
                  </View>
                </View>
                <Badge variant="secondary" className="px-2 py-0.5">
                  <Text className="text-xs font-medium">{tasks.length} tasks</Text>
                </Badge>
              </View>

              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">Export Format</Text>
                <Select
                  defaultValue={{
                    value: exportFormat,
                    label: exportFormat === 'json' ? 'JSON (Recommended)' : 'CSV (Spreadsheet)'
                  }}
                  onValueChange={(option) => {
                    if (option?.value) {
                      triggerHapticFeedback();
                      setExportFormat(option.value as ExportFormat);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <View className="flex-row items-center gap-2">
                      <Icon
                        as={exportFormat === 'json' ? FileJsonIcon : FileSpreadsheetIcon}
                        size={16}
                        className="text-muted-foreground"
                      />
                      <SelectValue placeholder="Select export format" />
                    </View>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json" label="JSON (Recommended)" />
                    <SelectItem value="csv" label="CSV (Spreadsheet)" />
                  </SelectContent>
                </Select>

                <Button onPress={handleExport} disabled={tasks.length === 0} className="w-full mt-2">

                  <Icon as={ShareIcon} size={16} className="text-primary-foreground mr-2" />
                  <Text className="text-primary-foreground">
                    {tasks.length === 0 ? 'No Tasks to Export' : `Export ${tasks.length} Tasks`}
                  </Text>
                </Button>
              </View>
            </View>
          </NativeOnlyAnimatedView>

          <Separator className="my-2" />

          {/* Import Section */}
          <NativeOnlyAnimatedView entering={FadeInUp.delay(200)} className="gap-4">
            <View className="bg-muted/10 rounded-xl p-4 border border-border/50">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-blue-500/10 p-2 rounded-lg">
                  <Icon as={DownloadIcon} size={18} className="text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Import Tasks</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Restore from backup or other sources</Text>
                </View>
              </View>

              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">Import Format</Text>
                <Select
                  defaultValue={{
                    value: importFormat,
                    label: importFormat === 'json' ? 'JSON Format' : 'CSV Format'
                  }}
                  onValueChange={(option) => {
                    if (option?.value) {
                      triggerHapticFeedback();
                      setImportFormat(option.value as ExportFormat);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <View className="flex-row items-center gap-2">
                      <Icon
                        as={importFormat === 'json' ? FileJsonIcon : FileSpreadsheetIcon}
                        size={16}
                        className="text-muted-foreground"
                      />
                      <SelectValue placeholder="Select import format" />
                    </View>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json" label="JSON Format" />
                    <SelectItem value="csv" label="CSV Format" />
                  </SelectContent>
                </Select>

                <View className="mt-2">
                  <Text className="text-sm font-medium text-foreground mb-2">Paste Data</Text>
                  <Textarea
                    value={importData}
                    onChangeText={setImportData}
                    placeholder={getPlaceholderText(importFormat)}
                    placeholderClassName="text-muted-foreground"
                    numberOfLines={6}
                    className="font-mono text-xs bg-background border border-border/50 rounded-lg"
                  />
                </View>

                <View className="flex-row gap-2 mt-2">
                  <Button
                    onPress={handleImport}
                    disabled={!importData.trim() || isImporting}
                    variant="outline"
                    className="flex-1"
                  >
                    <Icon as={UploadIcon} size={16} className="mr-2" />
                    <Text>{isImporting ? 'Importing...' : 'Import Tasks'}</Text>
                  </Button>
                  {importData.trim() && (
                    <Button
                      onPress={() => {
                        triggerHapticFeedback();
                        setImportData('');
                      }}
                      variant="ghost"
                      disabled={isImporting}
                    >
                      <Text>Clear</Text>
                    </Button>
                  )}
                </View>
              </View>
            </View>
          </NativeOnlyAnimatedView>

          <Separator className="my-2" />

          {/* Statistics */}
          <NativeOnlyAnimatedView entering={FadeInUp.delay(400)} className="gap-4">
            <View className="bg-muted/10 rounded-xl p-4 border border-border/50">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-purple-500/10 p-2 rounded-lg">
                  <Icon as={TrendingUpIcon} size={18} className="text-purple-600" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Statistics</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Overview of your task management progress</Text>
                </View>
              </View>

              <View className="bg-background rounded-lg border border-border/50 p-4">
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-1 min-w-[100px] items-center">
                    <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
                    <Text className="text-sm text-muted-foreground">Total Tasks</Text>
                  </View>

                  <View className="flex-1 min-w-[100px] items-center">
                    <Text className="text-2xl font-bold text-green-600">{stats.completed}</Text>
                    <Text className="text-sm text-muted-foreground">Completed</Text>
                  </View>

                  <View className="flex-1 min-w-[100px] items-center">
                    <Text className="text-2xl font-bold text-blue-600">{stats.active}</Text>
                    <Text className="text-sm text-muted-foreground">Active</Text>
                  </View>

                  <View className="flex-1 min-w-[100px] items-center">
                    <Text className="text-2xl font-bold text-purple-600">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </Text>
                    <Text className="text-sm text-muted-foreground">Completion Rate</Text>
                  </View>
                </View>
              </View>
            </View>
          </NativeOnlyAnimatedView>

          {tasks.length === 0 && (
            <View className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border border-dashed border-border/50 mt-4">
              <View className="items-center gap-3">
                <View className="bg-muted/50 p-3 rounded-full">
                  <Icon as={InfoIcon} size={24} className="text-muted-foreground" />
                </View>
                <Text className="font-medium text-foreground text-center">No Tasks Available</Text>
                <Text className="text-sm text-muted-foreground text-center leading-5">
                  Create some tasks first to enable export functionality, or import tasks from a backup file
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );
}