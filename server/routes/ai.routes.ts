import type { Express } from "express";
import * as aiController from "../controllers/ai.controller";

export function setupAIRoutes(app: Express) {
  app.post("/api/ai/coaching", 
    aiController.coaching()
  );

  app.post("/api/ai/community-chat", 
    aiController.communityChat()
  );

  app.post("/api/ai/match-commentary", 
    aiController.matchCommentary()
  );

  app.post("/api/ai/match-prediction", 
    aiController.matchPrediction()
  );

  app.get("/api/ai/opponent-suggestions/:playerId", 
    aiController.opponentSuggestions()
  );

  app.get("/api/ai/performance-analysis/:playerId", 
    aiController.performanceAnalysis()
  );
}
