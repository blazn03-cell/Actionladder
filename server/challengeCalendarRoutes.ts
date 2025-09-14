import { Router, Request, Response } from "express";
import { z } from "zod";
import { IStorage } from "./storage";
import { 
  insertChallengeSchema, 
  insertChallengeFeeSchema, 
  insertChallengeCheckInSchema, 
  insertChallengePolicySchema,
  Challenge,
  ChallengeFee,
  ChallengeCheckIn,
  ChallengePolicy
} from "../shared/schema";
import dayjs from "dayjs";
import stripe from "stripe";
import { sanitizeResponse } from "./sanitizeMiddleware";

const router = Router();

// ================================
// CHALLENGE CALENDAR API ROUTES
// ================================

export function setupChallengeCalendarRoutes(app: any, storage: IStorage, stripeClient: stripe) {

  // Get all challenges with optional filtering
  app.get("/api/challenges", async (req: Request, res: Response) => {
    try {
      const { playerId, hallId, startDate, endDate, status } = req.query;
      
      let challenges: Challenge[] = [];
      
      if (playerId) {
        challenges = await storage.getChallengesByPlayer(playerId as string);
      } else if (hallId) {
        challenges = await storage.getChallengesByHall(hallId as string);
      } else if (startDate && endDate) {
        challenges = await storage.getChallengesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        challenges = await storage.getUpcomingChallenges(50); // Default limit
      }
      
      // Filter by status if provided
      if (status) {
        challenges = challenges.filter(c => c.status === status);
      }
      
      // Apply text sanitization for league-safe terminology
      const sanitizedChallenges = challenges.map(challenge => ({
        ...challenge,
        description: challenge.description ? sanitizeText(challenge.description) : null
      }));
      
      res.json(sanitizedChallenges);
    } catch (error: any) {
      console.error("Get challenges error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single challenge
  app.get("/api/challenges/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const challenge = await storage.getChallenge(id);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      // Get check-ins for this challenge
      const checkIns = await storage.getChallengeCheckInsByChallenge(id);
      
      // Get fees for this challenge
      const fees = await storage.getChallengeFeesByChallenge(id);
      
      const sanitizedChallenge = {
        ...challenge,
        description: challenge.description ? sanitizeText(challenge.description) : null
      };
      
      res.json({
        challenge: sanitizedChallenge,
        checkIns,
        fees
      });
    } catch (error: any) {
      console.error("Get challenge error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create new challenge
  app.post("/api/challenges", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChallengeSchema.parse(req.body);
      
      // Validate scheduling constraints
      const scheduledAt = new Date(validatedData.scheduledAt);
      const now = new Date();
      
      if (scheduledAt <= now) {
        return res.status(400).json({ error: "Challenge must be scheduled in the future" });
      }
      
      // Validate that players exist
      const playerA = await storage.getPlayer(validatedData.aPlayerId);
      const playerB = await storage.getPlayer(validatedData.bPlayerId);
      
      if (!playerA || !playerB) {
        return res.status(400).json({ error: "One or both players not found" });
      }
      
      // Check for conflicting challenges
      const existingChallenges = await storage.getChallengesByDateRange(
        dayjs(scheduledAt).subtract(2, 'hours').toDate(),
        dayjs(scheduledAt).add(2, 'hours').toDate()
      );
      
      const conflicts = existingChallenges.filter(c => 
        (c.aPlayerId === validatedData.aPlayerId || c.bPlayerId === validatedData.aPlayerId ||
         c.aPlayerId === validatedData.bPlayerId || c.bPlayerId === validatedData.bPlayerId) &&
        c.status !== 'cancelled'
      );
      
      if (conflicts.length > 0) {
        return res.status(400).json({ error: "Player has conflicting challenge scheduled within 2 hours" });
      }
      
      const challenge = await storage.createChallenge(validatedData);
      
      // TODO: Generate AI poster (task 7)
      // TODO: Send real-time notifications (task 8)
      
      res.status(201).json(challenge);
    } catch (error: any) {
      console.error("Create challenge error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update challenge
  app.patch("/api/challenges/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const challenge = await storage.getChallenge(id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      // Don't allow updates to completed challenges
      if (challenge.status === 'completed') {
        return res.status(400).json({ error: "Cannot update completed challenge" });
      }
      
      const updatedChallenge = await storage.updateChallenge(id, updates);
      
      // TODO: Send real-time notifications (task 8)
      
      res.json(updatedChallenge);
    } catch (error: any) {
      console.error("Update challenge error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel challenge
  app.post("/api/challenges/:id/cancel", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, cancelledBy } = req.body;
      
      const challenge = await storage.getChallenge(id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.status !== 'scheduled') {
        return res.status(400).json({ error: "Only scheduled challenges can be cancelled" });
      }
      
      // Update challenge status
      await storage.updateChallenge(id, {
        status: 'cancelled'
      });
      
      // Check if cancellation fees should be applied
      const policy = await storage.getChallengesPolicyByHall(challenge.hallId);
      if (policy && policy.cancellationFeeEnabled) {
        const hoursUntilChallenge = dayjs(challenge.scheduledAt).diff(dayjs(), 'hours');
        
        if (hoursUntilChallenge < policy.cancellationThresholdHours) {
          // Apply cancellation fee
          const fee = await storage.createChallengeFee({
            challengeId: id,
            playerId: cancelledBy || challenge.aPlayerId,
            feeType: 'cancellation',
            amount: policy.cancellationFeeAmount,
            scheduledAt: challenge.scheduledAt,
            actualAt: new Date(),
            minutesLate: 0
          });
          
          // TODO: Process payment (task 3)
        }
      }
      
      res.json({ message: "Challenge cancelled", reason });
    } catch (error: any) {
      console.error("Cancel challenge error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ================================
  // CHECK-IN SYSTEM
  // ================================

  // Check in to challenge
  app.post("/api/challenges/:id/checkin", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { playerId, checkedInBy = 'player', location = 'mobile_app' } = req.body;
      
      const challenge = await storage.getChallenge(id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.status !== 'scheduled') {
        return res.status(400).json({ error: "Challenge is not available for check-in" });
      }
      
      // Validate player is part of this challenge
      if (playerId !== challenge.aPlayerId && playerId !== challenge.bPlayerId) {
        return res.status(403).json({ error: "Player not part of this challenge" });
      }
      
      // Check if already checked in
      const existingCheckIns = await storage.getChallengeCheckInsByChallenge(id);
      const alreadyCheckedIn = existingCheckIns.find(ci => ci.playerId === playerId);
      
      if (alreadyCheckedIn) {
        return res.status(400).json({ error: "Player already checked in" });
      }
      
      // Create check-in record
      const checkIn = await storage.createChallengeCheckIn({
        challengeId: id,
        playerId,
        checkedInAt: new Date(),
        checkedInBy,
        location
      });
      
      // Check if both players have checked in
      const allCheckIns = await storage.getChallengeCheckInsByChallenge(id);
      if (allCheckIns.length === 2) {
        // Both players checked in - update challenge status
        await storage.updateChallenge(id, {
          status: 'in_progress',
          checkedInAt: new Date()
        });
      }
      
      // TODO: Send real-time notifications (task 8)
      
      res.json(checkIn);
    } catch (error: any) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate QR code for check-in
  app.get("/api/challenges/:id/qr", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const challenge = await storage.getChallenge(id);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      const qrData = {
        type: 'challenge_checkin',
        challengeId: id,
        challengeName: `${challenge.aPlayerName} vs ${challenge.bPlayerName}`,
        scheduledAt: challenge.scheduledAt,
        hallName: challenge.hallName
      };
      
      res.json({ qrData: JSON.stringify(qrData) });
    } catch (error: any) {
      console.error("QR code generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ================================
  // CHALLENGE POLICIES
  // ================================

  // Get challenge policy for hall
  app.get("/api/halls/:hallId/challenge-policy", async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const policy = await storage.getChallengesPolicyByHall(hallId);
      
      if (!policy) {
        // Return default policy
        return res.json({
          hallId,
          lateFeeEnabled: true,
          lateFeeAmount: 500, // $5
          lateFeeThresholdMinutes: 15,
          noShowFeeEnabled: true,
          noShowFeeAmount: 1500, // $15
          noShowThresholdMinutes: 45,
          cancellationFeeEnabled: true,
          cancellationFeeAmount: 1000, // $10
          cancellationThresholdHours: 24,
          gracePeriodMinutes: 5,
          autoChargeEnabled: true,
          requireConfirmation: false
        });
      }
      
      res.json(policy);
    } catch (error: any) {
      console.error("Get challenge policy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update challenge policy
  app.put("/api/halls/:hallId/challenge-policy", async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const { updatedBy } = req.body;
      
      if (!updatedBy) {
        return res.status(400).json({ error: "updatedBy field required" });
      }
      
      const validatedData = insertChallengePolicySchema.parse({
        ...req.body,
        hallId,
        updatedBy
      });
      
      const existingPolicy = await storage.getChallengesPolicyByHall(hallId);
      
      let policy;
      if (existingPolicy) {
        policy = await storage.updateChallengePolicy(existingPolicy.id, validatedData);
      } else {
        policy = await storage.createChallengePolicy(validatedData);
      }
      
      res.json(policy);
    } catch (error: any) {
      console.error("Update challenge policy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ================================
  // FEES AND PAYMENTS
  // ================================

  // Get fees for challenge
  app.get("/api/challenges/:id/fees", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const fees = await storage.getChallengeFeesByChallenge(id);
      res.json(fees);
    } catch (error: any) {
      console.error("Get challenge fees error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Waive a fee (operator only)
  app.post("/api/challenge-fees/:feeId/waive", async (req: Request, res: Response) => {
    try {
      const { feeId } = req.params;
      const { waivedBy, reason } = req.body;
      
      if (!waivedBy || !reason) {
        return res.status(400).json({ error: "waivedBy and reason required" });
      }
      
      const fee = await storage.getChallengeFee(feeId);
      if (!fee) {
        return res.status(404).json({ error: "Fee not found" });
      }
      
      if (fee.status !== 'pending') {
        return res.status(400).json({ error: "Only pending fees can be waived" });
      }
      
      const updatedFee = await storage.updateChallengeFee(feeId, {
        status: 'waived',
        waivedAt: new Date(),
        waivedBy,
        waiverReason: reason
      });
      
      res.json(updatedFee);
    } catch (error: any) {
      console.error("Waive fee error:", error);
      res.status(500).json({ error: error.message });
    }
  });

}

export default router;