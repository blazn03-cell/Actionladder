import type { Express } from "express";
import { IStorage } from "../storage";
import * as checkinController from "../controllers/checkin.controller";
import { sanitizeBody } from "../utils/sanitize";

export function setupCheckinRoutes(app: Express, storage: IStorage) {
  app.post("/api/checkins", 
    sanitizeBody(["details"]),
    checkinController.createCheckin(storage)
  );

  app.get("/api/checkins/session/:sessionId", 
    checkinController.getCheckinsBySession(storage)
  );

  app.get("/api/checkins/venue/:venueId", 
    checkinController.getCheckinsByVenue(storage)
  );

  app.post("/api/attitude-votes", 
    sanitizeBody(["details"]),
    checkinController.createAttitudeVote(storage)
  );

  app.get("/api/attitude-votes/:id", 
    checkinController.getAttitudeVote(storage)
  );

  app.post("/api/attitude-votes/:id/vote", 
    sanitizeBody(["note"]),
    checkinController.castVote(storage)
  );

  app.post("/api/attitude-votes/:id/close", 
    checkinController.closeAttitudeVote(storage)
  );

  app.get("/api/attitude-votes/active/:sessionId/:venueId", 
    checkinController.getActiveVotes(storage)
  );

  app.get("/api/incidents/user/:userId", 
    checkinController.getIncidentsByUser(storage)
  );

  app.get("/api/incidents/recent/:venueId", 
    checkinController.getRecentIncidents(storage)
  );
}
