import type { Express } from "express";
import { IStorage } from "../storage";
import * as streamController from "../controllers/stream.controller";

export function setupStreamRoutes(app: Express, storage: IStorage) {
  app.get("/api/live-streams", 
    streamController.getLiveStreams(storage)
  );

  app.post("/api/live-streams", 
    streamController.createLiveStream(storage)
  );

  app.put("/api/live-streams/:id", 
    streamController.updateLiveStream(storage)
  );

  app.delete("/api/live-streams/:id", 
    streamController.deleteLiveStream(storage)
  );

  app.get("/api/live-streams/by-location", 
    streamController.getLiveStreamsByLocation(storage)
  );

  app.get("/api/live-streams/stats", 
    streamController.getLiveStreamStats(storage)
  );
}
