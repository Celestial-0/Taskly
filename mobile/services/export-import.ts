/**
 * Export/Import service for tasks
 * Handles JSON and CSV export/import functionality
 */

import { Task } from '@/lib/types';

export type ExportFormat = 'json' | 'csv';

export interface ExportedTask {
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Export tasks to specified format
 */
export function exportTasks(tasks: Task[], format: ExportFormat): string {
  const exportedTasks: ExportedTask[] = tasks.map(task => ({
    title: task.title,
    description: task.description,
    completed: task.completed,
    category: task.category,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  switch (format) {
    case 'json':
      return JSON.stringify({
        version: '1.0',
        exportDate: new Date().toISOString(),
        taskCount: exportedTasks.length,
        tasks: exportedTasks,
      }, null, 2);

    case 'csv':
      return exportToCSV(exportedTasks);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Import tasks from specified format
 */
export function importTasks(data: string, format: ExportFormat): ExportedTask[] {
  switch (format) {
    case 'json':
      return importFromJSON(data);

    case 'csv':
      return importFromCSV(data);

    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

/**
 * Generate filename for export
 */
export function generateFileName(format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `taskly-export-${timestamp}.${format}`;
}

/**
 * Export tasks to CSV format
 */
function exportToCSV(tasks: ExportedTask[]): string {
  if (tasks.length === 0) {
    return 'title,description,completed,category,priority,createdAt,updatedAt\n';
  }

  const headers = ['title', 'description', 'completed', 'category', 'priority', 'createdAt', 'updatedAt'];
  const csvRows = [headers.join(',')];

  tasks.forEach(task => {
    const row = headers.map(header => {
      const value = task[header as keyof ExportedTask];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Import tasks from JSON format
 */
function importFromJSON(data: string): ExportedTask[] {
  try {
    const parsed = JSON.parse(data);
    
    // Handle different JSON structures
    if (Array.isArray(parsed)) {
      // Direct array of tasks
      return validateTasks(parsed);
    } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
      // Wrapped format with metadata
      return validateTasks(parsed.tasks);
    } else {
      throw new Error('Invalid JSON structure. Expected array of tasks or object with tasks property.');
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please check your data.');
    }
    throw error;
  }
}

/**
 * Import tasks from CSV format
 */
function importFromCSV(data: string): ExportedTask[] {
  const lines = data.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row.');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const tasks: ExportedTask[] = [];

  // Validate required headers
  const requiredHeaders = ['title'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1}: Column count mismatch, skipping`);
      continue;
    }

    const task: Partial<ExportedTask> = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      
      switch (header) {
        case 'title':
          task.title = value;
          break;
        case 'description':
          task.description = value || undefined;
          break;
        case 'completed':
          task.completed = value?.toLowerCase() === 'true';
          break;
        case 'category':
          task.category = value || undefined;
          break;
        case 'priority':
          task.priority = value || undefined;
          break;
        case 'createdat':
        case 'created_at':
          task.createdAt = value || new Date().toISOString();
          break;
        case 'updatedat':
        case 'updated_at':
          task.updatedAt = value || new Date().toISOString();
          break;
      }
    });

    if (task.title) {
      tasks.push({
        title: task.title,
        description: task.description,
        completed: task.completed || false,
        category: task.category,
        priority: task.priority,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString(),
      });
    }
  }

  return tasks;
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

/**
 * Validate imported tasks
 */
function validateTasks(tasks: any[]): ExportedTask[] {
  return tasks.map((task, index) => {
    if (!task || typeof task !== 'object') {
      throw new Error(`Task ${index + 1}: Invalid task object`);
    }

    if (!task.title || typeof task.title !== 'string') {
      throw new Error(`Task ${index + 1}: Missing or invalid title`);
    }

    // Validate category
    if (task.category && !['work', 'personal', 'study', 'health', 'learning', 'shopping', 'other'].includes(task.category)) {
      console.warn(`Task ${index + 1}: Invalid category "${task.category}", defaulting to "other"`);
      task.category = 'other';
    }

    // Validate priority
    if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
      console.warn(`Task ${index + 1}: Invalid priority "${task.priority}", defaulting to "low"`);
      task.priority = 'low';
    }

    return {
      title: task.title,
      description: task.description || undefined,
      completed: Boolean(task.completed),
      category: task.category || 'other',
      priority: task.priority || 'low',
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString(),
    };
  });
}

/**
 * Get export statistics
 */
export function getExportStats(tasks: Task[]): {
  total: number;
  completed: number;
  active: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
} {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
    byCategory: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
  };

  tasks.forEach(task => {
    const category = task.category || 'other';
    const priority = task.priority || 'low';
    
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
  });

  return stats;
}