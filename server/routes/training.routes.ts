import type { Express } from "express";
import { IStorage } from "../storage";
import * as trainingController from "../controllers/training.controller";

export function setupTrainingRoutes(app: Express, storage: IStorage) {
  app.post("/api/training/sessions", 
    trainingController.createTrainingSession(storage)
  );

  app.post("/api/training/sessions/:id/shots", 
    trainingController.recordShots(storage)
  );

  app.get("/api/training/sessions/:id/insights", 
    trainingController.getSessionInsights(storage)
  );

  app.get("/api/training/player/:playerId/sessions", 
    trainingController.getPlayerSessions(storage)
  );

  app.get("/api/training/hall/:hallId/leaderboard", 
    trainingController.getHallLeaderboard(storage)
  );

  app.post("/api/training/rewards/monthly", 
    trainingController.calculateMonthlyRewards(storage)
  );

  app.get("/api/training/rewards/history", 
    trainingController.getRewardHistory(storage)
  );

  app.post("/api/admin/trigger-monthly-rewards", 
    trainingController.triggerMonthlyRewards(storage)
  );
}
