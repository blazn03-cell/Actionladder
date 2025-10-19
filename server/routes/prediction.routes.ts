import type { Express } from "express";
import { IStorage } from "../storage";
import { sanitizeBody } from "../utils/sanitize";
import * as predictionController from "../controllers/prediction.controller";

export function setupPredictionRoutes(app: Express, storage: IStorage) {
  // ==================== SEASON PREDICTION ROUTES ====================
  app.get("/api/season-predictions", 
    predictionController.getSeasonPredictions(storage)
  );
  
  app.get("/api/season-predictions/status/:status", 
    predictionController.getSeasonPredictionsByStatus(storage)
  );
  
  app.post("/api/season-predictions", 
    sanitizeBody(["name", "description"]), 
    predictionController.createSeasonPrediction(storage)
  );
  
  app.put("/api/season-predictions/:id", 
    sanitizeBody(["name", "description"]), 
    predictionController.updateSeasonPrediction(storage)
  );

  // ==================== PREDICTION ENTRY ROUTES ====================
  app.get("/api/prediction-entries", 
    predictionController.getPredictionEntries(storage)
  );
  
  app.get("/api/season-predictions/:predictionId/entries", 
    predictionController.getPredictionEntriesByPrediction(storage)
  );
  
  app.post("/api/prediction-entries", 
    predictionController.createPredictionEntry(storage)
  );
}
