import { Request, Response } from "express";
import { IStorage } from "../storage";
import { insertSeasonPredictionSchema, insertPredictionEntrySchema } from "@shared/schema";

// ==================== SEASON PREDICTION CONTROLLERS ====================

export function getSeasonPredictions(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const predictions = await storage.getSeasonPredictions();
      res.json(predictions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getSeasonPredictionsByStatus(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const predictions = await storage.getSeasonPredictionsByStatus(status);
      res.json(predictions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createSeasonPrediction(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertSeasonPredictionSchema.parse(req.body);
      const prediction = await storage.createSeasonPrediction(validatedData);
      res.status(201).json(prediction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateSeasonPrediction(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const prediction = await storage.updateSeasonPrediction(id, req.body);
      if (!prediction) {
        return res.status(404).json({ message: "Season prediction not found" });
      }
      res.json(prediction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

// ==================== PREDICTION ENTRY CONTROLLERS ====================

export function getPredictionEntries(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const entries = await storage.getPredictionEntries();
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getPredictionEntriesByPrediction(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { predictionId } = req.params;
      const entries = await storage.getPredictionEntriesByPrediction(predictionId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createPredictionEntry(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertPredictionEntrySchema.parse(req.body);
      const entry = await storage.createPredictionEntry(validatedData);
      
      // Update the season prediction pool totals
      const prediction = await storage.getSeasonPrediction(entry.predictionId);
      if (prediction) {
        const newTotalPool = (prediction.totalPool || 0) + entry.entryFee;
        const serviceFee = Math.floor(newTotalPool * 0.1); // 10% service fee
        const prizePool = newTotalPool - serviceFee;
        
        await storage.updateSeasonPrediction(entry.predictionId, {
          totalPool: newTotalPool,
          serviceFee: serviceFee,
          prizePool: prizePool
        });
      }
      
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
