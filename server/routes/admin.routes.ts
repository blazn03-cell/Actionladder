import type { Express } from "express";
import { requireOwner, requireStaffOrOwner } from "../replitAuth";
import * as adminController from "../controllers/admin.controller";

export function registerAdminRoutes(app: Express) {
  app.post("/api/admin/staff/invite", requireOwner, adminController.inviteStaff);
  app.post("/api/admin/staff/update-share", requireOwner, adminController.updateStaffShare);
  app.get("/api/admin/payouts", requireOwner, adminController.getPayoutHistory);
  app.get("/api/admin/connect/:userId", requireOwner, adminController.getConnectAccountStatus);
  app.get("/api/admin/organization/seats", requireOwner, adminController.getOrganizationSeats);
  app.post("/api/admin/organization/seats", requireOwner, adminController.updateOrganizationSeats);
  app.get("/api/admin/subscription-details", requireOwner, adminController.getSubscriptionDetails);
}

export function registerOperatorRoutes(app: Express) {
  app.post("/api/operator/toggle-free-month", requireStaffOrOwner, adminController.toggleFreeMonth);
  app.post("/api/operator/customization", requireStaffOrOwner, adminController.updateOperatorCustomization);
}

// Re-export the webhook handler
export { payStaffFromInvoice } from "../controllers/admin.controller";
