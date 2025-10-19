import type { Express } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { sanitizeBody } from "../utils/sanitize";
import * as teamController from "../controllers/team.controller";

export function setupTeamRoutes(app: Express, storage: IStorage, stripe: Stripe) {
  app.get("/api/teams", teamController.getTeams(storage));
  app.get("/api/teams/:id", teamController.getTeam(storage));
  app.post("/api/teams", teamController.createTeam(storage));
  app.put("/api/teams/:id", teamController.updateTeam(storage));
  app.delete("/api/teams/:id", teamController.deleteTeam(storage));
  
  app.get("/api/team-players", teamController.getTeamPlayers(storage));
  app.post("/api/team-players", teamController.createTeamPlayer(storage));
  app.delete("/api/team-players/:id", teamController.deleteTeamPlayer(storage));
  
  app.get("/api/team-matches", teamController.getTeamMatches(storage));
  app.get("/api/team-matches/:id", teamController.getTeamMatch(storage));
  app.post("/api/team-matches", teamController.createTeamMatch(storage));
  app.put("/api/team-matches/:id", teamController.updateTeamMatch(storage));
  app.post("/api/team-matches/:id/reveal-lineup", teamController.revealTeamMatchLineup(storage));
  app.post("/api/team-matches/:id/trigger-captain-burden", teamController.triggerCaptainBurden(storage));
  
  app.get("/api/team-sets", teamController.getTeamSets(storage));
  app.post("/api/team-sets", teamController.createTeamSet(storage));
  app.put("/api/team-sets/:id", teamController.updateTeamSet(storage));
  
  app.get("/api/team-challenges", teamController.getTeamChallenges(storage));
  app.post("/api/team-challenges", teamController.createTeamChallenge(storage));
  app.post("/api/team-challenges/:id/accept", teamController.acceptTeamChallenge(storage));
  
  app.post("/api/teams/:teamId/stripe-onboarding", 
    teamController.createTeamStripeOnboarding(storage, stripe)
  );
  
  app.get("/api/teams/:teamId/stripe-onboarding/refresh", 
    teamController.refreshTeamStripeOnboarding(storage, stripe)
  );
  
  app.get("/api/teams/:teamId/stripe-onboarding/complete", 
    teamController.completeTeamStripeOnboarding(storage, stripe)
  );
  
  app.get("/api/teams/:teamId/stripe-account", 
    teamController.getTeamStripeAccount(storage, stripe)
  );
  
  app.post("/api/team-registrations", 
    sanitizeBody(["teamName", "description"]), 
    teamController.createTeamRegistration(storage)
  );
  
  app.get("/api/team-registrations/:id", teamController.getTeamRegistration(storage));
  
  app.get("/api/team-registrations/division/:divisionId", 
    teamController.getTeamRegistrationsByDivision(storage)
  );
}
