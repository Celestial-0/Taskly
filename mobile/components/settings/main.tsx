import React, { useState } from 'react'
import { ScrollView, View, Pressable } from 'react-native'
import { AISettings } from './ai'
import { NotificationSettings } from './notification'
import { ExportImport } from './export-import'
import { About } from './about'
import { AnimatedSettingsCard } from './animated-card'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import {
  BrainIcon,
  BellIcon,
  DatabaseIcon,
  InfoIcon,
  ChevronRightIcon,
  HomeIcon
} from 'lucide-react-native'

type SettingsScreen = 'menu' | 'ai' | 'notifications' | 'data' | 'about'

interface MenuItem {
  id: SettingsScreen
  title: string
  description: string
  icon: any
  component: React.ComponentType
}

const menuItems: MenuItem[] = [
  {
    id: 'ai',
    title: 'AI Features',
    description: 'Manage AI-powered task assistance',
    icon: BrainIcon,
    component: AISettings
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure alerts and reminders',
    icon: BellIcon,
    component: NotificationSettings
  },
  {
    id: 'data',
    title: 'Data Management',
    description: 'Export and import your tasks',
    icon: DatabaseIcon,
    component: ExportImport
  },
  {
    id: 'about',
    title: 'About',
    description: 'App info and developer details',
    icon: InfoIcon,
    component: About
  }
]

interface MainProps {
  onScreenChange?: (screen: SettingsScreen) => void
}

export const Main = React.memo(function Main({ onScreenChange }: MainProps) {
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('menu')

  const handleScreenChange = (screen: SettingsScreen) => {
    setCurrentScreen(screen)
    onScreenChange?.(screen)
  }

  const renderMenu = () => (
    <ScrollView className="flex-1 mb-10" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-6">
        <View className="mb-6">
          <Text variant="h1" className="text-center text-foreground mb-2">Settings</Text>
          <Text className="text-center text-muted-foreground">Customize your Taskly experience</Text>
        </View>

        <View className="gap-3">
          {menuItems.map((item, index) => (
            <AnimatedSettingsCard key={item.id} delay={index * 100}>
              <Pressable
                onPress={() => handleScreenChange(item.id)}
                className="bg-card rounded-xl border border-border/50 p-4 active:bg-muted/50"
              >
                <View className="flex-row items-center gap-4">
                  <View className="bg-primary/10 p-3 rounded-xl">
                    <Icon as={item.icon} size={24} className="text-primary" />
                  </View>

                  <View className="flex-1">
                    <Text className="font-semibold text-foreground mb-1">{item.title}</Text>
                    <Text className="text-sm text-muted-foreground">{item.description}</Text>
                  </View>

                  <Icon as={ChevronRightIcon} size={20} className="text-muted-foreground" />
                </View>
              </Pressable>
            </AnimatedSettingsCard>
          ))}
        </View>
      </View>
    </ScrollView>
  )

  const renderBreadcrumbs = () => {
    const currentItem = menuItems.find(item => item.id === currentScreen)
    if (!currentItem) return null

    return (
      <View className="px-4 py-4 border-b border-border/30">
        <View className="flex-row items-center gap-2">
          {/* Home breadcrumb */}
          <Pressable
            onPress={() => handleScreenChange('menu')}
            className="flex-row items-center gap-1 px-2 py-1 rounded-md active:bg-muted/50"
          >
            <Icon as={HomeIcon} size={14} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">Settings</Text>
          </Pressable>

          {/* Separator */}
          <Icon as={ChevronRightIcon} size={14} className="text-muted-foreground/50" />

          {/* Current page */}
          <View className="flex-row items-center gap-1 px-2 py-1">
            <Icon as={currentItem.icon} size={14} className="text-primary" />
            <Text className="text-sm font-medium text-foreground">{currentItem.title}</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderSettingsScreen = () => {
    const currentItem = menuItems.find(item => item.id === currentScreen)
    if (!currentItem) return null

    const SettingsComponent = currentItem.component

    return (
      <View className="flex-1">
        {/* Breadcrumb navigation */}
        {renderBreadcrumbs()}

        {/* Settings content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <SettingsComponent />
        </ScrollView>
      </View>
    )
  }

  return currentScreen === 'menu' ? renderMenu() : renderSettingsScreen()
})