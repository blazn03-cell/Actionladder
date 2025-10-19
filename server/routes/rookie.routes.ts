import type { Express } from "express";
import { IStorage } from "../storage";
import * as rookieController from "../controllers/rookie.controller";

export function setupRookieRoutes(app: Express, storage: IStorage) {
  app.get("/api/rookie/matches", 
    rookieController.getAllRookieMatches(storage)
  );

  app.get("/api/rookie/matches/player/:playerId", 
    rookieController.getRookieMatchesByPlayer(storage)
  );

  app.post("/api/rookie/matches", 
    rookieController.createRookieMatch(storage)
  );

  app.put("/api/rookie/matches/:id/complete", 
    rookieController.completeRookieMatch(storage)
  );

  app.get("/api/rookie/events", 
    rookieController.getAllRookieEvents(storage)
  );

  app.post("/api/rookie/events", 
    rookieController.createRookieEvent(storage)
  );

  app.get("/api/rookie/leaderboard", 
    rookieController.getRookieLeaderboard(storage)
  );

  app.get("/api/rookie/achievements/:playerId", 
    rookieController.getRookieAchievements(storage)
  );

  app.get("/api/rookie/subscription/:playerId", 
    rookieController.getRookieSubscription(storage)
  );

  app.post("/api/rookie/subscription", 
    rookieController.createRookieSubscription(storage)
  );
}
