import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { createOwnerSchema, createOperatorSchema, createPlayerSchema, loginSchema } from "@shared/schema";
import type { GlobalRole } from "@shared/schema";

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2FA utilities
export function generateTwoFactorSecret(): string {
  return speakeasy.generateSecret({ name: "Action Ladder" }).base32;
}

export function verifyTwoFactor(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // Allow 1 step before/after for clock drift
  });
}

// Role-based middleware
export const requireRole = (allowedRoles: GlobalRole[]): RequestHandler => {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
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

      if (!dbUser || !allowedRoles.includes(dbUser.globalRole as GlobalRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      req.dbUser = dbUser;
      return next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
};

export const requireOwner = requireRole(["OWNER"]);
export const requireStaffOrOwner = requireRole(["STAFF", "OWNER"]);
export const requireOperator = requireRole(["OPERATOR"]);
export const requireAnyAuth = requireRole(["OWNER", "STAFF", "OPERATOR", "PLAYER"]);

// Account lockout utilities
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function checkAccountLockout(email: string): Promise<boolean> {
  const user = await storage.getUserByEmail(email);
  if (!user) return false;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return true; // Account is locked
  }

  return false;
}

export async function incrementLoginAttempts(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  const attempts = (user.loginAttempts || 0) + 1;
  const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION) : undefined;

  await storage.updateUser(user.id, {
    loginAttempts: attempts,
    lockedUntil: lockUntil,
  });
}

export async function resetLoginAttempts(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  await storage.updateUser(user.id, {
    loginAttempts: 0,
    lockedUntil: undefined,
    lastLoginAt: new Date(),
  });
}

// Session management for password auth
export function createUserSession(user: any): any {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    globalRole: user.globalRole,
    authType: "password",
  };
}