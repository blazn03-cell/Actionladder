import { Express } from "express";
import * as revenueAdminController from "../controllers/revenueAdmin.controller";

export function registerRevenueAdminRoutes(app: Express) {
  
  // Get current active revenue configuration
  app.get("/api/admin/revenue-config", revenueAdminController.requireAdmin, revenueAdminController.getActiveRevenueConfig);

  // Get all available revenue configurations
  app.get("/api/admin/revenue-configs", revenueAdminController.requireAdmin, revenueAdminController.getAllRevenueConfigs);

  // Set active revenue configuration
  app.post("/api/admin/revenue-config/activate", revenueAdminController.requireAdmin, revenueAdminController.activateRevenueConfig);

  // Create and activate custom revenue configuration
  app.post("/api/admin/revenue-config", revenueAdminController.requireAdmin, revenueAdminController.createRevenueConfig);

  // Update existing configuration (creates new version)
  app.put("/api/admin/revenue-config", revenueAdminController.requireAdmin, revenueAdminController.updateRevenueConfig);

  // Validate a configuration without saving
  app.post("/api/admin/revenue-config/validate", revenueAdminController.requireAdmin, revenueAdminController.validateConfig);

  // Get revenue calculation preview with different configurations
  app.post("/api/admin/revenue-config/preview", revenueAdminController.requireAdmin, revenueAdminController.previewRevenue);
}
