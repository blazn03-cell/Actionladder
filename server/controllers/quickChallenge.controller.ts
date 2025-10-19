import { Request, Response } from "express";
import { insertChallengeSchema } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";

const quickChallengeSchema = z.object({
  opponentId: z.string().min(1),
  gameType: z.string().default('8-ball'),
  stakes: z.number().min(1),
  timeSlot: z.string().min(1),
  hallId: z.string().default('hall1'),
});

// Quick Challenge endpoint - simplified challenge creation
export async function createQuickChallenge(req: Request, res: Response) {
  try {
    const validatedData = quickChallengeSchema.parse(req.body);
    
    // Set up quick challenge time
    const challengeTime = new Date();
    const [hours, minutes] = validatedData.timeSlot.split(':').map(Number);
    challengeTime.setHours(hours, minutes, 0, 0);
    
    // If time is in the past, assume it's for tomorrow
    if (challengeTime < new Date()) {
      challengeTime.setDate(challengeTime.getDate() + 1);
    }

    // For demo purposes, use mock current player ID
    // In real implementation, this would come from authenticated session
    const currentPlayerId = 'current-player-id';
    
    // Get opponent player info
    const opponent = await storage.getPlayer(validatedData.opponentId);
    if (!opponent) {
      return res.status(400).json({ error: "Opponent not found" });
    }

    // Create challenge data matching the schema
    const challengeData = {
      aPlayerId: currentPlayerId,
      bPlayerId: validatedData.opponentId,
      aPlayerName: 'Current Player', // Would come from session
      bPlayerName: opponent.name,
      gameType: validatedData.gameType,
      tableType: '9ft' as const,
      stakes: validatedData.stakes * 100, // Convert to cents
      hallId: validatedData.hallId,
      hallName: 'Default Hall', // Default hall name for quick challenges
      scheduledAt: challengeTime,
      title: `Quick ${validatedData.gameType} Challenge`,
      format: 'race-to-7',
      status: 'pending' as const,
      description: 'Quick challenge created from dashboard',
      autoApproved: true,
      durationMinutes: 90,
      // Optional poster generation
      posterImageUrl: null,
      // Default fee settings
      entryFee: Math.floor(validatedData.stakes * 0.05), // 5% entry fee
      operatorFee: Math.floor(validatedData.stakes * 0.02), // 2% operator fee
      // Privacy and approval settings
      isPublic: true,
      requiresApproval: false,
      maxSpectators: 20,
    };

    // Create the challenge
    const challenge = await storage.createChallenge(challengeData);
    
    res.status(201).json({ 
      success: true, 
      challenge,
      message: "Quick challenge created successfully!"
    });
    
  } catch (error: any) {
    console.error("Quick challenge creation error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create quick challenge",
      message: error.message 
    });
  }
}

// Get quick challenge suggestions (nearby players, similar skill level)
export async function getQuickChallengeSuggestions(req: Request, res: Response) {
  try {
    // Get all players for suggestions
    const allPlayers = await storage.getPlayers();
    
    // Filter for active players with reasonable ratings
    const suggestions = allPlayers
      .filter(player => 
        player.id !== 'current-player-id' && // Exclude current user
        player.rating >= 400 && // Active players only
        player.rating <= 800    // Reasonable skill range
      )
      .sort((a, b) => {
        // Sort by rating proximity to average (500) for balanced matches
        const avgRating = 500;
        const aDistance = Math.abs(a.rating - avgRating);
        const bDistance = Math.abs(b.rating - avgRating);
        return aDistance - bDistance;
      })
      .slice(0, 6); // Top 6 suggestions

    res.json({
      suggestions,
      message: "Quick challenge suggestions ready"
    });
    
  } catch (error: any) {
    console.error("Quick challenge suggestions error:", error);
    res.status(500).json({ 
      error: "Failed to get suggestions",
      message: error.message 
    });
  }
}
