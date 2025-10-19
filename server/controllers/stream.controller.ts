import { Request, Response } from "express";
import { IStorage } from "../storage";
import { insertLiveStreamSchema } from "@shared/schema";

export function getLiveStreams(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const streams = await storage.getLiveStreams();
      res.json(streams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createLiveStream(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertLiveStreamSchema.parse(req.body);
      const stream = await storage.createLiveStream(validatedData);
      res.status(201).json(stream);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateLiveStream(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stream = await storage.updateLiveStream(id, req.body);
      if (!stream) {
        return res.status(404).json({ message: "Live stream not found" });
      }
      res.json(stream);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function deleteLiveStream(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteLiveStream(id);
      if (!success) {
        return res.status(404).json({ message: "Live stream not found" });
      }
      res.json({ message: "Live stream deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getLiveStreamsByLocation(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { city, state } = req.query;
      const streams = await storage.getLiveStreamsByLocation(city as string, state as string);
      res.json(streams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getLiveStreamStats(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const stats = await storage.getLiveStreamStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
