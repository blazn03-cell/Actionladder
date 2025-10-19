import type { Express } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { sanitizeBody } from "../utils/sanitize";
import * as tournamentController from "../controllers/tournament.controller";

export function setupTournamentRoutes(app: Express, storage: IStorage, stripe: Stripe) {
  app.get("/api/matches", tournamentController.getMatches(storage));
  
  app.post("/api/matches", 
    sanitizeBody(["notes", "description", "title"]), 
    tournamentController.createMatch(storage)
  );
  
  app.put("/api/matches/:id", 
    sanitizeBody(["notes", "description", "title"]), 
    tournamentController.updateMatch(storage)
  );
  
  app.get("/api/tournaments", tournamentController.getTournaments(storage));
  
  app.post("/api/tournaments", 
    sanitizeBody(["title", "description", "name", "rules"]), 
    tournamentController.createTournament(storage)
  );
  
  app.put("/api/tournaments/:id", 
    sanitizeBody(["title", "description", "name", "rules"]), 
    tournamentController.updateTournament(storage)
  );
  
  app.get("/api/tournament-calcuttas", tournamentController.getTournamentCalcuttas(storage));
  
  app.get("/api/tournaments/:tournamentId/calcuttas", 
    tournamentController.getTournamentCalcuttasByTournament(storage)
  );
  
  app.post("/api/tournament-calcuttas", 
    sanitizeBody(["description"]), 
    tournamentController.createTournamentCalcutta(storage)
  );
  
  app.put("/api/tournament-calcuttas/:id", 
    sanitizeBody(["description"]), 
    tournamentController.updateTournamentCalcutta(storage)
  );
  
  app.get("/api/calcutta-bids", tournamentController.getCalcuttaBids(storage));
  
  app.get("/api/tournament-calcuttas/:calcuttaId/bids", 
    tournamentController.getCalcuttaBidsByCalcutta(storage)
  );
  
  app.post("/api/calcutta-bids", tournamentController.createCalcuttaBid(storage));
  
  app.get("/api/match-divisions", tournamentController.getMatchDivisions(storage));
  
  app.get("/api/match-divisions/:id", tournamentController.getMatchDivision(storage));
  
  app.post("/api/match-entries", 
    sanitizeBody(["description"]), 
    tournamentController.createMatchEntry(storage, stripe)
  );
  
  app.get("/api/match-entries/:id", tournamentController.getMatchEntry(storage));
  
  app.patch("/api/match-entries/:id", 
    sanitizeBody(["description"]), 
    tournamentController.updateMatchEntry(storage)
  );
  
  app.post("/api/match-entries/:id/complete", 
    tournamentController.completeMatchEntry(storage, stripe)
  );
}
