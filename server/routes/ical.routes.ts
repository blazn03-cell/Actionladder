import { Router } from 'express';
import type { IStorage } from '../storage';
import { requireAnyAuth, requireStaffOrOwner } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimitMiddleware';
import * as icalController from '../controllers/ical.controller';

export function createICalRoutes(storage: IStorage): Router {
  const router = Router();

  // Rate limiter for token management operations
  const tokenRateLimit = createRateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 token operations per 10 minutes per IP
    message: "Too many token operations, please try again later",
    keyGenerator: (req) => `${req.ip || 'unknown'}-${req.user ? (req.user as any).claims?.sub || (req.user as any).id || 'unknown' : 'anonymous'}`
  });

  // Rate limiter for feed generation
  const feedRateLimit = createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 feed generations per 5 minutes per user
    message: "Too many feed requests, please try again later",
    keyGenerator: (req) => `${req.ip || 'unknown'}-${req.user ? (req.user as any).claims?.sub || (req.user as any).id || 'unknown' : 'anonymous'}`
  });

  // Public challenge calendar feed (no auth required)
  router.get('/public', icalController.getPublicFeed(storage));

  // Player-specific calendar feed (with secure authentication)
  router.get('/player', icalController.getPlayerFeed(storage));

  // Pool hall calendar feed
  router.get('/hall/:hallId', icalController.getHallFeed(storage));

  // Individual challenge iCal
  router.get('/challenge/:challengeId', icalController.getChallengeFeed(storage));

  // Upcoming challenges for a player (next 30 days) with secure authentication
  router.get('/upcoming/:playerId', icalController.getUpcomingFeed(storage));

  // Generate secure feed URL for a player (returns the subscription URL with secure token)
  // SECURITY: Requires authentication and authorization
  router.get('/feed-url/:playerId', [feedRateLimit, requireAnyAuth], icalController.generateFeedUrl(storage));

  // Token management - Get all tokens for a player
  // SECURITY: Requires authentication and authorization
  router.get('/tokens/:playerId', [tokenRateLimit, requireAnyAuth], icalController.getPlayerTokens(storage));

  // Token management - Revoke a specific token
  // SECURITY: Requires authentication and authorization
  router.post('/tokens/revoke', [tokenRateLimit, requireAnyAuth], icalController.revokeToken(storage));

  // Admin endpoint - Clean up expired tokens
  // SECURITY: Requires staff or owner privileges
  router.post('/cleanup-expired', [tokenRateLimit, requireStaffOrOwner], icalController.cleanupExpiredTokens(storage));

  // Calendar subscription info endpoint
  router.get('/info', icalController.getCalendarInfo);

  return router;
}
