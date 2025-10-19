import ical, { ICalEventStatus, ICalAlarmType, ICalAttendeeRole, ICalAttendeeStatus } from 'ical-generator';
import { randomBytes } from 'crypto';
import type { IStorage } from '../storage';
import type { Challenge } from '@shared/schema';

export interface ICalOptions {
  playerId?: string;
  hallId?: string;
  startDate?: Date;
  endDate?: Date;
  includeCompleted?: boolean;
}

export class ICalService {
  constructor(private storage: IStorage) {}

  /**
   * Generate iCal feed for challenges
   */
  async generateChallengeCalendar(options: ICalOptions = {}): Promise<string> {
    // Get challenges using date range or upcoming challenges
    let challenges: Challenge[];
    if (options.startDate && options.endDate) {
      challenges = await this.storage.getChallengesByDateRange(options.startDate, options.endDate);
    } else {
      // Get upcoming challenges for the next 90 days
      const now = new Date();
      const futureDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
      challenges = await this.storage.getChallengesByDateRange(now, futureDate);
    }
    
    // Filter challenges based on options
    const filteredChallenges = challenges.filter(challenge => {
      // Filter by player
      if (options.playerId && 
          challenge.aPlayerId !== options.playerId && 
          challenge.bPlayerId !== options.playerId) {
        return false;
      }
      
      // Filter by hall
      if (options.hallId && challenge.hallId !== options.hallId) {
        return false;
      }
      
      // Filter by date range
      const challengeDate = new Date(challenge.scheduledAt);
      if (options.startDate && challengeDate < options.startDate) {
        return false;
      }
      if (options.endDate && challengeDate > options.endDate) {
        return false;
      }
      
      // Filter by completion status
      if (!options.includeCompleted && challenge.status === 'completed') {
        return false;
      }
      
      return true;
    });

    return this.generateICalFromChallenges(filteredChallenges);
  }

  /**
   * Generate iCal for a specific challenge
   */
  async generateChallengeIcal(challengeId: string): Promise<string> {
    const challenge = await this.storage.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    return this.generateICalFromChallenges([challenge]);
  }

