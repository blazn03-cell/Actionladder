import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { storage } from "../storage";

export interface SupabaseSignupOptions {
  defaultRole: 'PLAYER' | 'OPERATOR' | 'OWNER';
  requireAdditionalData?: boolean;
  additionalDataFields?: string[];
}

/**
 * Middleware to handle Supabase signup for any user type
 * Creates user in Supabase and our database
 */
export function createSupabaseSignupMiddleware(options: SupabaseSignupOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, ...additionalData } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required"
        });
      }

      // Check if additional data is required
      if (options.requireAdditionalData && options.additionalDataFields) {
        const missingFields = options.additionalDataFields.filter(
          field => !additionalData[field]
        );

        if (missingFields.length > 0) {
          return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
          });
        }
      }

      // Check if user already exists in our database
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          message: "Email already registered"
        });
      }

      // Create user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email,
            role: options.defaultRole.toLowerCase(),
            ...additionalData
          }
        }
      });

      if (error) {
        return res.status(400).json({
          message: error.message
        });
      }

      if (!data.user) {
        return res.status(400).json({
          message: "Failed to create user in Supabase"
        });
      }

      // Create user in our database
      const userData = {
        id: data.user.id,
        email: data.user.email!,
        name: name || data.user.email!,
        globalRole: options.defaultRole,
        profileComplete: false,
        onboardingComplete: false,
        accountStatus: 'active',
        ...additionalData
      };

      const newUser = await storage.upsertUser(userData);

      // Attach user data to request for use in controller
      req.supabaseUser = {
        supabaseUser: data.user,
        dbUser: newUser,
        session: data.session
      };

      next();
    } catch (error) {
      console.error('Supabase signup middleware error:', error);
      res.status(500).json({
        message: "Internal server error during signup"
      });
    }
  };
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      supabaseUser?: {
        supabaseUser: any;
        dbUser: any;
        session: any;
      };
    }
  }
}
