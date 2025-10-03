/**
 * App initialization utilities
 * Tracks first-time app launch and handles demo data seeding
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = 'taskly_first_launch_completed';
const APP_VERSION_KEY = 'taskly_app_version';

// Current app version - increment this when you want to trigger re-initialization
const CURRENT_APP_VERSION = '1.0.0';

/**
 * Check if this is the first time the app is being launched
 */
export async function isFirstLaunch(): Promise<boolean> {
  try {
    const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return hasLaunchedBefore === null;
  } catch (error) {
    console.error('Failed to check first launch status:', error);
    // If we can't check, assume it's not the first launch to be safe
    return false;
  }
}

/**
 * Mark the first launch as completed
 */
export async function markFirstLaunchCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    await AsyncStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
    console.log('First launch marked as completed');
  } catch (error) {
    console.error('Failed to mark first launch as completed:', error);
  }
}

/**
 * Check if app version has changed (for migration purposes)
 */
export async function hasAppVersionChanged(): Promise<boolean> {
  try {
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
    return storedVersion !== CURRENT_APP_VERSION;
  } catch (error) {
    console.error('Failed to check app version:', error);
    return false;
  }
}

/**
 * Reset first launch status (for testing or reset purposes)
 */
export async function resetFirstLaunchStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
    await AsyncStorage.removeItem(APP_VERSION_KEY);
    console.log('First launch status reset');
  } catch (error) {
    console.error('Failed to reset first launch status:', error);
  }
}

/**
 * Get app initialization info
 */
export async function getAppInitializationInfo(): Promise<{
  isFirstLaunch: boolean;
  hasVersionChanged: boolean;
  currentVersion: string;
  storedVersion: string | null;
}> {
  try {
    const [firstLaunch, versionChanged, storedVersion] = await Promise.all([
      isFirstLaunch(),
      hasAppVersionChanged(),
      AsyncStorage.getItem(APP_VERSION_KEY)
    ]);

    return {
      isFirstLaunch: firstLaunch,
      hasVersionChanged: versionChanged,
      currentVersion: CURRENT_APP_VERSION,
      storedVersion,
    };
  } catch (error) {
    console.error('Failed to get app initialization info:', error);
    return {
      isFirstLaunch: false,
      hasVersionChanged: false,
      currentVersion: CURRENT_APP_VERSION,
      storedVersion: null,
    };
  }
}