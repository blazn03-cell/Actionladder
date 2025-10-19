import { Request, Response } from 'express';
import type { IStorage } from '../storage';
import { ICalService } from '../services/icalService';

/**
 * Verify that the authenticated user can access the specified player's data
 * @param req Express request with authenticated user
 * @param playerId The player ID being accessed
 * @param storage Storage instance
 * @returns Promise<boolean> true if authorized
 */
export async function verifyPlayerAccess(req: any, playerId: string, storage: IStorage): Promise<boolean> {
  try {
    if (!req.isAuthenticated()) {
      return false;
    }

    const user = req.user as any;
    let dbUser;

    // Get user from database based on auth type
    if (user.claims?.sub) {
      // OIDC user
      dbUser = await storage.getUser(user.claims.sub);
    } else if (user.id) {
      // Password auth user
      dbUser = await storage.getUser(user.id);
    }

    if (!dbUser) {
      return false;
    }

    // Store for later use
    req.dbUser = dbUser;

    // Admin roles can access any player's data
    if (['OWNER', 'STAFF', 'OPERATOR'].includes(dbUser.globalRole || '')) {
      return true;
    }

    // Regular users can only access their own data
    // Check if the authenticated user corresponds to the requested playerId
    const player = await storage.getPlayerByUserId(dbUser.id);
    if (player && player.id === playerId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying player access:', error);
    return false;
  }
}

/**
 * Sanitize token data for safe API responses
 * Never expose the full token value except during creation
 */
export function sanitizeTokenResponse(token: any) {
  return {
    id: token.id,
    name: token.name,
    tokenPreview: token.token ? `****${token.token.slice(-4)}` : '****',
    isActive: token.isActive,
    lastUsedAt: token.lastUsedAt,
    useCount: token.useCount,
    createdAt: token.createdAt,
    expiresAt: token.expiresAt,
    revokedAt: token.revokedAt,
    hallId: token.hallId,
    includeCompleted: token.includeCompleted
  };
}

// Public challenge calendar feed (no auth required)
export function getPublicFeed(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const icalService = new ICalService(storage);
      const icalData = await icalService.generatePublicCalendar();
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="actionladder-public.ics"');
      res.setHeader('Cache-Control', 'private, max-age=600'); // 10 minutes cache
      res.send(icalData);
    } catch (error) {
      console.error('Error generating public iCal feed:', error);
      res.status(500).json({ error: 'Failed to generate calendar feed' });
    }
  };
}

// Player-specific calendar feed (with secure authentication)
export function getPlayerFeed(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { player, hall, completed, start, end, token } = req.query;
      
      if (!player || !token) {
        return res.status(400).json({ error: 'Player ID and authentication token required' });
      }

      const icalService = new ICalService(storage);
      // Validate secure authentication token using database lookup
      const isValidToken = await icalService.validateFeedToken(token as string, player as string);
      if (!isValidToken) {
        return res.status(401).json({ error: 'Invalid or expired authentication token' });
      }

      const options = {
        playerId: player as string,
        hallId: hall as string | undefined,
        includeCompleted: completed === 'true',
        startDate: start ? new Date(start as string) : undefined,
        endDate: end ? new Date(end as string) : undefined,
      };

      const icalData = await icalService.generateChallengeCalendar(options);
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="actionladder-${player}.ics"`);
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes cache for personal feeds
      res.send(icalData);
    } catch (error) {
      console.error('Error generating player iCal feed:', error);
      res.status(500).json({ error: 'Failed to generate calendar feed' });
    }
  };
}

// Pool hall calendar feed
export function getHallFeed(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const icalService = new ICalService(storage);
      const icalData = await icalService.generateHallCalendar(hallId);
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="actionladder-hall-${hallId}.ics"`);
      res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes cache
      res.send(icalData);
    } catch (error) {
      console.error('Error generating hall iCal feed:', error);
      res.status(500).json({ error: 'Failed to generate calendar feed' });
    }
  };
}

