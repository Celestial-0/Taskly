import * as React from 'react';
import { View } from 'react-native';
import { Stack, Link } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { MoonStarIcon, SunIcon, SettingsIcon, SparklesIcon } from 'lucide-react-native';
import { THEME } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Main } from '@/components/core/main';

// --------------------
// CONSTANTS
// --------------------
const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

// --------------------
// THEME TOGGLE
// --------------------
function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [isToggling, setIsToggling] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    if (isToggling) return;
    setIsToggling(true);
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
      <Icon
        as={THEME_ICONS[colorScheme ?? 'light']}
        className="size-5 text-foreground"
      />
    </Button>
  );
}

// --------------------
// HEADER ACTIONS
// --------------------
function HeaderActions() {
  return (
    <View className="flex-row gap-1 pr-2">
      <Link href="/settings" asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Icon as={SettingsIcon} className="size-5 text-foreground" />
        </Button>
      </Link>
      <ThemeToggle />
    </View>
  );
}

// --------------------
// HEADER TITLE
// --------------------
function HeaderTitle() {
  return (
    <View className="flex-row items-center gap-2 pl-2">
      <Icon as={SparklesIcon} className="size-6 text-primary" />
      <Badge variant="default">
        <Text className="text-xs font-bold">Taskly</Text>
      </Badge>
    </View>
  );
}

// --------------------
// SCREEN OPTIONS
// --------------------
const SCREEN_OPTIONS = {
  light: {
    title: '',
    headerTitle: () => <HeaderTitle />,
    headerRight: () => <HeaderActions />,
    headerShadowVisible: true,
    headerStyle: { backgroundColor: THEME.light.background  },
  },
  dark: {
    title: '',
    headerTitle: () => <HeaderTitle />,
    headerRight: () => <HeaderActions />,
    headerShadowVisible: true,
    headerStyle: { backgroundColor: THEME.dark.background },
  },
};

// --------------------
// MAIN SCREEN
// --------------------
export default function Screen() {
  const { colorScheme } = useColorScheme();

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS[colorScheme ?? 'light']} />
      <View className="flex-1 bg-background" key={`screen-${colorScheme}`}>
        <Main />
      </View>
    </>
  );
}
