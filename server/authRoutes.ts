import type { Express } from "express";
import { storage } from "./storage";
import { 
  hashPassword, 
  verifyPassword, 
  checkAccountLockout, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  createUserSession,
  requireOwner,
  requireStaffOrOwner,
  generateTwoFactorSecret,
  verifyTwoFactor
} from "./auth";
import { 
  createOwnerSchema, 
  createOperatorSchema, 
  createPlayerSchema, 
  loginSchema 
} from "@shared/schema";

export function registerAuthRoutes(app: Express) {
  
  // Password-based login for all user types
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, twoFactorCode } = loginSchema.parse(req.body);
      
      // Check if account is locked
      if (await checkAccountLockout(email)) {
        return res.status(423).json({ 
          message: "Account temporarily locked due to multiple failed login attempts" 
        });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        await incrementLoginAttempts(email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        await incrementLoginAttempts(email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(200).json({ requires2FA: true });
        }
        
        if (!verifyTwoFactor(twoFactorCode, user.twoFactorSecret)) {
          await incrementLoginAttempts(email);
          return res.status(401).json({ message: "Invalid two-factor code" });
        }
      }

      // Reset login attempts and create session
      await resetLoginAttempts(email);
      
      const userSession = createUserSession(user);
      req.login(userSession, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            globalRole: user.globalRole,
            hallName: user.hallName,
            city: user.city,
            state: user.state
          }
        });
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Creator/Owner account creation (admin only)
  app.post("/api/auth/create-owner", requireStaffOrOwner, async (req, res) => {
    try {
      const userData = createOwnerSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);
      
      // Generate 2FA secret if enabled
      let twoFactorSecret;
      if (userData.twoFactorEnabled) {
        twoFactorSecret = generateTwoFactorSecret();
      }

      // Create owner account
      const newUser = await storage.createUser({
        email: userData.email,
        name: userData.name,
        globalRole: "OWNER",
        passwordHash,
        twoFactorEnabled: userData.twoFactorEnabled,
        twoFactorSecret,
        phoneNumber: userData.phoneNumber,
        accountStatus: "active",
        onboardingComplete: true,
        profileComplete: true,
      });

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          globalRole: newUser.globalRole,
        },
        ...(twoFactorSecret && { twoFactorSecret })
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Operator signup (public)
  app.post("/api/auth/signup-operator", async (req, res) => {
    try {
      const operatorData = createOperatorSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(operatorData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Generate temporary password (operator will be prompted to set it)
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await hashPassword(tempPassword);

      // Create operator account
      const newUser = await storage.createUser({
        email: operatorData.email,
        name: operatorData.name,
        globalRole: "OPERATOR",
        passwordHash,
        hallName: operatorData.hallName,
        city: operatorData.city,
        state: operatorData.state,
        subscriptionTier: operatorData.subscriptionTier,
        accountStatus: "pending", // Pending until Stripe setup complete
        onboardingComplete: false,
        profileComplete: false,
      });

      // TODO: Create Stripe subscription based on tier
      // This would integrate with Stripe API to create subscription

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          globalRole: newUser.globalRole,
          hallName: newUser.hallName,
          subscriptionTier: newUser.subscriptionTier,
        },
        tempPassword, // Send this via email in production
        message: "Account created! Please check your email for login instructions."
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Player signup (public)
  app.post("/api/auth/signup-player", async (req, res) => {
    try {
      const playerData = createPlayerSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(playerData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Generate temporary password (player will be prompted to set it)
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await hashPassword(tempPassword);

      // Create player account
      const newUser = await storage.createUser({
        email: playerData.email,
        name: playerData.name,
        globalRole: "PLAYER",
        passwordHash,
        accountStatus: "pending", // Pending until payment
        onboardingComplete: false,
        profileComplete: false,
      });

      // Create player profile
      const player = await storage.createPlayer({
        name: playerData.name,
        userId: newUser.id,
        membershipTier: playerData.membershipTier,
        isRookie: playerData.tier === "rookie",
        rookiePassActive: playerData.tier === "rookie",
      });

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          globalRole: newUser.globalRole,
        },
        player: {
          id: player.id,
          name: player.name,
          tier: playerData.tier,
          membershipTier: player.membershipTier,
        },
        tempPassword, // Send this via email in production
        message: "Account created! Please check your email for login instructions."
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get current authenticated user
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user as any;
      let dbUser;

      // Check if user came from OIDC or password auth
      if (user.claims?.sub) {
        // OIDC user
        dbUser = await storage.getUser(user.claims.sub);
      } else if (user.id) {
        // Password auth user
        dbUser = await storage.getUser(user.id);
      }

      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        globalRole: dbUser.globalRole,
        hallName: dbUser.hallName,
        city: dbUser.city,
        state: dbUser.state,
        subscriptionTier: dbUser.subscriptionTier,
        accountStatus: dbUser.accountStatus,
        onboardingComplete: dbUser.onboardingComplete,
      });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Change password
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;
      
      let dbUser;
      if (user.claims?.sub) {
        dbUser = await storage.getUser(user.claims.sub);
      } else if (user.id) {
        dbUser = await storage.getUser(user.id);
      }

      if (!dbUser || !dbUser.passwordHash) {
        return res.status(400).json({ message: "Password change not supported for this account" });
      }

      // Verify current password
      const passwordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateUser(dbUser.id, { 
        passwordHash: newPasswordHash,
        loginAttempts: 0,
        lockedUntil: undefined 
      });

      res.json({ message: "Password changed successfully" });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
}