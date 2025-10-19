import { Request, Response } from "express";
import { AIService } from "../services/ai-service";

export function coaching() {
  return async (req: Request, res: Response) => {
    try {
      const { playerId, topic } = req.body;
      if (!playerId) {
        return res.status(400).json({ message: "Player ID is required" });
      }
      
      const advice = await AIService.getCoachingAdvice(playerId, topic);
      res.json({ advice });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function communityChat() {
  return async (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const answer = await AIService.answerCommunityQuestion(question);
      res.json({ answer });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function matchCommentary() {
  return async (req: Request, res: Response) => {
    try {
      const { matchData } = req.body;
      if (!matchData) {
        return res.status(400).json({ message: "Match data is required" });
      }
      
      const commentary = await AIService.generateMatchCommentary(matchData);
      res.json({ commentary });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function matchPrediction() {
  return async (req: Request, res: Response) => {
    try {
      const { challengerId, opponentId, gameType } = req.body;
      if (!challengerId || !opponentId || !gameType) {
        return res.status(400).json({ message: "Challenger ID, opponent ID, and game type are required" });
      }
      
      const prediction = await AIService.predictMatchOutcome(challengerId, opponentId, gameType);
      res.json({ prediction });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function opponentSuggestions() {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const suggestions = await AIService.suggestOpponents(playerId);
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function performanceAnalysis() {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const analysis = await AIService.analyzePlayerPerformance(playerId);
      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
