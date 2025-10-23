import type { Express } from "express";
import passport from "passport";
import { requireOwner, requireStaffOrOwner } from "../middleware/auth";
import { createSupabaseSignupMiddleware } from "../middleware/supabaseSignup";
import * as authController from "../controllers/auth.controller";
import * as supabaseAuthController from "../controllers/supabaseAuth.controller";
import { SupabaseStrategy } from "../strategies/supabaseStrategy";

export function registerAuthRoutes(app: Express) {
  // Register Supabase strategy
  passport.use('supabase', new SupabaseStrategy());

  // New Supabase authentication routes
  app.post("/api/auth/signup", supabaseAuthController.signup);
  app.post("/api/auth/login", authController.login);
  app.post("/api/auth/google", supabaseAuthController.googleLogin);
  app.post("/api/auth/logout", supabaseAuthController.logout);
  app.get("/api/auth/me", supabaseAuthController.getCurrentUser);

  // Enhanced routes with Supabase middleware
  app.post("/api/auth/create-owner",
    requireStaffOrOwner,
    createSupabaseSignupMiddleware({
      defaultRole: 'OWNER',
      requireAdditionalData: false
    }),
    authController.createOwner
  );

  app.post("/api/auth/signup-operator",
    requireOwner,
    createSupabaseSignupMiddleware({
      defaultRole: 'OPERATOR',
      requireAdditionalData: true,
      additionalDataFields: ['hallName', 'city', 'state', 'subscriptionTier']
    }),
    authController.createOperator
  );

  app.post("/api/auth/signup-player",
    createSupabaseSignupMiddleware({
      defaultRole: 'PLAYER',
      requireAdditionalData: false
    }),
    authController.signupPlayer
  );

  // Legacy routes (keep for backward compatibility)
  app.post("/api/auth/legacy-login", authController.login);
  app.post("/api/auth/legacy-logout", authController.logout);
  app.get("/api/auth/success", authController.authSuccess);
  app.post("/api/auth/change-password", authController.changePassword);
  app.get("/api/auth/user", authController.getCurrentUser);
  app.post("/api/auth/assign-role", requireStaffOrOwner, authController.assignRole);
}