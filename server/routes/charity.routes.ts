import type { Express } from "express";
import { IStorage } from "../storage";
import * as charityController from "../controllers/charity.controller";

export function setupCharityRoutes(app: Express, storage: IStorage) {
  // ==================== CHARITY EVENT ROUTES ====================
  app.get("/api/charity-events", 
    charityController.getCharityEvents(storage)
  );
  
  app.post("/api/charity-events", 
    charityController.createCharityEvent(storage)
  );
  
  app.put("/api/charity-events/:id", 
    charityController.updateCharityEvent(storage)
  );
  
  app.post("/api/charity/donate", 
    charityController.createCharityDonation(storage)
  );

  // ==================== BOUNTY ROUTES ====================
  app.get("/api/bounties", 
    charityController.getBounties(storage)
  );
  
  app.post("/api/bounties", 
    charityController.createBounty(storage)
  );
  
  app.put("/api/bounties/:id", 
    charityController.updateBounty(storage)
  );

  // ==================== ADDED MONEY FUND ROUTES ====================
  app.get("/api/added-money-funds", 
    charityController.getAddedMoneyFunds(storage)
  );
  
  app.get("/api/added-money-funds/source/:sourceType", 
    charityController.getAddedMoneyFundsBySource(storage)
  );
  
  app.post("/api/added-money-funds", 
    charityController.createAddedMoneyFund(storage)
  );

  // ==================== JACKPOT ROUTE ====================
  app.get("/api/jackpot", 
    charityController.getJackpot(storage)
  );
}
