import { Request, Response } from "express";
import { storage } from "../storage";
import { supabase } from "../config/supabase";
import {
  hashPassword,
  verifyPassword,
  checkAccountLockout,
  incrementLoginAttempts,
  resetLoginAttempts,
  createUserSession,
  generateTwoFactorSecret,
  verifyTwoFactor
} from "../middleware/auth";
import {
  createOwnerSchema,
  createOperatorSchema,
  createPlayerSchema,
  loginSchema
} from "action-ladder-shared/schema";

// Enhanced login supporting both Supabase and legacy password auth
export async function login(req: Request, res: Response) {
  try {
    const { email, password, twoFactorCode } = loginSchema.parse(req.body);
    const useSupabase = req.body.useSupabase !== false; // Default to true

    // Try Supabase authentication first if enabled
    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          // If Supabase fails, fall back to legacy auth
          return await legacyLogin(req, res);
        }

        if (!data.user) {
          return res.status(401).json({ message: "Authentication failed" });
        }

        // Get user from our database
        const dbUser = await storage.getUser(data.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: "User not found in database" });
        }

        // Create session-compatible user object
        const sessionUser = {
          id: data.user.id,
          email: data.user.email,
          name: dbUser.name,
          globalRole: dbUser.globalRole,
          claims: {
            sub: data.user.id,
            email: data.user.email
          },
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        };

        req.login(sessionUser, (err) => {
          if (err) {
            return res.status(500).json({ message: "Session creation failed" });
          }

          res.json({
            user: {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              globalRole: dbUser.globalRole,
              hallName: dbUser.hallName,
              city: dbUser.city,
              state: dbUser.state
            }
          });
        });

        return;
      } catch (supabaseError) {
        // Fall back to legacy authentication
        return await legacyLogin(req, res);
      }
    }

    // Legacy password authentication
    return await legacyLogin(req, res);

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Legacy password-based login
async function legacyLogin(req: Request, res: Response) {
  const { email, password, twoFactorCode } = req.body;

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
}

// Creator/Owner account creation (admin only) - Now uses Supabase
export async function createOwner(req: Request, res: Response) {
  try {
    // Supabase middleware should have already created the user
    if (!req.supabaseUser) {
      return res.status(500).json({ message: "User creation failed" });
    }

    const { dbUser } = req.supabaseUser;
    const userData = createOwnerSchema.parse(req.body);

    // Generate 2FA secret if enabled
    let twoFactorSecret;
    if (userData.twoFactorEnabled) {
      twoFactorSecret = generateTwoFactorSecret();
    }

    // Update user with additional owner-specific data
    const updatedUser = await storage.updateUser(dbUser.id, {
      twoFactorEnabled: userData.twoFactorEnabled,
      twoFactorSecret,
      phoneNumber: userData.phoneNumber,
      onboardingComplete: true,
      profileComplete: true,
    });

    res.status(201).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        globalRole: updatedUser.globalRole,
      },
      ...(twoFactorSecret && { twoFactorSecret })
    });

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Operator signup (public) - Now uses Supabase
export async function signupOperator(req: Request, res: Response) {
  try {
    // Supabase middleware should have already created the user
    if (!req.supabaseUser) {
      return res.status(500).json({ message: "User creation failed" });
    }

    const { dbUser } = req.supabaseUser;
    const operatorData = createOperatorSchema.parse(req.body);

    // Update user with operator-specific data
    const updatedUser = await storage.updateUser(dbUser.id, {
      hallName: operatorData.hallName,
      city: operatorData.city,
      state: operatorData.state,
      subscriptionTier: operatorData.subscriptionTier,
      onboardingComplete: false,
      profileComplete: false,
    });

    // TODO: Create Stripe subscription based on tier
    // This would integrate with Stripe API to create subscription

    res.status(201).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        globalRole: updatedUser.globalRole,
        hallName: updatedUser.hallName,
        subscriptionTier: updatedUser.subscriptionTier,
      },
      message: "Account created successfully! You can now log in with your credentials."
    });

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Player signup (public) - Now uses Supabase
export async function signupPlayer(req: Request, res: Response) {
  try {
    // Supabase middleware should have already created the user
    if (!req.supabaseUser) {
      return res.status(500).json({ message: "User creation failed" });
    }

    const { dbUser } = req.supabaseUser;
    const playerData = createPlayerSchema.parse(req.body);

    // Create player profile
    const player = await storage.createPlayer({
      name: playerData.name,
      userId: dbUser.id,
      membershipTier: playerData.membershipTier,
      isRookie: playerData.tier === "rookie",
      rookiePassActive: playerData.tier === "rookie",
    });

    res.status(201).json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        globalRole: dbUser.globalRole,
      },
      player: {
        id: player.id,
        name: player.name,
        tier: playerData.tier,
        membershipTier: player.membershipTier,
      },
      message: "Account created successfully! You can now log in with your credentials."
    });

  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

