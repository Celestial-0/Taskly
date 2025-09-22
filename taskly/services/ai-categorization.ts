/**
 * AI-powered task categorization service
 * Analyzes task titles and descriptions to suggest categories and priorities
 */

export type TaskPriority = 'low' | 'medium' | 'high';

export interface AISuggestion {
  category: string; // Now dynamic - can be any string
  priority: TaskPriority;
  confidence: number; // 0-100
}

// Enhanced keywords for different categories with more comprehensive coverage
const CATEGORY_KEYWORDS = {
  'Work': [
    'meeting', 'project', 'deadline', 'client', 'presentation', 'report', 'email',
    'conference', 'team', 'manager', 'boss', 'office', 'business', 'proposal',
    'budget', 'revenue', 'sales', 'marketing', 'development', 'code', 'deploy',
    'review', 'analysis', 'strategy', 'planning', 'schedule', 'interview',
    'training', 'workshop', 'documentation', 'specification', 'requirement',
    'sprint', 'standup', 'scrum', 'agile', 'task', 'feature', 'bug', 'fix',
    'release', 'launch', 'demo', 'prototype', 'testing', 'qa', 'production'
  ],
  'Personal': [
    'family', 'home', 'house', 'clean', 'vacation', 'travel', 'trip',
    'birthday', 'anniversary', 'friend', 'hobby', 'cooking', 'recipe',
    'garden', 'pet', 'car', 'maintenance', 'repair', 'bill', 'payment',
    'bank', 'insurance', 'personal', 'self', 'relax', 'entertainment',
    'movie', 'book', 'music', 'game', 'social', 'date', 'party', 'event'
  ],
  'Learning': [
    'study', 'learn', 'course', 'class', 'lecture', 'exam', 'test', 'quiz',
    'assignment', 'homework', 'research', 'paper', 'thesis', 'book', 'read',
    'tutorial', 'practice', 'exercise', 'skill', 'language', 'certification',
    'degree', 'university', 'college', 'school', 'education', 'knowledge',
    'online course', 'mooc', 'udemy', 'coursera', 'youtube', 'documentation'
  ],
  'Health': [
    'doctor', 'appointment', 'health', 'exercise', 'workout', 'gym', 'run',
    'walk', 'fitness', 'diet', 'nutrition', 'medicine', 'therapy', 'wellness',
    'medical', 'checkup', 'hospital', 'clinic', 'dentist', 'mental health',
    'meditation', 'yoga', 'sleep', 'water', 'vitamins', 'prescription'
  ],
  'Shopping': [
    'buy', 'purchase', 'shop', 'store', 'market', 'grocery', 'groceries',
    'mall', 'online shopping', 'order', 'delivery', 'pickup', 'supplies',
    'items', 'products', 'clothes', 'food', 'household', 'essentials',
    'amazon', 'walmart', 'target', 'costco', 'ebay', 'shopping list'
  ],
  'Finance': [
    'budget', 'money', 'bank', 'payment', 'bill', 'invoice', 'tax', 'taxes',
    'investment', 'savings', 'loan', 'credit', 'debt', 'insurance', 'financial',
    'accounting', 'expense', 'income', 'salary', 'payroll', 'retirement'
  ],
  'Home': [
    'home', 'house', 'apartment', 'clean', 'cleaning', 'organize', 'declutter',
    'maintenance', 'repair', 'fix', 'renovation', 'decoration', 'furniture',
    'kitchen', 'bathroom', 'bedroom', 'living room', 'garage', 'yard', 'garden'
  ],
  'Travel': [
    'travel', 'trip', 'vacation', 'holiday', 'flight', 'hotel', 'booking',
    'reservation', 'passport', 'visa', 'luggage', 'packing', 'itinerary',
    'destination', 'tourism', 'sightseeing', 'adventure', 'explore'
  ]
};

// Keywords for different priorities
const PRIORITY_KEYWORDS = {
  high: [
    'urgent', 'asap', 'immediately', 'critical', 'important', 'deadline',
    'emergency', 'priority', 'rush', 'quick', 'fast', 'now', 'today',
    'crucial', 'vital', 'essential', 'must', 'required', 'needed'
  ],
  medium: [
    'soon', 'week', 'month', 'plan', 'schedule', 'organize', 'prepare',
    'review', 'check', 'update', 'improve', 'optimize', 'consider'
  ],
  low: [
    'someday', 'maybe', 'later', 'eventually', 'when possible', 'nice to have',
    'optional', 'extra', 'bonus', 'if time', 'leisure', 'hobby'
  ]
};

/**
 * Analyzes text and returns keyword matches with scores
 */
function analyzeKeywords(text: string, keywords: string[]): number {
  const normalizedText = text.toLowerCase();
  let score = 0;
  let matches = 0;

  for (const keyword of keywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      matches++;
      // Give higher score for exact word matches
      const wordBoundaryRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      if (wordBoundaryRegex.test(normalizedText)) {
        score += 2;
      } else {
        score += 1;
      }
    }
  }

  // Normalize score based on text length and keyword density
  const textWords = normalizedText.split(/\s+/).length;
  const density = matches / Math.max(textWords, 1);
  
  return score * (1 + density);
}

/**
 * Determines category based on keyword analysis
 */
