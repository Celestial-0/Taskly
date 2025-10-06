import { Stack, useRouter } from 'expo-router';
import { View, FlatList, Vibration, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as React from 'react';
import { useTheme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ChevronLeftIcon, MoonStarIcon, SunIcon } from 'lucide-react-native';
import { Main } from '@/components/settings/main';

// --------------------
// THEME TOGGLE
// --------------------
const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [isToggling, setIsToggling] = React.useState(false);

  const triggerHapticFeedback = React.useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        Vibration.vibrate(25);
      } else if (Platform.OS === 'android') {
        Vibration.vibrate(30);
      }
    } catch {}
  }, []);

  const handleToggle = React.useCallback(() => {
    if (isToggling) return;
    setIsToggling(true);
    triggerHapticFeedback();
    requestAnimationFrame(() => {
      toggleColorScheme();
      setTimeout(() => setIsToggling(false), 100);
    });
  }, [toggleColorScheme, isToggling, triggerHapticFeedback]);

  return (
    <Button
      onPress={handleToggle}
      size="icon"
      variant="ghost"
      className="rounded-full"
      disabled={isToggling}
    >
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5 text-foreground" />
    </Button>
  );
}

// --------------------
// SETTINGS HEADER
// --------------------
type SettingsHeaderProps = {
  title: string;
  onBack: () => void;
};

function SettingsHeader({ title, onBack }: SettingsHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.card }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        {/* Back button + title */}
        <View className="flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            className="pr-3"
            android_ripple={{ color: theme.colors.border }}
          >
            <Icon as={ChevronLeftIcon} className="size-6" color={theme.colors.text} />
          </Pressable>
          <Text className="text-lg font-semibold">{title}</Text>
        </View>

        {/* Theme toggle only */}
        <ThemeToggle />
      </View>
    </View>
  );
}

// --------------------
// SETTINGS SCREEN
// --------------------
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [currentScreen, setCurrentScreen] = React.useState<'menu' | 'ai' | 'notifications' | 'data' | 'about'>('menu');

  const handleScreenChange = (screen: 'menu' | 'ai' | 'notifications' | 'data' | 'about') => {
    setCurrentScreen(screen);
  };

  const showHeader = currentScreen === 'menu';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top-level SafeAreaView to prevent layout shift */}
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Conditional Header - only show on main menu */}
        {showHeader && (
          <SettingsHeader title="Settings" onBack={() => router.back()} />
        )}

        {/* Settings content */}
        <View className="flex-1">
          <Main onScreenChange={handleScreenChange} />
        </View>
      </SafeAreaView>
    </>
  );
}