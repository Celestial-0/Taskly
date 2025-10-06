import { eq, and, desc, isNull, isNotNull, sql } from 'drizzle-orm';
import { db } from '../db/database';
import { timeSessions, tasks, type TimeSession, type NewTimeSession } from '../db/schema';
import { BaseRepository } from './base';

export interface TimeSessionWithTask extends TimeSession {
  taskTitle?: string | null;
}

export interface TimeStats {
  totalSessions: number;
  totalDuration: number; // in seconds
  averageSessionDuration: number; // in seconds
  longestSession: number; // in seconds
  shortestSession: number; // in seconds
  totalDurationFormatted: string; // "2h 30m"
}

export class TimeSessionRepository extends BaseRepository<TimeSession, NewTimeSession> {
  protected tableName = 'time_sessions';
  protected table = timeSessions;

  // Start a new time session
  public async startSession(taskId: string, notes?: string): Promise<TimeSession> {
    try {
      // Check if there's already an active session for this task
      const activeSession = await this.getActiveSession(taskId);
      if (activeSession) {
        throw new Error('There is already an active session for this task');
      }

      return await this.create({
        taskId,
        startTime: new Date().toISOString(),
        notes: notes || null,
      });
    } catch (error) {
      console.error('Failed to start time session:', error);
      throw error;
    }
  }

