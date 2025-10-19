import type { Express } from "express";
import * as qrController from "../controllers/qr.controller";

export function setupQRRoutes(app: Express) {
  app.get("/api/qr-code", 
    qrController.getQRCode()
  );

  app.post("/api/qr-registration/generate", 
    qrController.generateQRRegistration()
  );

  app.post("/api/qr-registration/:sessionId/register", 
    qrController.registerViaQR()
  );

  app.get("/api/qr-registration/stats", 
    qrController.getQRStats()
  );

  app.get("/api/qr-registration/recent", 
    qrController.getRecentQRRegistrations()
  );
}
