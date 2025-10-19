import { Request, Response } from "express";
import { storage } from "../storage";
import type { InsertHallMatch, InsertHallRoster } from "@shared/schema";

// Get all pool halls with standings (only shows unlocked halls for battles)
export async function getAllHalls(req: Request, res: Response) {
  try {
    const halls = await storage.getAllPoolHalls();
    
    // Filter to only show halls with battles unlocked unless user is admin
    const filteredHalls = halls.filter(hall => hall.battlesUnlocked || req.query.admin === "true");
    
    // Sort by points (descending) then by wins
    const sortedHalls = filteredHalls.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });
    
    res.json({ 
      halls: sortedHalls,
      allHalls: halls, // Include all halls for admin view
      battlesEnabled: filteredHalls.length > 0
    });
  } catch (error: any) {
    console.error("Get halls error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get specific hall details
export async function getHallDetails(req: Request, res: Response) {
  try {
    const { hallId } = req.params;
    const hall = await storage.getPoolHall(hallId);
    if (!hall) {
      return res.status(404).json({ error: "Hall not found" });
    }
    
    const matches = await storage.getHallMatchesByHall(hallId);
    const roster = await storage.getRosterByHall(hallId);
    
    res.json({ hall, matches, roster });
  } catch (error: any) {
    console.error("Get hall details error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get all hall matches (only for unlocked halls)
export async function getAllHallMatches(req: Request, res: Response) {
  try {
    const matches = await storage.getAllHallMatches();
    const halls = await storage.getAllPoolHalls();
    
    // Filter matches to only include those between unlocked halls
    const unlockedHallIds = halls.filter(h => h.battlesUnlocked).map(h => h.id);
    const filteredMatches = matches.filter(match => 
      unlockedHallIds.includes(match.homeHallId) && 
      unlockedHallIds.includes(match.awayHallId)
    );
    
    // Sort by scheduled date (most recent first)
    const sortedMatches = filteredMatches.sort((a, b) => {
      const dateA = a.scheduledDate || a.createdAt;
      const dateB = b.scheduledDate || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    res.json({ 
      matches: sortedMatches,
      battlesEnabled: unlockedHallIds.length > 1
    });
  } catch (error: any) {
    console.error("Get hall matches error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Create new hall match
export async function createHallMatch(req: Request, res: Response) {
  try {
    const matchData: InsertHallMatch = req.body;
    
    // Validate required fields
    if (!matchData.homeHallId || !matchData.awayHallId || !matchData.format) {
      return res.status(400).json({ error: "Home hall, away hall, and format are required" });
    }

    if (matchData.homeHallId === matchData.awayHallId) {
      return res.status(400).json({ error: "Home and away halls must be different" });
    }

    // Verify both halls exist
    const homeHall = await storage.getPoolHall(matchData.homeHallId);
    const awayHall = await storage.getPoolHall(matchData.awayHallId);
    
    if (!homeHall || !awayHall) {
      return res.status(404).json({ error: "One or both halls not found" });
    }

    const match = await storage.createHallMatch(matchData);
    res.status(201).json({ match });
  } catch (error: any) {
    console.error("Create hall match error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Update hall match (for scoring and completion)
export async function updateHallMatch(req: Request, res: Response) {
  try {
    const { matchId } = req.params;
    const updates = req.body;

    const match = await storage.getHallMatch(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // If updating score to completed, validate winner
    if (updates.status === "completed" && updates.winnerHallId) {
      if (updates.winnerHallId !== match.homeHallId && updates.winnerHallId !== match.awayHallId) {
        return res.status(400).json({ error: "Winner must be either home or away hall" });
      }
      updates.completedAt = new Date();
    }

    const updatedMatch = await storage.updateHallMatch(matchId, updates);
    res.json({ match: updatedMatch });
  } catch (error: any) {
    console.error("Update hall match error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get hall roster
export async function getHallRoster(req: Request, res: Response) {
  try {
    const { hallId } = req.params;
    const roster = await storage.getRosterByHall(hallId);
    
    // Get player details for each roster entry
    const playersPromises = roster.map(async (rosterEntry) => {
      const players = await storage.getAllPlayers();
      const player = players.find(p => p.id === rosterEntry.playerId);
      return {
        ...rosterEntry,
        playerName: player?.name || "Unknown Player",
        playerRating: player?.rating || 0,
        playerCity: player?.city || ""
      };
    });
    
    const rosterWithPlayers = await Promise.all(playersPromises);
    res.json({ roster: rosterWithPlayers });
  } catch (error: any) {
    console.error("Get hall roster error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Add player to hall roster
export async function addPlayerToRoster(req: Request, res: Response) {
  try {
    const { hallId } = req.params;
    const { playerId, position = "player" } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: "Player ID is required" });
    }

    // Verify hall exists
    const hall = await storage.getPoolHall(hallId);
    if (!hall) {
      return res.status(404).json({ error: "Hall not found" });
    }

    // Verify player exists
    const players = await storage.getAllPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Check if player is already on this hall's roster
    const existingRoster = await storage.getRosterByPlayer(playerId);
    const activeOnThisHall = existingRoster.find(r => r.hallId === hallId && r.isActive);
    
    if (activeOnThisHall) {
      return res.status(400).json({ error: "Player is already on this hall's roster" });
    }

    const rosterEntry: InsertHallRoster = {
      hallId,
      playerId,
      position,
      isActive: true
    };

    const roster = await storage.createHallRoster(rosterEntry);
    res.status(201).json({ roster });
  } catch (error: any) {
    console.error("Add to roster error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Remove player from hall roster
export async function removePlayerFromRoster(req: Request, res: Response) {
  try {
    const { rosterId } = req.params;

    const roster = await storage.getHallRoster(rosterId);
    if (!roster) {
      return res.status(404).json({ error: "Roster entry not found" });
    }

    // Set as inactive instead of deleting
    await storage.updateHallRoster(rosterId, { isActive: false });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Remove from roster error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get hall statistics and head-to-head records
export async function getHallStats(req: Request, res: Response) {
  try {
    const { hallId } = req.params;
    const hall = await storage.getPoolHall(hallId);
    
    if (!hall) {
      return res.status(404).json({ error: "Hall not found" });
    }

    const matches = await storage.getHallMatchesByHall(hallId);
    const completedMatches = matches.filter(m => m.status === "completed");
    
    // Calculate head-to-head records against other halls
    const headToHead: Record<string, { wins: number; losses: number; hall: any }> = {};
    const allHalls = await storage.getAllPoolHalls();
    
    for (const match of completedMatches) {
      const opponentId = match.homeHallId === hallId ? match.awayHallId : match.homeHallId;
      const opponent = allHalls.find(h => h.id === opponentId);
      
      if (!headToHead[opponentId] && opponent) {
        headToHead[opponentId] = { wins: 0, losses: 0, hall: opponent };
      }
      
      if (match.winnerHallId === hallId) {
        headToHead[opponentId].wins++;
      } else {
        headToHead[opponentId].losses++;
      }
    }

    // Recent form (last 5 matches)
    const recentMatches = completedMatches
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);
    
    const recentForm = recentMatches.map(match => ({
      result: match.winnerHallId === hallId ? "W" : "L",
      opponent: match.homeHallId === hallId ? match.awayHallId : match.homeHallId,
      score: match.homeHallId === hallId ? 
        `${match.homeScore}-${match.awayScore}` : 
        `${match.awayScore}-${match.homeScore}`,
      date: match.completedAt
    }));

    res.json({
      hall,
      totalMatches: completedMatches.length,
      headToHead: Object.values(headToHead),
      recentForm,
      winPercentage: completedMatches.length > 0 ? 
        Math.round((hall.wins / completedMatches.length) * 100) : 0
    });
  } catch (error: any) {
    console.error("Get hall stats error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Admin endpoint to unlock hall battles
export async function unlockHallBattles(req: Request, res: Response) {
  try {
    const { hallId } = req.params;
    const { unlockedBy } = req.body;

    if (!unlockedBy) {
      return res.status(400).json({ error: "Unlocked by is required" });
    }

    const hall = await storage.unlockHallBattles(hallId, unlockedBy);
    if (!hall) {
      return res.status(404).json({ error: "Hall not found" });
    }

    res.json({ 
      success: true, 
      hall,
      message: `Hall battles unlocked for ${hall.name}` 
    });
  } catch (error: any) {
    console.error("Unlock hall battles error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Admin endpoint to lock hall battles
export async function lockHallBattles(req: Request, res: Response) {
  try {
    const { hallId } = req.params;

    const hall = await storage.lockHallBattles(hallId);
    if (!hall) {
      return res.status(404).json({ error: "Hall not found" });
    }

    res.json({ 
      success: true, 
      hall,
      message: `Hall battles locked for ${hall.name}` 
    });
  } catch (error: any) {
    console.error("Lock hall battles error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Admin endpoint to get hall battles status
export async function getBattlesStatus(req: Request, res: Response) {
  try {
    const halls = await storage.getAllPoolHalls();
    const hallsWithStatus = halls.map(hall => ({
      id: hall.id,
      name: hall.name,
      city: hall.city,
      battlesUnlocked: hall.battlesUnlocked,
      unlockedBy: hall.unlockedBy,
      unlockedAt: hall.unlockedAt,
    }));

    res.json({ halls: hallsWithStatus });
  } catch (error: any) {
    console.error("Get battles status error:", error);
    res.status(500).json({ error: error.message });
  }
}
