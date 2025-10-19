import { Request, Response } from "express";
import { IStorage } from "../storage";

export function getLeagueStandings(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const standings = [
        {
          id: "hall-001",
          name: "Rack & Roll Billiards",
          city: "San Marcos",
          wins: 12,
          losses: 3,
          points: 850,
          description: "Home of the hustlers",
          roster: [
            {
              id: "roster-001",
              playerId: "player-001",
              hallId: "hall-001",
              position: "Captain",
              isActive: true,
              player: {
                id: "player-001",
                name: "Tommy Rodriguez",
                rating: 650,
                theme: "The Knife"
              }
            }
          ],
          recentMatches: [],
          averageRating: 625,
          totalRacks: 456,
          winPercentage: 80.0,
        }
      ];
      res.json(standings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getLeagueSeasons(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const seasons = [
        {
          id: "season-001",
          name: "Spring 2024 Championship",
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-06-01"),
          status: "active",
          totalMatches: 45,
          completedMatches: 32,
          prizePool: 25000,
        }
      ];
      res.json(seasons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getLeagueStats(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const stats = {
        totalHalls: 6,
        totalPlayers: 78,
        totalMatches: 156,
        totalPrizePool: 25000,
        avgMatchStake: 750,
        topHall: "Rack & Roll Billiards",
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getUpcomingMatches(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const matches = [
        {
          id: "match-001",
          homeHallId: "hall-001",
          awayHallId: "hall-002",
          format: "Best of 9",
          totalRacks: 9,
          homeScore: 0,
          awayScore: 0,
          status: "scheduled",
          scheduledDate: "2024-03-15",
          stake: 150000,
          homeHall: { name: "Rack & Roll Billiards" },
          awayHall: { name: "Corner Pocket Palace" },
        }
      ];
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