// Individual challenge iCal
export function getChallengeFeed(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const icalService = new ICalService(storage);
      const icalData = await icalService.generateChallengeIcal(challengeId);
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="challenge-${challengeId}.ics"`);
      res.setHeader('Cache-Control', 'private, max-age=3600'); // 1 hour cache
      res.send(icalData);
    } catch (error) {
      console.error('Error generating challenge iCal:', error);
      if (error instanceof Error && error.message === 'Challenge not found') {
        res.status(404).json({ error: 'Challenge not found' });
      } else {
        res.status(500).json({ error: 'Failed to generate calendar event' });
      }
    }
  };
}

// Upcoming challenges for a player (next 30 days) with secure authentication
export function getUpcomingFeed(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ error: 'Authentication token required' });
      }

      const icalService = new ICalService(storage);
      // Validate secure authentication token using database lookup
      const isValidToken = await icalService.validateFeedToken(token as string, playerId);
      if (!isValidToken) {
        return res.status(401).json({ error: 'Invalid or expired authentication token' });
      }

      const icalData = await icalService.generateUpcomingChallenges(playerId);
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="actionladder-upcoming-${playerId}.ics"`);
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes cache
      res.send(icalData);
    } catch (error) {
      console.error('Error generating upcoming challenges iCal:', error);
      res.status(500).json({ error: 'Failed to generate upcoming challenges feed' });
    }
  };
}

// Generate secure feed URL for a player (returns the subscription URL with secure token)
// SECURITY: Requires authentication and authorization
export function generateFeedUrl(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const { hall, completed, start, end, tokenName } = req.query;
      
      // SECURITY CHECK: Verify user can access this player's data
      const hasAccess = await verifyPlayerAccess(req, playerId, storage);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied. You can only generate tokens for your own account.' 
        });
      }
      
      const options = {
        hallId: hall as string | undefined,
        includeCompleted: completed === 'true',
        startDate: start ? new Date(start as string) : undefined,
        endDate: end ? new Date(end as string) : undefined,
      };

      const icalService = new ICalService(storage);
      const feedUrl = await icalService.generateFeedUrl(playerId, options, tokenName as string | undefined);
      
      res.json({
        playerId,
        feedUrl,
        security: {
          tokenType: 'cryptographically secure',
          expires: '1 year',
          revocable: true,
        },
        instructions: {
          apple: 'In Calendar app, go to File > New Calendar Subscription and paste the URL',
          google: 'In Google Calendar, click + next to "Other calendars" > "From URL" and paste the URL',
          outlook: 'In Outlook, go to Calendar > Add Calendar > Subscribe from web and paste the URL',
          thunderbird: 'In Thunderbird, go to Events and Tasks > Subscribe to Remote Calendar and paste the URL',
        },
        note: 'This feed uses secure authentication tokens and updates automatically. The token can be revoked if needed.',
        warning: 'SECURITY: Keep your calendar subscription URL secure. Do not share it publicly.',
      });
    } catch (error) {
      console.error('Error generating feed URL:', error);
      res.status(500).json({ error: 'Failed to generate feed URL' });
    }
  };
}

// Token management - Get all tokens for a player
// SECURITY: Requires authentication and authorization
export function getPlayerTokens(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      
      // SECURITY CHECK: Verify user can access this player's data
      const hasAccess = await verifyPlayerAccess(req, playerId, storage);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied. You can only view tokens for your own account.' 
        });
      }
      
      const icalService = new ICalService(storage);
      const tokens = await icalService.getPlayerFeedTokens(playerId);
      
      // SECURITY: Sanitize token responses to hide raw token values
      const sanitizedTokens = tokens.map(sanitizeTokenResponse);
      
      res.json({
        playerId,
        tokens: sanitizedTokens,
        count: sanitizedTokens.length,
        security: {
          note: 'Token values are hidden for security. Only the last 4 characters are shown.',
          fullTokensShown: false,
        },
      });
    } catch (error) {
      console.error('Error retrieving player feed tokens:', error);
      res.status(500).json({ error: 'Failed to retrieve feed tokens' });
    }
  };
}

