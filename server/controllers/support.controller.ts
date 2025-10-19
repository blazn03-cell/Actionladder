import { Request, Response } from "express";
import { IStorage } from "../storage";
import { insertSupportRequestSchema } from "@shared/schema";

export function getSupportRequests(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const requests = await storage.getSupportRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createSupportRequest(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupportRequestSchema.parse(req.body);
      const request = await storage.createSupportRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateSupportRequest(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request = await storage.updateSupportRequest(id, req.body);
      if (!request) {
        return res.status(404).json({ message: "Support request not found" });
      }
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
