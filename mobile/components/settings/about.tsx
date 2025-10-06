import React from 'react';
import { View, Linking, Platform, Vibration } from 'react-native';
import { Link } from 'expo-router';

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// ─── Icons ────────────────────────────────────────────────────────
import {
    HeartIcon,
    ExternalLinkIcon,
    CodeIcon,
    BookOpenIcon,
    UserIcon,
    GlobeIcon,
    StarIcon,
    CoffeeIcon,
    RocketIcon,
    CpuIcon,
    DatabaseIcon
} from 'lucide-react-native';
import GithubIcon from '../icons/github';
import TasklyLogo from '../icons/taskly';

import { useColorScheme } from 'nativewind';

// ─── Component ────────────────────────────────────────────────────
export function About() {
    const triggerHapticFeedback = React.useCallback(() => {
        try {
            Platform.OS === 'ios' ? Vibration.vibrate(25) : Vibration.vibrate(30);
        } catch { }
    }, []);

    const openLink = async (url: string) => {
        triggerHapticFeedback();
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    };

    const { colorScheme } = useColorScheme();
    return (
        <View className="gap-6 p-4">

            {/* ─── App Info Card ───────────────────────────── */}
            <Card>
                <CardHeader>
                    <View className="flex-row items-center gap-3">
                        <View className="bg-primary/10 p-3 rounded-xl">
                            <TasklyLogo size={32} color={`${colorScheme === 'light' ?  "#000" : "#fff" }`} />
                        </View>
                        <View className="flex-1">
                            <CardTitle className="text-xl">Taskly</CardTitle>
                            <CardDescription>AI-Powered Task Management</CardDescription>
                        </View>
                        <Badge variant="secondary">
                            <Text className="text-xs font-bold">v1.1.2</Text>
                        </Badge>
                    </View>
                </CardHeader>
                <CardContent>
                    <Text className="text-muted-foreground leading-relaxed">
                        An open-source, AI-powered task management app built with React Native and Expo.
                        Designed to be local-first, extensible, and community-driven for students,
                        developers, and teams who value simplicity and data portability.
                    </Text>

                    <Separator className="my-4" />

                    <View className="gap-3">
                        <View className="flex-row items-center gap-2">
                            <Icon as={RocketIcon} size={16} className="text-primary" />
                            <Text className="text-sm font-medium">Latest Features (v1.1.2)</Text>
                        </View>
                        <View className="gap-2 ml-6">
                            <Text className="text-sm text-muted-foreground">• New detailed task view screen</Text>
                            <Text className="text-sm text-muted-foreground">• Markdown preview for descriptions</Text>
                            <Text className="text-sm text-muted-foreground">• Enhanced time tracking UI</Text>
                            <Text className="text-sm text-muted-foreground">• Improved subtask management</Text>
                        </View>
                    </View>
                </CardContent>
            </Card>

            {/* ─── Developer Info Card ─────────────────────── */}
            <Card>
                <CardHeader>
                    <View className="flex-row items-center gap-3">
                        <Avatar className="size-12" alt="Developer Avatar">
                            <AvatarImage source={require('@/assets/images/yash.png')} />
                            <AvatarFallback>
                                <Icon as={UserIcon} size={20} className="text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <View className="flex-1">
                            <CardTitle>Yash Kumar Singh</CardTitle>
                            <CardDescription>Software Developer | React Native | AI Systems</CardDescription>
                        </View>
                    </View>
                </CardHeader>

                <CardContent>
                    <View className="gap-4">
                        <Text className="text-muted-foreground leading-relaxed">
                            A passionate developer pursuing B.Tech in Computer Science at Galgotias University.
                            Experienced in building scalable, real-time applications with React Native, Nest.js, and AI-driven solutions.
                            Currently a <Text>Project Intern at IIT Delhi</Text> and <Text>Technical Lead at IEEE TEMS GU</Text>,
                            with hands-on expertise across full-stack and embedded systems projects.
                        </Text>

                        <View className="flex-row flex-wrap gap-2">
                            <Badge variant="outline">
                                <Icon as={CodeIcon} size={12} className="text-muted-foreground mr-1" />
                                <Text className="text-xs">React Native</Text>
                            </Badge>
                            <Badge variant="outline">
                                <Icon as={DatabaseIcon} size={12} className="text-muted-foreground mr-1" />
                                <Text className="text-xs">Nest.js & Supabase</Text>
                            </Badge>
                            <Badge variant="outline">
                                <Icon as={CpuIcon} size={12} className="text-muted-foreground mr-1" />
                                <Text className="text-xs">AI & IoT Systems</Text>
                            </Badge>
                            <Badge variant="outline">
                                <Icon as={HeartIcon} size={12} className="text-muted-foreground mr-1" />
                                <Text className="text-xs">Open Source</Text>
                            </Badge>
                        </View>

                        <View className="flex-row flex-wrap gap-3 mt-2">
                            <Link href="https://yashkumarsingh.tech" className="text-primary text-xs">
                                Portfolio ↗
                            </Link>
                            <Link href="https://linkedin.com/in/celestial0" className="text-primary text-xs">
                                LinkedIn ↗
                            </Link>
                            <Link href="https://github.com/Celestial-0" className="text-primary text-xs">
                                GitHub ↗
                            </Link>
                        </View>
                    </View>
                </CardContent>
            </Card>

            {/* ─── Tech Stack Card ──────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex-row items-center gap-2">
                        <Icon as={CodeIcon} size={18} className="text-primary" />
                        <Text variant="h3"> Tech Stack</Text>
                    </CardTitle>
                    <CardDescription>Built with modern, reliable technologies</CardDescription>
                </CardHeader>
                <CardContent>
                    <View className="gap-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-medium">Frontend</Text>
                            <Text className="text-sm text-muted-foreground">React Native + Expo</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-medium">Styling</Text>
                            <Text className="text-sm text-muted-foreground">Nativewind + RN Primitives</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-medium">Database</Text>
                            <Text className="text-sm text-muted-foreground">SQLite + Drizzle ORM</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-medium">State</Text>
                            <Text className="text-sm text-muted-foreground">Zustand</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-medium">AI</Text>
                            <Text className="text-sm text-muted-foreground">OpenAI + Gemini</Text>
                        </View>
                    </View>
                </CardContent>
            </Card>

            {/* ─── Links Card ───────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex-row items-center gap-2">
                        <Icon as={GlobeIcon} size={18} className="text-primary" />
                        <Text variant="h3"> Links & Resources</Text>
                    </CardTitle>
                    <CardDescription>Connect with the project and community</CardDescription>
                </CardHeader>
                <CardContent>
                    <View className="gap-3">
                        <Button
                            variant="outline"
                            className="justify-start"
                            onPress={() => openLink('https://github.com/Celestial-0/taskly')}
                        >
                            <GithubIcon size={16} className="text-foreground" color={`${colorScheme === 'light' ?  "#000" : "#fff" }`} />
                            <Text>View on GitHub</Text>
                            <Icon as={ExternalLinkIcon} size={14} className="text-muted-foreground ml-auto" />
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start"
                            onPress={() => openLink('https://github.com/Celestial-0/taskly/blob/main/CONTRIBUTING.md')}
                        >
                            <Icon as={BookOpenIcon} size={16} className="text-foreground" />
                            <Text>Contributing Guide</Text>
                            <Icon as={ExternalLinkIcon} size={14} className="text-muted-foreground ml-auto" />
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start"
                            onPress={() => openLink('https://github.com/Celestial-0/taskly/issues')}
                        >
                            <Icon as={StarIcon} size={16} className="text-foreground" />
                            <Text>Report Issues</Text>
                            <Icon as={ExternalLinkIcon} size={14} className="text-muted-foreground ml-auto" />
                        </Button>
                    </View>
                </CardContent>
            </Card>

            {/* ─── Support Card ─────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex-row items-center gap-2">
                        <Icon as={CoffeeIcon} size={18} className="text-primary" />
                        <Text variant="h3"> Support the Project</Text>
                    </CardTitle>
                    <CardDescription>Help make Taskly even better</CardDescription>
                </CardHeader>
                <CardContent>
                    <View className="gap-4">
                        <Text className="text-muted-foreground leading-relaxed">
                            Taskly is free and open-source. You can support the project by contributing code,
                            reporting bugs, suggesting features, or simply starring the repository on GitHub.
                        </Text>

                        <View className="flex-row gap-2">
                            <Button
                                variant="default"
                                className="flex-1"
                                onPress={() => openLink('https://github.com/Celestial-0/taskly')}
                            >
                                <Icon as={StarIcon} size={16} className="text-primary-foreground" />
                                <Text>Star on GitHub</Text>
                            </Button>

                            <Button
                                variant="outline"
                                className="flex-1"
                                onPress={() => openLink('https://github.com/Celestial-0/taskly/fork')}
                            >
                                <Icon as={CodeIcon} size={16} className="text-foreground" />
                                <Text>Fork & Contribute</Text>
                            </Button>
                        </View>
                    </View>
                </CardContent>
            </Card>

            {/* ─── License Card ─────────────────────────────── */}
            <Card>
                <CardContent className="pt-6">
                    <View className="items-center gap-2">
                        <Badge variant="secondary">
                            <Text className="text-xs font-medium">MIT License</Text>
                        </Badge>
                        <Text className="text-xs text-muted-foreground text-center">
                            Free to use, modify, and share
                        </Text>
                        <Text className="text-xs text-muted-foreground text-center">
                            © 2025 Taskly Contributors
                        </Text>
                    </View>
                </CardContent>
            </Card>
        </View>
    );
}
