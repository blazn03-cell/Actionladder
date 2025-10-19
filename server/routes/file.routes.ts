import type { Express } from "express";
import { IStorage } from "../storage";
import * as fileController from "../controllers/file.controller";

export function setupFileRoutes(app: Express, storage: IStorage) {
  app.get("/public-objects/:filePath(*)", 
    fileController.servePublicObject(storage)
  );
  
  app.get("/objects/:objectPath(*)", 
    fileController.servePrivateObject(storage)
  );
  
  app.post("/api/objects/upload", 
    fileController.getUploadURL(storage)
  );
  
  app.put("/api/files", 
    fileController.createFileRecord(storage)
  );
  
  app.get("/api/files", 
    fileController.getUserFiles(storage)
  );
  
  app.get("/api/files/:id", 
    fileController.getFileDetails(storage)
  );
  
  app.delete("/api/files/:id", 
    fileController.deleteFile(storage)
  );
  
  app.post("/api/files/:id/share", 
    fileController.createFileShare(storage)
  );
  
  app.get("/api/files/:id/shares", 
    fileController.getFileShares(storage)
  );
  
  app.delete("/api/shares/:shareId", 
    fileController.deleteFileShare(storage)
  );
}
