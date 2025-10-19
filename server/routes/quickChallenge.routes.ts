import { Express } from "express";
import * as quickChallengeController from "../controllers/quickChallenge.controller";

export function registerQuickChallengeRoutes(app: Express) {
  
  // Quick Challenge endpoint - simplified challenge creation
  app.post("/api/quick-challenge", quickChallengeController.createQuickChallenge);

  // Get quick challenge suggestions (nearby players, similar skill level)
  app.get("/api/quick-challenge/suggestions", quickChallengeController.getQuickChallengeSuggestions);

}
