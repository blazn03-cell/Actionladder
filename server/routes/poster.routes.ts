import { Router } from 'express';
import type { IStorage } from '../storage';
import * as posterController from '../controllers/poster.controller';

export function createPosterRoutes(storage: IStorage): Router {
  const router = Router();

  // Generate poster data for a specific challenge
  router.get('/challenge/:challengeId', posterController.generatePosterForChallenge(storage));

  // Generate AI content for a challenge poster
  router.get('/content/:challengeId', posterController.generatePosterContent(storage));

  // Get available templates and themes
  router.get('/options', posterController.getPosterOptions);

  // Generate poster for upcoming challenges (batch)
  router.get('/upcoming', posterController.generateUpcomingPosters(storage));

  // Regenerate AI content for existing poster
  router.post('/regenerate/:challengeId', posterController.regeneratePoster(storage));

  return router;
}
