import { Stack, useRouter } from 'expo-router';
import { ScrollView, View, Pressable } from 'react-native';
import { ExportImport } from '@/components/core/export-import';
import * as React from 'react';
import { useTheme } from '@react-navigation/native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ChevronLeftIcon } from 'lucide-react-native';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false, // Hide the navigation header
        }} 
      />
      <View className="flex-1 bg-background">
        {/* Custom header */}
        <View 
          className="flex-row items-center px-4 py-3 border-b border-border"
          style={{ 
            backgroundColor: theme.colors.card,
            paddingTop: 48, // Account for status bar
          }}>
          <Pressable 
            onPress={() => router.back()}
            className="flex-row items-center gap-2">
            <Icon as={ChevronLeftIcon} className="size-6" color={theme.colors.text} />
            <Text className="text-lg font-semibold">Settings</Text>
          </Pressable>
        </View>
        <ScrollView className="flex-1">
          <ExportImport />
        </ScrollView>
      </View>
    </>
  );
}