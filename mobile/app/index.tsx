import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Stack, Link } from 'expo-router';
import { MoonStarIcon, SunIcon, SettingsIcon, SparklesIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import { TaskList } from '@/components/core/task-list';
import { useTheme } from '@react-navigation/native';

export default function Screen() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: '',
          headerShown: false, // Hide the header completely to avoid the crash
        }} 
      />
      <View className="flex-1 bg-background">
        {/* Custom header that won't crash */}
        <CustomHeader />
        <TaskList />
      </View>
    </>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

// Custom header component that replaces the navigation header
const CustomHeader = React.memo(() => {
  const { colorScheme } = useColorScheme();
  const theme = useTheme();
  
  return (
    <View 
      className="flex-row items-center justify-between px-4 py-3 border-b border-border"
      style={{ 
        backgroundColor: theme.colors.card,
        paddingTop: 48, // Account for status bar
      }}>
      <HeaderTitle />
      <HeaderActions />
    </View>
  );
});

const ThemeToggle = React.memo(() => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const theme = useTheme();
  const [isToggling, setIsToggling] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    if (isToggling) return; // Prevent rapid toggling
    
    setIsToggling(true);
    // Add a small delay to ensure proper state management
    requestAnimationFrame(() => {
      toggleColorScheme();
      setTimeout(() => setIsToggling(false), 100);
    });
  }, [toggleColorScheme, isToggling]);

  return (
    <Button
      onPress={handleToggle}
      size="icon"
      variant="ghost"
      className="rounded-full"
      disabled={isToggling}>
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" color={theme.colors.text} />
    </Button>
  );
});

const HeaderTitle = React.memo(() => {
  const theme = useTheme();
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={SparklesIcon} className="size-6" color={theme.colors.primary} />
      <View>
        <Badge variant="default" className="">
          <Text className="text-xs font-bold">Taskly</Text>
        </Badge>
      </View>
    </View>
  );
});

const HeaderActions = React.memo(() => {
  const theme = useTheme();
  return (
    <View className="flex-row gap-1">
      <Link href="/settings" asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Icon as={SettingsIcon} className="size-5" color={theme.colors.text} />
        </Button>
      </Link>
      <ThemeToggle />
    </View>
  );
});