// Get current authenticated user
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    let dbUser;

    // Check if user came from OIDC or password auth
    if (user.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    } else if (user.id) {
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
}

// Logout
export function logout(req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
}

// Change password
export async function changePassword(req: Request, res: Response) {
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
}

// Alias for route naming consistency
export const createOperator = signupOperator;

// Replit Auth - Get current user (OIDC specific)
export async function authMe(req: Request, res: Response) {
  console.log("authMe", req.user);
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    if (user?.claims?.sub) {
      const dbUser = await storage.getUser(user.claims.sub);
      if (dbUser) {
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
          onboardingComplete: dbUser.onboardingComplete
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(401).json({ message: "Invalid user session" });
    }
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Replit Auth - Handle auth success callback with role-based routing
export async function authSuccess(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = req.session as any;
    const intendedRole = session.intendedRole || "player";

    // Clear the intended role from session
    delete session.intendedRole;

    // Update user role in database if needed
    const user = req.user as any;
    if (user?.claims?.sub) {
      try {
        let dbUser = await storage.getUser(user.claims.sub);
        if (!dbUser) {
          // Create user if doesn't exist
          dbUser = await storage.upsertUser({
            id: user.claims.sub,
            email: user.claims.email,
            name: `${user.claims.first_name || ""} ${user.claims.last_name || ""}`.trim() || user.claims.email || "Unknown User",
          });
        }

        // Set role based on intended role
        let globalRole: import("action-ladder-shared/schema").GlobalRole = "PLAYER";
        if (intendedRole === "admin") {
          globalRole = "OWNER";
        } else if (intendedRole === "operator") {
          globalRole = "STAFF";
        }

        // Update user with role if different
        if (dbUser.globalRole !== globalRole) {
          await storage.updateUser(user.claims.sub, { globalRole });
        }
      } catch (error) {
        console.error("Error updating user role:", error);
      }
    }

    res.json({
      role: intendedRole,
      success: true
    });
  } catch (error) {
    console.error("Auth success error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

// OAuth role assignment
export async function assignRole(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const { role, ...additionalData } = req.body;

    if (!["player", "operator"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role === "operator") {
      // Validate operator data
      const { hallName, city, state, subscriptionTier } = additionalData;
      if (!hallName || !city || !state || !subscriptionTier) {
        return res.status(400).json({ message: "Missing required operator information" });
      }

      await storage.updateUser(dbUser.id, {
        globalRole: "OPERATOR",
        hallName,
        city,
        state,
        subscriptionTier,
        accountStatus: "active",
        onboardingComplete: false,
        profileComplete: false,
      });
    } else {
      // Player role
      const { city, state, tier, membershipTier } = additionalData;
      if (!city || !state || !tier) {
        return res.status(400).json({ message: "Missing required player information" });
      }

      await storage.updateUser(dbUser.id, {
        globalRole: "PLAYER",
        city,
        state,
        accountStatus: "active",
        onboardingComplete: false,
        profileComplete: false,
      });

      // Create player profile
      await storage.createPlayer({
        name: dbUser.name || dbUser.email,
        userId: dbUser.id,
        membershipTier: membershipTier || "none",
        isRookie: tier === "rookie",
        rookiePassActive: tier === "rookie",
      });
    }

    res.json({ success: true, message: "Role assigned successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
