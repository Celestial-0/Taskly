import React from 'react';
import { View, Vibration, Platform } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { useSettingsStore } from '@/lib/settings-store';
import {
  BellIcon,
  ClockIcon,
  CalendarIcon,
  TrophyIcon,
  VolumeXIcon,
  InfoIcon,
  CheckCircleIcon
} from 'lucide-react-native';
import { Pressable } from 'react-native-gesture-handler';

export function NotificationSettings() {
  const {
    notificationsEnabled,
    taskReminders,
    dueDateAlerts,
    achievementNotifications,
    reminderTiming,
    updateSetting
  } = useSettingsStore();

  const triggerHapticFeedback = React.useCallback(() => {
    try { Platform.OS === 'ios' ? Vibration.vibrate(25) : Vibration.vibrate(30); } catch { }
  }, []);

  const handleToggle = (key: string) => (value: boolean) => {
    triggerHapticFeedback();
    updateSetting(key as any, value);
  };

  const handleReminderTimingChange = (timing: string) => {
    triggerHapticFeedback();
    updateSetting('reminderTiming', timing as '15min' | '1hr' | '1day');
  };

  const settingsItems = [
    { key: 'taskReminders', icon: ClockIcon, title: 'Task Reminders', description: 'Get reminded about your tasks', value: taskReminders },
    { key: 'dueDateAlerts', icon: CalendarIcon, title: 'Due Date Alerts', description: 'Alerts for upcoming deadlines', value: dueDateAlerts },
    { key: 'achievementNotifications', icon: TrophyIcon, title: 'Achievement Notifications', description: 'Celebrate your accomplishments', value: achievementNotifications }
  ];

  const reminderTimings = [
    { value: '15min', label: '15 minutes before', description: 'Quick reminder for immediate tasks', badge: 'Quick', badgeVariant: 'secondary' as const },
    { value: '1hr', label: '1 hour before', description: 'Perfect balance for most tasks', badge: 'Recommended', badgeVariant: 'default' as const },
    { value: '1day', label: '1 day before', description: 'Early planning for important deadlines', badge: 'Early', badgeVariant: 'outline' as const }
  ];

  return (
    <View className="px-4 pb-6">
      <Card className="shadow-sm border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <View className="items-center">
            <CardTitle className="flex-row items-center gap-3 justify-center">
              <View className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                <Icon as={BellIcon} size={50} className="text-white" />
              </View>
              <View className="flex-1">
                <Text variant="h2" className="text-foreground text-center">Notifications</Text>
                <Text className="text-xs text-muted-foreground mt-0.5 text-center">Stay informed and never miss a beat</Text>
              </View>
            </CardTitle>
            <CardDescription className="mt-2 text-center">Manage when and how you receive notifications</CardDescription>
          </View>
        </CardHeader>

        <CardContent className="gap-6">
          {/* Master Notification Toggle */}
          <View className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className={`p-2 rounded-lg ${notificationsEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon as={notificationsEnabled ? CheckCircleIcon : VolumeXIcon} size={18} className={notificationsEnabled ? "text-primary" : "text-muted-foreground"} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Enable Notifications</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Master toggle for all notification functionality</Text>
                </View>
              </View>
              <Switch checked={notificationsEnabled} onCheckedChange={handleToggle('notificationsEnabled')} />
            </View>
          </View>

          {notificationsEnabled ? (
            <NativeOnlyAnimatedView entering={FadeInUp} className="gap-6">
              {/* Notification Types */}
              <View className="gap-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Notification Types</Text>
                {settingsItems.map((item, index) => (
                  <NativeOnlyAnimatedView key={item.key} entering={FadeInUp.delay(index * 100)}>
                    <View className="bg-background rounded-lg border border-border/50 p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className={`p-2 rounded-lg ${item.value ? 'bg-primary/10' : 'bg-muted/50'}`}>
                          <Icon as={item.icon} size={16} className={item.value ? 'text-primary' : 'text-muted-foreground'} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-medium text-foreground">{item.title}</Text>
                          <Text className="text-xs text-muted-foreground">{item.description}</Text>
                        </View>
                      </View>
                      <Switch checked={item.value} onCheckedChange={handleToggle(item.key)} />
                    </View>
                  </NativeOnlyAnimatedView>
                ))}
              </View>

              {(taskReminders || dueDateAlerts) && (
                <>
                  <Separator className="my-2" />

                  {/* Reminder Timing */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Default Reminder Time</Text>
                    <RadioGroup value={reminderTiming} onValueChange={handleReminderTimingChange} className="gap-3">
                      {reminderTimings.map((timing, index) => {
                        const selected = reminderTiming === timing.value;
                        return (
                          <NativeOnlyAnimatedView
                            key={timing.value}
                            entering={FadeInUp.delay(settingsItems.length * 100 + index * 100)}
                          >
                            <Pressable
                              onPress={() => handleReminderTimingChange(timing.value)}
                              className={`bg-background rounded-xl border p-4 ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50'}`}
                            >
                              <View className="flex-row items-start gap-3">
                                <RadioGroupItem value={timing.value} className="mt-1" />
                                <View className="flex-1">
                                  <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                                    <Text className="font-medium text-foreground">{timing.label}</Text>
                                    <Badge
                                      variant={timing.badgeVariant}
                                      className="px-2 py-0.5"
                                    >
                                      <Text className="text-xs font-medium">{timing.badge}</Text>
                                    </Badge>
                                  </View>
                                  <Text className="text-xs text-muted-foreground leading-5">{timing.description}</Text>
                                </View>
                              </View>
                            </Pressable>
                          </NativeOnlyAnimatedView>
                        );
                      })}
                    </RadioGroup>
                  </View>
                </>
              )}

            </NativeOnlyAnimatedView>
          ) : (
            <View className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border border-dashed border-border/50">
              <View className="items-center gap-3">
                <View className="bg-muted/50 p-3 rounded-full">
                  <Icon as={InfoIcon} size={24} className="text-muted-foreground" />
                </View>
                <Text className="font-medium text-foreground text-center">Notifications Disabled</Text>
                <Text className="text-sm text-muted-foreground text-center leading-5">
                  Enable notifications above to receive task reminders, due date alerts, and achievement celebrations
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );
}