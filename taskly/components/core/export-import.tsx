import React, { useState } from 'react';
import { View, Alert, Share } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DownloadIcon, UploadIcon, ShareIcon, FileJsonIcon, FileSpreadsheetIcon, TrendingUpIcon } from 'lucide-react-native';
import { useStore } from '@/lib/store';
import { exportTasks, importTasks, generateFileName, ExportFormat } from '@/services';
import { Task } from '@/lib/types';

export function ExportImport() {
  const { tasks, addTask, getStats } = useStore();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importFormat, setImportFormat] = useState<ExportFormat>('json');
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
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
    <View className="flex-1 p-4 gap-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Icon as={ShareIcon} size={20} />
            <Text variant={'h2'}> Data Management</Text>
          </CardTitle>
          <CardDescription>
            Export your tasks for backup or import from other sources
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon as={DownloadIcon} size={20} className="text-blue-600 dark:text-blue-400" />
              <CardTitle>Export Tasks</CardTitle>
            </View>
            <Badge variant="secondary">
              <Text className="text-xs">{tasks.length} tasks</Text>
            </Badge>
          </View>
          <CardDescription>
            Create a backup of your tasks to share or store safely
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-4">
          <View>
            <Text className="text-sm font-medium mb-2">Export Format</Text>
            <Select
              defaultValue={{
                value: exportFormat,
                label: exportFormat === 'json' ? 'JSON (Recommended)' : 'CSV (Spreadsheet)'
              }}
              onValueChange={(option) => setExportFormat(option?.value as ExportFormat)}
            >
              <SelectTrigger>
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={exportFormat === 'json' ? FileJsonIcon : FileSpreadsheetIcon}
                    size={16}
                  />
                  <SelectValue placeholder="Select export format" />
                </View>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json" label="JSON (Recommended)" />
                <SelectItem value="csv" label="CSV (Spreadsheet)" />
              </SelectContent>
            </Select>
          </View>

          <Button onPress={handleExport} disabled={tasks.length === 0} className="w-full">
            <Icon as={DownloadIcon} size={16} className="text-primary-foreground mr-2" />
            <Text className="text-primary-foreground">
              {tasks.length === 0 ? 'No Tasks to Export' : `Export ${tasks.length} Tasks`}
            </Text>
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <View className="flex-row items-center gap-2">
            <Icon as={UploadIcon} size={20} className="text-green-600 dark:text-green-400" />
            <CardTitle>Import Tasks</CardTitle>
          </View>
          <CardDescription>
            Import tasks from a previously exported file or other sources
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-4">
          <View>
            <Text className="text-sm font-medium mb-2">Import Format</Text>
            <Select
              defaultValue={{
                value: importFormat,
                label: importFormat === 'json' ? 'JSON' : 'CSV'
              }}
              onValueChange={(option) => setImportFormat(option?.value as ExportFormat)}
            >
              <SelectTrigger>
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={importFormat === 'json' ? FileJsonIcon : FileSpreadsheetIcon}
                    size={16}
                  />
                  <SelectValue placeholder="Select import format" />
                </View>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json" label="JSON" />
                <SelectItem value="csv" label="CSV" />
              </SelectContent>
            </Select>
          </View>

          <View>
            <Text className="text-sm font-medium mb-2">Paste Data</Text>
            <Textarea
              value={importData}
              onChangeText={setImportData}
              placeholder={getPlaceholderText(importFormat)}
              placeholderClassName="text-muted-foreground"
              numberOfLines={8}
              className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-primary/5 dark:bg-primary/10"
            />
          </View>

          <View className="flex-row gap-2">
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
                onPress={() => setImportData('')}
                variant="ghost"
                disabled={isImporting}
              >
                <Text>Clear</Text>
              </Button>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <View className="flex-row items-center gap-2">
            <Icon as={TrendingUpIcon} size={20} className="text-purple-600 dark:text-purple-400" />
            <CardTitle>Statistics</CardTitle>
          </View>
          <CardDescription>
            Overview of your task management progress
          </CardDescription>
        </CardHeader>

        <CardContent>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
              <Text className="text-sm text-muted-foreground">Total Tasks</Text>
            </View>

            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold text-green-600">{stats.completed}</Text>
              <Text className="text-sm text-muted-foreground">Completed</Text>
            </View>

            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold text-blue-600">{stats.active}</Text>
              <Text className="text-sm text-muted-foreground">Active</Text>
            </View>

            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold text-purple-600">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </Text>
              <Text className="text-sm text-muted-foreground">Completion Rate</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}