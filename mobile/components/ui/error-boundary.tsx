import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react-native';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} retry={this.retry} />;
            }

            return (
                <View className="flex-1 p-4 justify-center">
                    <Card>
                        <CardHeader>
                            <View className="flex-row items-center gap-2">
                                <Icon as={AlertTriangleIcon} size={20} className="text-destructive" />
                                <CardTitle>Something went wrong</CardTitle>
                            </View>
                        </CardHeader>
                        <CardContent className="gap-4">
                            <Text className="text-muted-foreground">
                                {this.state.error?.message || 'An unexpected error occurred'}
                            </Text>
                            <Button onPress={this.retry} variant="outline">
                                <Icon as={RefreshCwIcon} size={16} className="mr-2" />
                                <Text>Try Again</Text>
                            </Button>
                        </CardContent>
                    </Card>
                </View>
            );
        }

        return this.props.children;
    }
}

// Simple error fallback component
export function SimpleErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
    return (
        <View className="flex-1 items-center justify-center p-4">
            <Icon as={AlertTriangleIcon} size={48} className="text-destructive mb-4" />
            <Text className="text-lg font-semibold mb-2">Oops! Something went wrong</Text>
            <Text className="text-muted-foreground text-center mb-4">
                {error?.message || 'An unexpected error occurred'}
            </Text>
            <Button onPress={retry}>
                <Icon as={RefreshCwIcon} size={16} className="mr-2" />
                <Text>Try Again</Text>
            </Button>
        </View>
    );
}