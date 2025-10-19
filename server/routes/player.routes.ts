import type { Express } from "express";
import { IStorage } from "../storage";
import { sanitizeBody } from "../utils/sanitize";
import * as playerController from "../controllers/player.controller";

export function setupPlayerRoutes(app: Express, storage: IStorage) {
  app.get("/api/players", playerController.getPlayers(storage));
  
  app.post("/api/players", 
    sanitizeBody(["name", "username", "notes", "bio"]), 
    playerController.createPlayer(storage)
  );
  
  app.put("/api/players/:id", 
    sanitizeBody(["name", "username", "notes", "bio"]), 
    playerController.updatePlayer(storage)
  );
  
  app.delete("/api/players/:id", playerController.deletePlayer(storage));
  
  app.post("/api/players/graduate", playerController.graduatePlayer(storage));
  
  app.get("/api/birthday-players", playerController.getBirthdayPlayers(storage));
}
