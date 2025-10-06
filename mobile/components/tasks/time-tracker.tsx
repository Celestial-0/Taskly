import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlayIcon, SquareIcon, ClockIcon } from 'lucide-react-native';

import { TimeSession } from '@/db/schema';
import { timeSessionRepository } from '@/models/time-session';

type TimeTrackerProps = {
  taskId: string;
  timeSessions: TimeSession[];
  onSessionsChange: (sessions: TimeSession[]) => void;
};

export function TimeTracker({ taskId, timeSessions, onSessionsChange }: TimeTrackerProps) {
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check for active session on mount
  useEffect(() => {
    try {
      const active = timeSessions.find(session => !session.endTime);
      if (active) {
        setActiveSession(active);
        const startTime = new Date(active.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      } else {
        setActiveSession(null);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
      setActiveSession(null);
      setElapsedTime(0);
    }
  }, [timeSessions]);

  // Update elapsed time for active session
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      try {
        const startTime = new Date(activeSession.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      } catch (error) {
        console.error('Error updating elapsed time:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    try {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '0:00';
    }
  }, []);

  // Start time tracking
  const handleStart = useCallback(async () => {
    if (isLoading || activeSession) return;

    try {
      setIsLoading(true);
      const newSession = await timeSessionRepository.startSession(taskId);

      setActiveSession(newSession);
      setElapsedTime(0);
      onSessionsChange([newSession, ...timeSessions]);
    } catch (error) {
      console.error('Failed to start time session:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start time tracking');
      setErrorDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, timeSessions, onSessionsChange, isLoading, activeSession]);

  // Stop time tracking
  const handleStop = useCallback(async () => {
    if (isLoading || !activeSession) return;

    try {
      setIsLoading(true);
      const updatedSession = await timeSessionRepository.endSession(activeSession.id);

      if (updatedSession) {
        const updatedSessions = timeSessions.map(session =>
          session.id === activeSession.id ? updatedSession : session
        );

        setActiveSession(null);
        setElapsedTime(0);
        onSessionsChange(updatedSessions);
      }
    } catch (error) {
      console.error('Failed to stop time session:', error);
      setErrorMessage('Failed to stop time tracking');
      setErrorDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, timeSessions, onSessionsChange, isLoading]);

  // Calculate total time safely
  const calculateTotalTime = useCallback(() => {
    try {
      return timeSessions.reduce((total, session) => {
        if (session.duration) {
          return total + session.duration;
        }
        if (session === activeSession) {
          return total + elapsedTime;
        }
        return total;
      }, 0);
    } catch (error) {
      console.error('Error calculating total time:', error);
      return 0;
    }
  }, [timeSessions, activeSession, elapsedTime]);

  return (
    <View className="gap-3">
      {/* Active Timer Display */}
      {activeSession && (
        <Animated.View
          entering={FadeIn}
          className="bg-primary/10 rounded-lg p-4 border border-primary/20"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon as={ClockIcon} size={16} className="text-primary" />
              <Text className="text-sm font-medium text-primary">Active Session</Text>
            </View>
            <Text className="text-lg font-mono font-bold text-primary">
              {formatTime(elapsedTime)}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Control Buttons */}
      <View className="flex-row gap-2">
        {activeSession ? (
          <Button
            onPress={handleStop}
            variant="outline"
            disabled={isLoading}
            className="flex-1 border-red-200 dark:border-red-800"
          >
            <Icon as={SquareIcon} size={16} className="text-red-500 mr-2" />
            <Text className="text-red-500">{isLoading ? 'Stopping...' : 'Stop'}</Text>
          </Button>
        ) : (
          <Button
            onPress={handleStart}
            variant="outline"
            disabled={isLoading}
            className="flex-1 border-green-200 dark:border-green-800"
          >
            <Icon as={PlayIcon} size={16} className="text-green-500 mr-2" />
            <Text className="text-green-500">{isLoading ? 'Starting...' : 'Start Timer'}</Text>
          </Button>
        )}
      </View>

      {/* Recent Sessions Summary */}
      {timeSessions.length > 0 && (
        <View className="pt-2">
          <Text className="text-xs text-muted-foreground mb-2">
            Total time: {formatTime(calculateTotalTime())}
          </Text>
        </View>
      )}

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onPress={() => setErrorDialogOpen(false)}>
              <Text>OK</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}