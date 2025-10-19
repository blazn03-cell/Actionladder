import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import stripe from "stripe";
import { QRCodeService } from "../services/qrCodeService";
import { requireStaffOrOwner } from "../replitAuth";
import * as challengeController from "../controllers/challengeCalendar.controller";

const router = Router();

export function setupChallengeCalendarRoutes(app: any, storage: IStorage, stripeClient: stripe) {
  
  const qrCodeService = new QRCodeService(storage);

  app.get("/api/challenges", challengeController.getChallenges(storage));
  app.get("/api/challenges/:id", challengeController.getChallenge(storage));
  app.post("/api/challenges", challengeController.createChallenge(storage));
  app.patch("/api/challenges/:id", challengeController.updateChallenge(storage));
  app.post("/api/challenges/:id/cancel", challengeController.cancelChallenge(storage, stripeClient));
  app.post("/api/challenges/:id/checkin", challengeController.checkInToChallenge(storage));
  app.get("/api/challenges/:id/qr", challengeController.getQRCode(storage));
  app.get("/api/halls/:hallId/challenge-policy", challengeController.getChallengePolicy(storage));
  app.put("/api/halls/:hallId/challenge-policy", challengeController.updateChallengePolicy(storage));
  app.get("/api/challenges/:id/fees", challengeController.getChallengeFees(storage));
  app.post("/api/challenge-fees/:feeId/waive", challengeController.waiveFee(storage));
  app.post("/api/challenge-fees/evaluate-all", requireStaffOrOwner, challengeController.evaluateAllFees);
  app.post("/api/challenges/:challengeId/evaluate-fees", requireStaffOrOwner, challengeController.evaluateChallengeFees);
  app.get("/api/admin/fee-scheduler/status", requireStaffOrOwner, challengeController.getFeeSchedulerStatus);
  app.get("/api/challenges/:challengeId/qr-code", challengeController.generateQRCode(storage));
  app.post("/api/challenges/secure-check-in", challengeController.secureCheckIn(storage));
  app.get("/api/challenges/check-in", challengeController.legacyCheckIn);
  app.post("/api/challenges/:challengeId/check-in", challengeController.manualCheckIn(storage));
  app.get("/api/challenges/:challengeId/check-in-status", challengeController.getCheckInStatus(storage));
  app.options("/api/challenges/*", challengeController.handleCORS);
}

export default router;