  /**
   * Generate iCal for upcoming challenges (next 30 days)
   */
  async generateUpcomingChallenges(playerId?: string): Promise<string> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    return this.generateChallengeCalendar({
      playerId,
      startDate: now,
      endDate: thirtyDaysFromNow,
      includeCompleted: false,
    });
  }

  /**
   * Core iCal generation from challenge data
   */
  private generateICalFromChallenges(challenges: Challenge[]): string {
    const calendar = ical({
      name: 'ActionLadder Challenge Calendar',
      description: 'Professional Billiards League - "In here, respect is earned in racks, not words"',
      timezone: 'America/New_York', // Default timezone, should be configurable
      url: `${process.env.REPLIT_DOMAINS || 'localhost:5000'}/api/ical/challenges`,
      ttl: 60 * 10, // 10 minutes cache
    });

    challenges.forEach(challenge => {
      const event = calendar.createEvent({
        id: challenge.id,
        start: new Date(challenge.scheduledAt),
        end: new Date(new Date(challenge.scheduledAt).getTime() + (2 * 60 * 60 * 1000)), // 2 hour duration
        summary: this.generateChallengeTitle(challenge),
        description: this.formatChallengeDescription(challenge),
        location: `Pool Hall: ${challenge.hallId}`,
        url: `${process.env.REPLIT_DOMAINS || 'localhost:5000'}/challenges/${challenge.id}`,
        categories: [
          { name: 'Billiards' },
          { name: 'League' },
          { name: challenge.status }
        ],
        status: this.mapChallengeStatusToIcal(challenge.status),
        organizer: {
          name: 'ActionLadder League',
          email: 'league@actionladder.com',
        },
        attendees: [
          {
            name: challenge.aPlayerId,
            email: `${challenge.aPlayerId}@actionladder.com`,
            role: ICalAttendeeRole.REQ,
            status: this.getPlayerCheckInStatus(challenge, challenge.aPlayerId),
          },
          {
            name: challenge.bPlayerId,
            email: `${challenge.bPlayerId}@actionladder.com`,
            role: ICalAttendeeRole.REQ,
            status: this.getPlayerCheckInStatus(challenge, challenge.bPlayerId),
          }
        ],
        alarms: [
          {
            type: ICalAlarmType.display,
            trigger: 3600, // 1 hour before
            description: `Challenge starting in 1 hour: ${this.generateChallengeTitle(challenge)}`,
          },
          {
            type: ICalAlarmType.display,
            trigger: 1800, // 30 minutes before
            description: `Challenge starting in 30 minutes: ${this.generateChallengeTitle(challenge)}`,
          }
        ],
      });

      // Add custom properties for ActionLadder using description field
      // Note: Custom properties are not directly supported, so we add them to description
      const existingDescription = event.description();
      const customProps = `\n\nActionLadder Properties:\nChallenge ID: ${challenge.id}\nStatus: ${challenge.status}${challenge.winnerId ? `\nWinner: ${challenge.winnerId}` : ''}`;
      event.description(existingDescription + customProps);
    });

    return calendar.toString();
  }

  /**
   * Generate challenge title from challenge data
   */
  private generateChallengeTitle(challenge: Challenge): string {
    return `${challenge.aPlayerName} vs ${challenge.bPlayerName} - ${challenge.gameType} (${challenge.tableType})`;
  }

  /**
   * Format challenge description for iCal
   */
  private formatChallengeDescription(challenge: Challenge): string {
    let description = `ActionLadder Professional Billiards League\n\n`;
    description += `Match: ${challenge.aPlayerId} vs ${challenge.bPlayerId}\n`;
    description += `Pool Hall: ${challenge.hallId}\n`;
    description += `Status: ${challenge.status.toUpperCase()}\n`;
    
    if (challenge.description) {
      description += `\nDetails: ${challenge.description}\n`;
    }
    
    description += `\nScheduled: ${new Date(challenge.scheduledAt).toLocaleString()}\n`;
    
    if (challenge.checkedInAt) {
      description += `Check-in: ${new Date(challenge.checkedInAt).toLocaleString()}\n`;
    }
    
    if (challenge.completedAt) {
      description += `Completed: ${new Date(challenge.completedAt).toLocaleString()}\n`;
    }
    
    if (challenge.winnerId) {
      description += `Winner: ${challenge.winnerId}\n`;
    }
    
    description += `\n"In here, respect is earned in racks, not words"\n`;
    description += `Join the league: ${process.env.REPLIT_DOMAINS || 'localhost:5000'}/player-subscription`;
    
    return description;
  }

  /**
   * Map ActionLadder status to iCal status
   */
  private mapChallengeStatusToIcal(status: string): ICalEventStatus {
    switch (status) {
      case 'scheduled':
        return ICalEventStatus.CONFIRMED;
      case 'in_progress':
        return ICalEventStatus.CONFIRMED;
      case 'completed':
        return ICalEventStatus.CONFIRMED;
      case 'cancelled':
        return ICalEventStatus.CANCELLED;
      default:
        return ICalEventStatus.TENTATIVE;
    }
  }

  /**
   * Get player check-in status for iCal attendee
   */
  private getPlayerCheckInStatus(challenge: Challenge, playerId: string): ICalAttendeeStatus {
    if (challenge.status === 'cancelled') {
      return ICalAttendeeStatus.DECLINED;
    }
    
    if (challenge.checkedInAt) {
      return ICalAttendeeStatus.ACCEPTED;
    }
    
    if (challenge.status === 'scheduled') {
      return ICalAttendeeStatus.TENTATIVE;
    }
    
    return ICalAttendeeStatus.ACCEPTED;
  }

  /**
   * Generate calendar feed URL with secure authentication token
   */
  async generateFeedUrl(playerId: string, options: ICalOptions = {}, tokenName?: string): Promise<string> {
    const baseUrl = process.env.REPLIT_DOMAINS || 'localhost:5000';
    const params = new URLSearchParams();
    
    params.append('player', playerId);
    
    if (options.hallId) params.append('hall', options.hallId);
    if (options.includeCompleted) params.append('completed', 'true');
    if (options.startDate) params.append('start', options.startDate.toISOString());
    if (options.endDate) params.append('end', options.endDate.toISOString());
    
    // Generate cryptographically secure token
    const secureToken = await this.createSecureFeedToken(playerId, {
      name: tokenName,
      hallId: options.hallId,
      includeCompleted: options.includeCompleted,
    });
    
    params.append('token', secureToken);
    
    return `${baseUrl}/api/ical/player?${params.toString()}`;
  }

  /**
   * Validate secure authentication token using database lookup
   */
  async validateFeedToken(token: string, playerId: string): Promise<boolean> {
    try {
      const feedToken = await this.storage.getIcalFeedTokenByToken(token);
      
      if (!feedToken) {
        return false;
      }
      
      // Verify the token belongs to the requested player
      if (feedToken.playerId !== playerId) {
        return false;
      }
      
      // Check if token is active and not revoked
      if (!feedToken.isActive || feedToken.revokedAt) {
        return false;
      }
      
      // Check if token has expired
      if (feedToken.expiresAt && feedToken.expiresAt < new Date()) {
        return false;
      }
      
      // Mark token as used for tracking
      await this.storage.markTokenUsed(token);
      
      return true;
    } catch (error) {
      console.error('Error validating iCal feed token:', error);
      return false;
    }
  }

  /**
   * Generate calendar for a specific pool hall
   */
  async generateHallCalendar(hallId: string): Promise<string> {
    return this.generateChallengeCalendar({
      hallId,
      includeCompleted: false,
    });
  }

  /**
   * Generate public calendar feed (no authentication required)
   */
  async generatePublicCalendar(): Promise<string> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // Next 90 days

    return this.generateChallengeCalendar({
      startDate: now,
      endDate: futureDate,
      includeCompleted: false,
    });
  }

  /**
   * Create a secure feed token for a player
   */
  private async createSecureFeedToken(playerId: string, options: { name?: string; hallId?: string; includeCompleted?: boolean }): Promise<string> {
    // Generate cryptographically secure random token (256 bits)
    const secureToken = randomBytes(32).toString('base64url'); // URL-safe base64

    // Store token in database
    await this.storage.createIcalFeedToken({
      playerId,
      token: secureToken,
      name: options.name || 'Calendar Subscription',
      hallId: options.hallId,
      includeCompleted: options.includeCompleted || false,
      isActive: true,
      // Set expiration to 1 year from now (configurable)
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return secureToken;
  }

  /**
   * Revoke a feed token by token value
   */
  async revokeFeedToken(token: string, revokedBy: string, reason?: string): Promise<boolean> {
    const feedToken = await this.storage.getIcalFeedTokenByToken(token);
    if (!feedToken) {
      return false;
    }

    const revoked = await this.storage.revokeIcalFeedToken(feedToken.id, revokedBy, reason);
    return !!revoked;
  }

  /**
   * Get all feed tokens for a player
   */
  async getPlayerFeedTokens(playerId: string): Promise<any[]> {
    const tokens = await this.storage.getIcalFeedTokensByPlayer(playerId);
    // Return sanitized token info (without the actual token value)
    return tokens.map(token => ({
      id: token.id,
      name: token.name,
      isActive: token.isActive,
      lastUsedAt: token.lastUsedAt,
      useCount: token.useCount,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    }));
  }

  /**
   * Get a token by its value for authorization checks
   */
  async getTokenByValue(token: string): Promise<any | null> {
    try {
      return await this.storage.getIcalFeedTokenByToken(token);
    } catch (error) {
      console.error('Error retrieving token by value:', error);
      return null;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await this.storage.cleanupExpiredTokens();
  }
}