  // End a time session
  public async endSession(id: string, notes?: string): Promise<TimeSession | null> {
    try {
      const session = await this.getById(id);
      if (!session) return null;

      if (session.endTime) {
        throw new Error('Session is already ended');
      }

      const endTime = new Date().toISOString();
      const startTime = new Date(session.startTime);
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000);

      return await this.update(id, {
        endTime,
        duration,
        notes: notes || session.notes,
      });
    } catch (error) {
      console.error('Failed to end time session:', error);
      return null;
    }
  }

  // Get active session for a task
  public async getActiveSession(taskId: string): Promise<TimeSession | null> {
    try {
      const results = await db
        .select()
        .from(timeSessions)
        .where(
          and(
            eq(timeSessions.taskId, taskId),
            isNull(timeSessions.endTime)
          )
        )
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('Failed to get active session:', error);
      return null;
    }
  }

  // Get all active sessions
  public async getAllActiveSessions(): Promise<TimeSessionWithTask[]> {
    try {
      const results = await db
        .select({
          id: timeSessions.id,
          taskId: timeSessions.taskId,
          startTime: timeSessions.startTime,
          endTime: timeSessions.endTime,
          duration: timeSessions.duration,
          notes: timeSessions.notes,
          createdAt: timeSessions.createdAt,
          updatedAt: timeSessions.updatedAt,
          syncStatus: timeSessions.syncStatus,
          lastSyncAt: timeSessions.lastSyncAt,
          taskTitle: tasks.title,
        })
        .from(timeSessions)
        .leftJoin(tasks, eq(timeSessions.taskId, tasks.id))
        .where(isNull(timeSessions.endTime))
        .orderBy(desc(timeSessions.startTime));

      return results;
    } catch (error) {
      console.error('Failed to get all active sessions:', error);
      return [];
    }
  }

  // Get sessions by task ID
  public async getByTaskId(taskId: string): Promise<TimeSession[]> {
    try {
      return await db
        .select()
        .from(timeSessions)
        .where(eq(timeSessions.taskId, taskId))
        .orderBy(desc(timeSessions.startTime));
    } catch (error) {
      console.error('Failed to get sessions by task ID:', error);
      return [];
    }
  }

  // Get completed sessions (with end time)
  public async getCompletedSessions(): Promise<TimeSessionWithTask[]> {
    try {
      const results = await db
        .select({
          id: timeSessions.id,
          taskId: timeSessions.taskId,
          startTime: timeSessions.startTime,
          endTime: timeSessions.endTime,
          duration: timeSessions.duration,
          notes: timeSessions.notes,
          createdAt: timeSessions.createdAt,
          updatedAt: timeSessions.updatedAt,
          syncStatus: timeSessions.syncStatus,
          lastSyncAt: timeSessions.lastSyncAt,
          taskTitle: tasks.title,
        })
        .from(timeSessions)
        .leftJoin(tasks, eq(timeSessions.taskId, tasks.id))
        .where(isNotNull(timeSessions.endTime))
        .orderBy(desc(timeSessions.endTime));

      return results;
    } catch (error) {
      console.error('Failed to get completed sessions:', error);
      return [];
    }
  }

  // Get sessions for a date range
  public async getSessionsInRange(startDate: string, endDate: string): Promise<TimeSessionWithTask[]> {
    try {
      const results = await db
        .select({
          id: timeSessions.id,
          taskId: timeSessions.taskId,
          startTime: timeSessions.startTime,
          endTime: timeSessions.endTime,
          duration: timeSessions.duration,
          notes: timeSessions.notes,
          createdAt: timeSessions.createdAt,
          updatedAt: timeSessions.updatedAt,
          syncStatus: timeSessions.syncStatus,
          lastSyncAt: timeSessions.lastSyncAt,
          taskTitle: tasks.title,
        })
        .from(timeSessions)
        .leftJoin(tasks, eq(timeSessions.taskId, tasks.id))
        .where(
          and(
            sql`${timeSessions.startTime} >= ${startDate}`,
            sql`${timeSessions.startTime} <= ${endDate}`
          )
        )
        .orderBy(desc(timeSessions.startTime));

      return results;
    } catch (error) {
      console.error('Failed to get sessions in range:', error);
      return [];
    }
  }

  // Get today's sessions
  public async getTodaySessions(): Promise<TimeSessionWithTask[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      return await this.getSessionsInRange(startOfDay, endOfDay);
    } catch (error) {
      console.error('Failed to get today\'s sessions:', error);
      return [];
    }
  }

  // Calculate time statistics for a task
  public async getTaskTimeStats(taskId: string): Promise<TimeStats> {
    try {
      const sessions = await this.getByTaskId(taskId);
      const completedSessions = sessions.filter(s => s.duration !== null);

      if (completedSessions.length === 0) {
        return {
          totalSessions: 0,
          totalDuration: 0,
          averageSessionDuration: 0,
          longestSession: 0,
          shortestSession: 0,
          totalDurationFormatted: '0m',
        };
      }

      const durations = completedSessions.map(s => s.duration!);
      const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
      const averageSessionDuration = Math.round(totalDuration / durations.length);
      const longestSession = Math.max(...durations);
      const shortestSession = Math.min(...durations);

      return {
        totalSessions: completedSessions.length,
        totalDuration,
        averageSessionDuration,
        longestSession,
        shortestSession,
        totalDurationFormatted: this.formatDuration(totalDuration),
      };
    } catch (error) {
      console.error('Failed to get task time stats:', error);
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        longestSession: 0,
        shortestSession: 0,
        totalDurationFormatted: '0m',
      };
    }
  }

  // Calculate overall time statistics
  public async getOverallTimeStats(): Promise<TimeStats> {
    try {
      const allSessions = await this.getCompletedSessions();

      if (allSessions.length === 0) {
        return {
          totalSessions: 0,
          totalDuration: 0,
          averageSessionDuration: 0,
          longestSession: 0,
          shortestSession: 0,
          totalDurationFormatted: '0m',
        };
      }

      const durations = allSessions.map(s => s.duration!).filter(d => d !== null);
      const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
      const averageSessionDuration = durations.length > 0 ? Math.round(totalDuration / durations.length) : 0;
      const longestSession = durations.length > 0 ? Math.max(...durations) : 0;
      const shortestSession = durations.length > 0 ? Math.min(...durations) : 0;

      return {
        totalSessions: allSessions.length,
        totalDuration,
        averageSessionDuration,
        longestSession,
        shortestSession,
        totalDurationFormatted: this.formatDuration(totalDuration),
      };
    } catch (error) {
      console.error('Failed to get overall time stats:', error);
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        longestSession: 0,
        shortestSession: 0,
        totalDurationFormatted: '0m',
      };
    }
  }

  // Format duration in seconds to human readable format
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    let result = `${hours}h`;
    if (remainingMinutes > 0) {
      result += ` ${remainingMinutes}m`;
    }
    if (remainingSeconds > 0) {
      result += ` ${remainingSeconds}s`;
    }

    return result;
  }

  // Stop all active sessions (useful for app shutdown)
  public async stopAllActiveSessions(): Promise<number> {
    try {
      const activeSessions = await this.getAllActiveSessions();
      let stoppedCount = 0;

      for (const session of activeSessions) {
        const stopped = await this.endSession(session.id);
        if (stopped) stoppedCount++;
      }

      return stoppedCount;
    } catch (error) {
      console.error('Failed to stop all active sessions:', error);
      return 0;
    }
  }

  // Delete all sessions for a task
  public async deleteByTaskId(taskId: string): Promise<number> {
    try {
      const taskSessions = await this.getByTaskId(taskId);
      let deletedCount = 0;

      for (const session of taskSessions) {
        const success = await this.delete(session.id);
        if (success) deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to delete sessions by task ID:', error);
      return 0;
    }
  }

  // Get current session duration (for active sessions)
  public getCurrentSessionDuration(session: TimeSession): number {
    if (session.endTime) {
      return session.duration || 0;
    }

    const now = new Date();
    const startTime = new Date(session.startTime);
    return Math.floor((now.getTime() - startTime.getTime()) / 1000);
  }
}

// Export singleton instance
export const timeSessionRepository = new TimeSessionRepository();