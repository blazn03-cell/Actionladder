import type { Express } from "express";
import * as hallController from "../controllers/hall.controller";

export function registerHallRoutes(app: Express) {
  
  // Get all pool halls with standings (only shows unlocked halls for battles)
  app.get("/api/halls", hallController.getAllHalls);

  // Get specific hall details
  app.get("/api/halls/:hallId", hallController.getHallDetails);

  // Get all hall matches (only for unlocked halls)
  app.get("/api/hall-matches", hallController.getAllHallMatches);

  // Create new hall match
  app.post("/api/hall-matches", hallController.createHallMatch);

  // Update hall match (for scoring and completion)
  app.patch("/api/hall-matches/:matchId", hallController.updateHallMatch);

  // Get hall roster
  app.get("/api/halls/:hallId/roster", hallController.getHallRoster);

  // Add player to hall roster
  app.post("/api/halls/:hallId/roster", hallController.addPlayerToRoster);

  // Remove player from hall roster
  app.delete("/api/halls/:hallId/roster/:rosterId", hallController.removePlayerFromRoster);

  // Get hall statistics and head-to-head records
  app.get("/api/halls/:hallId/stats", hallController.getHallStats);

  // Admin endpoint to unlock hall battles
  app.post("/api/admin/halls/:hallId/unlock-battles", hallController.unlockHallBattles);

  // Admin endpoint to lock hall battles
  app.post("/api/admin/halls/:hallId/lock-battles", hallController.lockHallBattles);

  // Admin endpoint to get hall battles status
  app.get("/api/admin/halls/battles-status", hallController.getBattlesStatus);
}
