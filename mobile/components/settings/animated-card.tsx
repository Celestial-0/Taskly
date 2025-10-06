import React from 'react';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { FadeIn } from 'react-native-reanimated';

interface AnimatedSettingsCardProps {
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedSettingsCard({ children, delay = 0 }: AnimatedSettingsCardProps) {
  return (
    <NativeOnlyAnimatedView
      entering={FadeIn.delay(delay).duration(500).springify()}
    >
      {children}
    </NativeOnlyAnimatedView>
  );
}