// Token management - Revoke a specific token
// SECURITY: Requires authentication and authorization
export function revokeToken(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { token, reason } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }
      
      const icalService = new ICalService(storage);
      // SECURITY CHECK: Verify the token belongs to the authenticated user
      const tokenData = await icalService.getTokenByValue(token);
      if (!tokenData) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      const hasAccess = await verifyPlayerAccess(req, tokenData.playerId, storage);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied. You can only revoke your own tokens.' 
        });
      }
      
      const user = req.user as any;
      const revokedBy = user.claims?.sub || user.id || 'authenticated_user';
      
      const revoked = await icalService.revokeFeedToken(
        token, 
        revokedBy, 
        reason || 'User requested revocation'
      );
      
      if (revoked) {
        res.json({ 
          success: true, 
          message: 'Token revoked successfully',
          tokenPreview: `****${token.slice(-4)}`,
          revokedAt: new Date().toISOString(),
        });
      } else {
        res.status(404).json({ 
          error: 'Token not found or already revoked' 
        });
      }
    } catch (error) {
      console.error('Error revoking feed token:', error);
      res.status(500).json({ error: 'Failed to revoke token' });
    }
  };
}

// Admin endpoint - Clean up expired tokens
// SECURITY: Requires staff or owner privileges
export function cleanupExpiredTokens(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const icalService = new ICalService(storage);
      const cleanedCount = await icalService.cleanupExpiredTokens();
      
      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired tokens`,
        cleanedCount,
        performedBy: req.dbUser?.email || 'admin',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      res.status(500).json({ error: 'Failed to cleanup expired tokens' });
    }
  };
}

// Calendar subscription info endpoint
export function getCalendarInfo(req: Request, res: Response) {
  res.json({
    name: 'ActionLadder Challenge Calendar',
    description: 'Professional Billiards League - "In here, respect is earned in racks, not words"',
    version: '2.0.0', // Updated version for secure tokens
    timezone: 'America/New_York',
    supportedFormats: ['iCal (.ics)'],
    security: {
      tokenType: 'cryptographically secure',
      tokenLength: '256 bits',
      storage: 'database-backed',
      features: ['expiration', 'revocation', 'usage tracking'],
    },
    feedTypes: {
      public: {
        url: '/api/ical/public',
        description: 'Public challenges feed (no authentication)',
        cacheDuration: '10 minutes',
      },
      player: {
        url: '/api/ical/player?player={playerId}&token={secureToken}',
        description: 'Player-specific challenges feed (requires secure authentication)',
        cacheDuration: '5 minutes',
        security: 'secure token required',
      },
      hall: {
        url: '/api/ical/hall/{hallId}',
        description: 'Pool hall-specific challenges feed',
        cacheDuration: '10 minutes',
      },
      upcoming: {
        url: '/api/ical/upcoming/{playerId}?token={secureToken}',
        description: 'Upcoming challenges for player (next 30 days)',
        cacheDuration: '5 minutes',
        security: 'secure token required',
      },
      challenge: {
        url: '/api/ical/challenge/{challengeId}',
        description: 'Individual challenge event',
        cacheDuration: '1 hour',
      },
    },
    tokenManagement: {
      generate: 'Use /api/ical/feed-url/{playerId} to generate secure subscription URL',
      list: 'Use /api/ical/tokens/{playerId} to list all tokens for a player',
      revoke: 'Use POST /api/ical/tokens/revoke with token in body',
      cleanup: 'Use POST /api/ical/cleanup-expired (admin)',
    },
    instructions: 'Use /api/ical/feed-url/{playerId} to get personalized subscription URL with secure token and setup instructions',
  });
}
