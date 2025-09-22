import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { AppProvider } from '@/lib/app-provider';
import * as React from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  
  // Memoize the theme value to prevent unnecessary re-renders
  const theme = React.useMemo(
    () => NAV_THEME[colorScheme ?? 'light'],
    [colorScheme]
  );

  return (
    <ThemeProvider value={theme}>
      <AppProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack />
        <PortalHost />
      </AppProvider>
    </ThemeProvider>
  );
}