function determineCategory(title: string, description: string = ''): { category: string; confidence: number } {
  const combinedText = `${title} ${description}`.trim();
  
  if (!combinedText) {
    return { category: '', confidence: 0 };
  }

  const scores: Record<string, number> = {};
  
  // Calculate scores for all categories
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    scores[category] = analyzeKeywords(combinedText, keywords);
  });

  // Find the category with the highest score
  const maxScore = Math.max(...Object.values(scores));
  const bestCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];

  // If no clear winner or score is too low, return empty category
  if (!bestCategory || maxScore < 1) {
    return { category: '', confidence: 0 };
  }

  // Calculate confidence based on score and relative difference
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = Math.min(Math.round((maxScore / Math.max(totalScore, 1)) * 100), 95);

  return { category: bestCategory, confidence };
}

/**
 * Determines priority based on keyword analysis and urgency indicators
 */
function determinePriority(title: string, description: string = ''): { priority: TaskPriority; confidence: number } {
  const combinedText = `${title} ${description}`.trim();
  
  if (!combinedText) {
    return { priority: 'low', confidence: 0 };
  }

  const scores = {
    high: analyzeKeywords(combinedText, PRIORITY_KEYWORDS.high),
    medium: analyzeKeywords(combinedText, PRIORITY_KEYWORDS.medium),
    low: analyzeKeywords(combinedText, PRIORITY_KEYWORDS.low),
  };

  // Check for urgency indicators
  const urgencyIndicators = /(!{2,}|urgent|asap|emergency|critical|deadline)/i;
  if (urgencyIndicators.test(combinedText)) {
    scores.high += 5;
  }

  // Check for time indicators
  const todayIndicators = /\b(today|now|immediately)\b/i;
  const weekIndicators = /\b(this week|next week|week)\b/i;
  const monthIndicators = /\b(month|later|someday)\b/i;

  if (todayIndicators.test(combinedText)) {
    scores.high += 3;
  } else if (weekIndicators.test(combinedText)) {
    scores.medium += 2;
  } else if (monthIndicators.test(combinedText)) {
    scores.low += 2;
  }

  // Find the priority with the highest score
  const maxScore = Math.max(...Object.values(scores));
  const bestPriority = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as TaskPriority;

  // Default to low if no clear winner
  if (!bestPriority || maxScore < 1) {
    return { priority: 'low', confidence: 0 };
  }

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = Math.min(Math.round((maxScore / Math.max(totalScore, 1)) * 100), 95);

  return { priority: bestPriority, confidence };
}

/**
 * Main function to categorize a task based on title and description
 */
export function categorizeTask(title: string, description: string = ''): AISuggestion {
  if (!title.trim()) {
    return {
      category: '',
      priority: 'low',
      confidence: 0,
    };
  }

  const categoryResult = determineCategory(title, description);
  const priorityResult = determinePriority(title, description);

  // Overall confidence is the average of both confidences
  const overallConfidence = Math.round((categoryResult.confidence + priorityResult.confidence) / 2);

  return {
    category: categoryResult.category,
    priority: priorityResult.priority,
    confidence: overallConfidence,
  };
}

/**
 * Batch categorize multiple tasks
 */
export function batchCategorizeTask(tasks: Array<{ title: string; description?: string }>): AISuggestion[] {
  return tasks.map(task => categorizeTask(task.title, task.description || ''));
}

/**
 * Get category suggestions based on partial input
 */
export function getCategorySuggestions(partialTitle: string): string[] {
  if (!partialTitle.trim() || partialTitle.length < 3) {
    return [];
  }

  const suggestions: Array<{ category: string; score: number }> = [];
  
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    const score = analyzeKeywords(partialTitle, keywords);
    if (score > 0) {
      suggestions.push({ category, score });
    }
  });

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.category);
}

/**
 * Get priority suggestions based on partial input
 */
export function getPrioritySuggestions(partialTitle: string): TaskPriority[] {
  if (!partialTitle.trim() || partialTitle.length < 3) {
    return [];
  }

  const suggestions: Array<{ priority: TaskPriority; score: number }> = [];
  
  Object.entries(PRIORITY_KEYWORDS).forEach(([priority, keywords]) => {
    const score = analyzeKeywords(partialTitle, keywords);
    if (score > 0) {
      suggestions.push({ priority: priority as TaskPriority, score });
    }
  });

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(s => s.priority);
}

/**
 * Analyze task patterns to improve suggestions over time
 * This could be enhanced with machine learning in the future
 */
export function analyzeTaskPatterns(tasks: Array<{
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
}>): {
  categoryAccuracy: number;
  priorityAccuracy: number;
  suggestions: string[];
} {
  if (tasks.length === 0) {
    return {
      categoryAccuracy: 0,
      priorityAccuracy: 0,
      suggestions: [],
    };
  }

  let correctCategories = 0;
  let correctPriorities = 0;
  const suggestions: string[] = [];

  tasks.forEach(task => {
    const aiSuggestion = categorizeTask(task.title, task.description);
    
    if (aiSuggestion.category === task.category) {
      correctCategories++;
    }
    
    if (aiSuggestion.priority === task.priority) {
      correctPriorities++;
    }
  });

  const categoryAccuracy = Math.round((correctCategories / tasks.length) * 100);
  const priorityAccuracy = Math.round((correctPriorities / tasks.length) * 100);

  // Generate improvement suggestions
  if (categoryAccuracy < 70) {
    suggestions.push('Consider adding more specific keywords to task titles for better category detection');
  }
  
  if (priorityAccuracy < 70) {
    suggestions.push('Use urgency keywords like "urgent", "deadline", or "asap" for better priority detection');
  }

  return {
    categoryAccuracy,
    priorityAccuracy,
    suggestions,
  };
}