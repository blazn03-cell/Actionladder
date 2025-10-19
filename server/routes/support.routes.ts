import type { Express } from "express";
import { IStorage } from "../storage";
import * as supportController from "../controllers/support.controller";

export function setupSupportRoutes(app: Express, storage: IStorage) {
  app.get("/api/support-requests", 
    supportController.getSupportRequests(storage)
  );

  app.post("/api/support-requests", 
    supportController.createSupportRequest(storage)
  );

  app.put("/api/support-requests/:id", 
    supportController.updateSupportRequest(storage)
  );
}
