/**
 * Enhanced AI categorization with Gemini API support
 * Falls back to local categorization when offline or API unavailable
 */

import { categorizeTask as localCategorizeTask, AISuggestion } from './ai-categorization';

// Gemini API configuration
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Enhanced AI categorization using Gemini API with local fallback
 */
export async function enhancedCategorizeTask(
  title: string, 
  description: string = '',
  existingCategories: string[] = []
): Promise<AISuggestion> {
  // Always try local categorization first for speed
  const localResult = localCategorizeTask(title, description);
  
  // If we have a good local result or no API key, use local result
  if (localResult.confidence > 70 || !GEMINI_API_KEY) {
    return localResult;
  }

  try {
    // Try Gemini API for better categorization
    const geminiResult = await categorizeWithGemini(title, description, existingCategories);
    
    // If Gemini gives a good result, use it; otherwise fall back to local
    if (geminiResult.confidence > localResult.confidence) {
      return geminiResult;
    }
  } catch (error) {
    console.log('Gemini API unavailable, using local categorization:', error);
  }

  return localResult;
}

/**
 * Categorize task using Gemini API
 */
async function categorizeWithGemini(
  title: string, 
  description: string, 
  existingCategories: string[]
): Promise<AISuggestion> {
  const prompt = createGeminiPrompt(title, description, existingCategories);
  
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 100,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!result) {
    throw new Error('No response from Gemini API');
  }

  return parseGeminiResponse(result);
}

/**
 * Create a well-structured prompt for Gemini
 */
function createGeminiPrompt(title: string, description: string, existingCategories: string[]): string {
  const existingCategoriesText = existingCategories.length > 0 
    ? `\nExisting user categories: ${existingCategories.join(', ')}`
    : '';

  return `Analyze this task and suggest a category and priority. Respond ONLY with a JSON object in this exact format:
{"category": "suggested_category", "priority": "low|medium|high", "confidence": 85}

Task Title: "${title}"
Task Description: "${description}"${existingCategoriesText}

Rules:
1. Category should be a single word or short phrase (e.g., "Work", "Personal", "Learning", "Health", "Shopping", "Finance", "Home", "Travel")
2. If the task matches an existing user category, prefer that category
3. Priority: "high" for urgent/deadline tasks, "medium" for normal tasks, "low" for optional/someday tasks
4. Confidence: 0-100 based on how certain you are about the categorization
5. Respond with ONLY the JSON object, no other text`;
}

/**
 * Parse Gemini API response
 */
function parseGeminiResponse(response: string): AISuggestion {
  try {
    // Clean up the response (remove any markdown formatting)
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanResponse);
    
    return {
      category: parsed.category || '',
      priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'low',
      confidence: Math.min(Math.max(parsed.confidence || 0, 0), 100),
    };
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    // Return a default response
    return {
      category: '',
      priority: 'low',
      confidence: 0,
    };
  }
}

/**
 * Batch categorize multiple tasks with Gemini API
 */
export async function batchEnhancedCategorizeTask(
  tasks: Array<{ title: string; description?: string }>,
  existingCategories: string[] = []
): Promise<AISuggestion[]> {
  const results: AISuggestion[] = [];
  
  // Process tasks in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchPromises = batch.map(task => 
      enhancedCategorizeTask(task.title, task.description || '', existingCategories)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Get smart category suggestions based on user's existing categories and AI analysis
 */
export async function getSmartCategorySuggestions(
  partialTitle: string,
  existingCategories: string[] = []
): Promise<string[]> {
  if (!partialTitle.trim() || partialTitle.length < 3) {
    return existingCategories.slice(0, 5); // Return recent categories
  }

  try {
    // Get AI suggestion for the partial title
    const aiSuggestion = await enhancedCategorizeTask(partialTitle, '', existingCategories);
    
    // Combine AI suggestion with existing categories
    const suggestions = new Set<string>();
    
    // Add AI suggestion if it has good confidence
    if (aiSuggestion.category && aiSuggestion.confidence > 30) {
      suggestions.add(aiSuggestion.category);
    }
    
    // Add matching existing categories
    const lowerPartial = partialTitle.toLowerCase();
    existingCategories.forEach(category => {
      if (category.toLowerCase().includes(lowerPartial) || 
          lowerPartial.includes(category.toLowerCase())) {
        suggestions.add(category);
      }
    });
    
    // Add some common categories if we don't have enough suggestions
    if (suggestions.size < 3) {
      ['Work', 'Personal', 'Learning', 'Health', 'Shopping'].forEach(category => {
        if (suggestions.size < 5) {
          suggestions.add(category);
        }
      });
    }
    
    return Array.from(suggestions).slice(0, 5);
  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    return existingCategories.slice(0, 5);
  }
}

/**
 * Check if Gemini API is available and configured
 */
export function isGeminiApiAvailable(): boolean {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Get AI service status
 */
export function getAIServiceStatus(): {
  localAI: boolean;
  geminiAPI: boolean;
  status: 'offline' | 'local' | 'enhanced';
} {
  const localAI = true; // Always available
  const geminiAPI = isGeminiApiAvailable();
  
  let status: 'offline' | 'local' | 'enhanced' = 'offline';
  if (localAI && geminiAPI) {
    status = 'enhanced';
  } else if (localAI) {
    status = 'local';
  }
  
  return { localAI, geminiAPI, status };
}