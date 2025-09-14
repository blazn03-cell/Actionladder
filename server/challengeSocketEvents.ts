import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { IStorage } from './storage';

export interface ChallengeSocketEvents {
  // Events emitted by client
  'join-challenge': (challengeId: string) => void;
  'leave-challenge': (challengeId: string) => void;
  'player-ready': (data: { challengeId: string; playerId: string }) => void;
  
  // Events emitted by server
  'challenge-updated': (data: {
    challengeId: string;
    status: string;
    checkedInPlayers: string[];
    bothPlayersReady: boolean;
  }) => void;
  'player-checked-in': (data: {
    challengeId: string;
    playerId: string;
    checkedInAt: Date;
    message: string;
  }) => void;
  'challenge-started': (data: {
    challengeId: string;
    startedAt: Date;
    message: string;
  }) => void;
  'fee-applied': (data: {
    challengeId: string;
    playerId: string;
    feeType: string;
    amount: number;
    reason: string;
  }) => void;
  'error': (data: { message: string }) => void;
}

export class ChallengeSocketManager {
  private io: SocketIOServer;
  private storage: IStorage;

  constructor(httpServer: HTTPServer, storage: IStorage) {
    this.storage = storage;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: '/socket.io'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join challenge room for real-time updates
      socket.on('join-challenge', (challengeId: string) => {
        socket.join(`challenge:${challengeId}`);
        console.log(`Client ${socket.id} joined challenge room: ${challengeId}`);
      });

      // Leave challenge room
      socket.on('leave-challenge', (challengeId: string) => {
        socket.leave(`challenge:${challengeId}`);
        console.log(`Client ${socket.id} left challenge room: ${challengeId}`);
      });

      // Handle player ready status
      socket.on('player-ready', async (data: { challengeId: string; playerId: string }) => {
        try {
          const challenge = await this.storage.getChallenge(data.challengeId);
          if (challenge) {
            this.emitChallengeUpdate(data.challengeId);
          }
        } catch (error) {
          console.error('Error handling player ready:', error);
          socket.emit('error', { message: 'Failed to update player status' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit when a player checks in to a challenge
   */
  async emitPlayerCheckIn(challengeId: string, playerId: string, checkedInAt: Date, message: string) {
    try {
      this.io.to(`challenge:${challengeId}`).emit('player-checked-in', {
        challengeId,
        playerId,
        checkedInAt,
        message
      });

      // Also emit general challenge update
      await this.emitChallengeUpdate(challengeId);
    } catch (error) {
      console.error('Error emitting player check-in:', error);
    }
  }

  /**
   * Emit when challenge status changes (both players checked in, started, etc.)
   */
  async emitChallengeUpdate(challengeId: string) {
    try {
      const challenge = await this.storage.getChallenge(challengeId);
      if (!challenge) return;

      const checkIns = await this.storage.getChallengeCheckInsByChallenge(challengeId);
      const checkedInPlayers = checkIns.map(ci => ci.playerId);
      const bothPlayersReady = checkIns.length === 2;

      this.io.to(`challenge:${challengeId}`).emit('challenge-updated', {
        challengeId,
        status: challenge.status,
        checkedInPlayers,
        bothPlayersReady
      });

      // If challenge just started, emit special event
      if (challenge.status === 'in_progress' && bothPlayersReady) {
        this.io.to(`challenge:${challengeId}`).emit('challenge-started', {
          challengeId,
          startedAt: challenge.checkedInAt || new Date(),
          message: 'Challenge has begun! Both players are ready.'
        });
      }
    } catch (error) {
      console.error('Error emitting challenge update:', error);
    }
  }

  /**
   * Emit when a fee is applied to a player
   */
  emitFeeApplied(challengeId: string, playerId: string, feeType: string, amount: number, reason: string) {
    try {
      this.io.to(`challenge:${challengeId}`).emit('fee-applied', {
        challengeId,
        playerId,
        feeType,
        amount,
        reason
      });

      // Also emit to general admin/operator rooms if needed
      this.io.emit('admin-notification', {
        type: 'fee-applied',
        challengeId,
        playerId,
        feeType,
        amount,
        reason,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error emitting fee notification:', error);
    }
  }

  /**
   * Emit general notifications to all connected clients
   */
  emitGlobalNotification(type: string, data: any) {
    try {
      this.io.emit('global-notification', {
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error emitting global notification:', error);
    }
  }

  /**
   * Get connected clients count for a challenge
   */
  getChallengeRoomSize(challengeId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`challenge:${challengeId}`);
    return room ? room.size : 0;
  }

  /**
   * Get total connected clients
   */
  getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Send challenge reminder to players
   */
  async sendChallengeReminder(challengeId: string, message: string) {
    try {
      this.io.to(`challenge:${challengeId}`).emit('challenge-reminder', {
        challengeId,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending challenge reminder:', error);
    }
  }

  /**
   * Notify about challenge cancellation
   */
  emitChallengeCancellation(challengeId: string, reason: string, cancelledBy: string) {
    try {
      this.io.to(`challenge:${challengeId}`).emit('challenge-cancelled', {
        challengeId,
        reason,
        cancelledBy,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error emitting challenge cancellation:', error);
    }
  }
}

// Global socket manager instance
let socketManager: ChallengeSocketManager | null = null;

export function initializeSocketManager(httpServer: HTTPServer, storage: IStorage): ChallengeSocketManager {
  if (!socketManager) {
    socketManager = new ChallengeSocketManager(httpServer, storage);
    console.log('Challenge Socket Manager initialized');
  }
  return socketManager;
}

export function getSocketManager(): ChallengeSocketManager | null {
  return socketManager;
}