import { Request, Response } from "express";
import { IStorage } from "../storage";
import { insertPlayerSchema } from "@shared/schema";

export function getPlayers(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createPlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updatePlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const player = await storage.updatePlayer(id, req.body);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function deletePlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePlayer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function graduatePlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.body;
      const player = await storage.getPlayer(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      if (!player.isRookie) {
        return res.status(400).json({ message: "Player is already graduated" });
      }
      
      if (player.rating < 500 && (player.rookieWins || 0) < 10) {
        return res.status(400).json({ 
          message: "Player must have 500+ rating or 10+ rookie wins to graduate" 
        });
      }
      
      const graduatedPlayer = await storage.updatePlayer(playerId, {
        isRookie: false,
        graduatedAt: new Date(),
      });
      
      res.json({ 
        success: true, 
        name: graduatedPlayer?.name,
        message: "Player graduated to main ladder" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getBirthdayPlayers(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const currentDate = new Date();
      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentDay = String(currentDate.getDate()).padStart(2, '0');
      const today = `${currentMonth}-${currentDay}`;
      
      const players = await storage.getAllPlayers();
      const birthdayPlayers = players.filter(player => 
        player.birthday && player.birthday === today
      );
      
      res.json(birthdayPlayers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
