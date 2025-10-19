import { type Express } from "express";
import * as forgotPasswordController from "../controllers/forgotPassword.controller";

export function setupForgotPasswordRoutes(app: Express) {
  // Request password reset
  app.post("/api/auth/forgot-password", forgotPasswordController.requestPasswordReset);

  // Reset password
  app.post("/api/auth/reset-password", forgotPasswordController.resetPassword);
}
