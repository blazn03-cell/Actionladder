import type { Express } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import * as poolController from "../controllers/pool.controller";

export function setupPoolRoutes(app: Express, storage: IStorage, stripe: Stripe) {
  app.get("/api/kelly-pools", poolController.getKellyPools(storage));
  app.post("/api/kelly-pools", poolController.createKellyPool(storage));
  app.put("/api/kelly-pools/:id", poolController.updateKellyPool(storage));
  
  app.get("/api/money-games", poolController.getMoneyGames(storage));
  app.get("/api/money-games/:id", poolController.getMoneyGame(storage));
  app.post("/api/money-games", poolController.createMoneyGame(storage));
  app.post("/api/money-games/:id/join", poolController.joinMoneyGame(storage));
  app.post("/api/money-games/:id/start", poolController.startMoneyGame(storage));
  app.put("/api/money-games/:id", poolController.updateMoneyGame(storage));
  app.delete("/api/money-games/:id", poolController.deleteMoneyGame(storage));
  
  app.get("/api/side-pots", poolController.getSidePots(storage));
  app.post("/api/side-pots", poolController.createSidePot(storage));
  app.put("/api/side-pots/:id", poolController.updateSidePot(storage));
  app.get("/api/side-pots/:id/details", poolController.getSidePotDetails(storage));
  app.post("/api/side-pots/:id/resolve", poolController.resolveSidePot(storage));
  app.post("/api/side-pots/check-auto-resolve", poolController.checkAutoResolve(storage));
  app.post("/api/side-pots/:id/hold", poolController.holdSidePot(storage));
  app.post("/api/side-pots/:id/void", poolController.voidSidePot(storage));
  app.post("/api/side-pots/:id/dispute", poolController.disputeSidePot(storage));
  
  app.post("/api/side-bets", poolController.createSideBet(storage));
  app.get("/api/side-bets/user/:userId", poolController.getSideBetsByUser(storage));
  
  app.get("/api/escrow-challenges", poolController.getEscrowChallenges(storage));
  app.post("/api/escrow-challenges", poolController.createEscrowChallenge(storage, stripe));
  app.post("/api/escrow-challenges/:id/accept", poolController.acceptEscrowChallenge(storage));
  app.get("/api/escrow-challenges/stats", poolController.getEscrowChallengeStats(storage));
}
