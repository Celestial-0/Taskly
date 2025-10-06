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
  BrainIcon,
  TagIcon,
  LightbulbIcon,
  TrendingUpIcon,
  SparklesIcon,
  InfoIcon,
  CheckCircleIcon
} from 'lucide-react-native';
import { Pressable } from 'react-native-gesture-handler';

export function AISettings() {
  const {
    aiEnabled,
    taskCategorization,
    smartSuggestions,
    priorityRecommendations,
    autoTagging,
    aiModel,
    updateSetting
  } = useSettingsStore();

  const triggerHapticFeedback = React.useCallback(() => {
    try { Platform.OS === 'ios' ? Vibration.vibrate(25) : Vibration.vibrate(30); } catch { }
  }, []);

  const handleToggle = (key: string) => (value: boolean) => {
    triggerHapticFeedback();
    updateSetting(key as any, value);
  };

  const handleModelChange = (model: string) => {
    triggerHapticFeedback();
    updateSetting('aiModel', model as 'gpt-4o' | 'claude' | 'gemini');
  };

  const settingsItems = [
    { key: 'taskCategorization', icon: TagIcon, title: 'Task Categorization', description: 'Automatically categorize new tasks', value: taskCategorization },
    { key: 'smartSuggestions', icon: LightbulbIcon, title: 'Smart Suggestions', description: 'Get AI-powered task completion suggestions', value: smartSuggestions },
    { key: 'priorityRecommendations', icon: TrendingUpIcon, title: 'Priority Recommendations', description: 'AI suggests task priority levels', value: priorityRecommendations },
    { key: 'autoTagging', icon: SparklesIcon, title: 'Auto-tagging', description: 'Automatically add relevant tags to tasks', value: autoTagging, beta: true }
  ];

  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o', description: "OpenAI's most advanced model", badge: 'Recommended', badgeVariant: 'default' as const },
    { value: 'claude', label: 'Claude', description: "Anthropic's AI with analytical capabilities" },
    { value: 'gemini', label: 'Gemini', description: "Google's multimodal AI with fast processing" }
  ];

  return (
    <View className="px-4 pb-6">
      <Card className="shadow-sm border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <View className="items-center">
            <CardTitle className="flex-row items-center gap-3 justify-center">
              <View className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
                <Icon as={BrainIcon} size={50} className="text-white" />
              </View>
              <View className="flex-1">
                <Text variant="h2" className="text-foreground text-center">AI Features</Text>
                <Text className="text-xs text-muted-foreground mt-0.5 text-center">Powered by advanced machine learning</Text>
              </View>
            </CardTitle>
            <CardDescription className="mt-2 text-center">Manage AI-powered tasks to boost productivity</CardDescription>
          </View>
        </CardHeader>

        <CardContent className="gap-6">
          {/* Master AI Toggle */}
          <View className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className={`p-2 rounded-lg ${aiEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon as={aiEnabled ? CheckCircleIcon : BrainIcon} size={18} className={aiEnabled ? "text-primary" : "text-muted-foreground"} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Enable AI Features</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Master toggle for all AI-powered functionality</Text>
                </View>
              </View>
              <Switch checked={aiEnabled} onCheckedChange={handleToggle('aiEnabled')} />
            </View>
          </View>

          {aiEnabled ? (
            <NativeOnlyAnimatedView entering={FadeInUp} className="gap-6">
              {/* Feature Toggles */}
              <View className="gap-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Smart Features</Text>
                {settingsItems.map((item, index) => (
                  <NativeOnlyAnimatedView key={item.key} entering={FadeInUp.delay(index * 100)}>
                    <View className="bg-background rounded-lg border border-border/50 p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className={`p-2 rounded-lg ${item.value ? 'bg-primary/10' : 'bg-muted/50'}`}>
                          <Icon as={item.icon} size={16} className={item.value ? 'text-primary' : 'text-muted-foreground'} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="font-medium text-foreground">{item.title}</Text>
                            {item.beta && (
                              <Badge variant="secondary" className="px-2 py-0.5">
                                <Text className="text-xs font-medium">Beta</Text>
                              </Badge>
                            )}
                          </View>
                          <Text className="text-xs text-muted-foreground">{item.description}</Text>
                        </View>
                      </View>
                      <Switch checked={item.value} onCheckedChange={handleToggle(item.key)} />
                    </View>
                  </NativeOnlyAnimatedView>
                ))}
              </View>

              <Separator className="my-2" />

              {/* AI Model Selection */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">AI Model</Text>
                <RadioGroup value={aiModel} onValueChange={handleModelChange} className="gap-3">
                  {aiModels.map((model, index) => {
                    const selected = aiModel === model.value;
                    return (
                      <NativeOnlyAnimatedView
                        key={model.value}
                        entering={FadeInUp.delay(settingsItems.length * 100 + index * 100)}
                      >
                        <Pressable
                          onPress={() => handleModelChange(model.value)}
                          className={` bg-background rounded-xl border p-4 ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50'}`}
                        >
                          <View className="flex-row items-start gap-3">
                            <RadioGroupItem value={model.value} className="mt-1" />
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                                <Text className="font-medium text-foreground">{model.label}</Text>
                                {model.badge && (
                                  <Badge
                                    variant={model.badgeVariant || 'outline'}
                                    className="px-2 py-0.5"
                                  >
                                    <Text className="text-xs font-medium">{model.badge}</Text>
                                  </Badge>
                                )}
                              </View>
                              <Text className="text-xs text-muted-foreground leading-5">{model.description}</Text>
                            </View>
                          </View>
                        </Pressable>
                      </NativeOnlyAnimatedView>
                    );
                  })}
                </RadioGroup>
              </View>

            </NativeOnlyAnimatedView>
          ) : (
            <View className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border border-dashed border-border/50">
              <View className="items-center gap-3">
                <View className="bg-muted/50 p-3 rounded-full">
                  <Icon as={InfoIcon} size={24} className="text-muted-foreground" />
                </View>
                <Text className="font-medium text-foreground text-center">AI Features Disabled</Text>
                <Text className="text-sm text-muted-foreground text-center leading-5">
                  Enable AI features above to unlock intelligent task categorization, smart suggestions, and more
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );
}
