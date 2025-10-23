import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { storage } from "../storage";
import { createOwnerSchema, createOperatorSchema, createPlayerSchema } from "action-ladder-shared/schema";

// Supabase signup with email/password
export async function signup(req: Request, res: Response) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Create user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email,
          role: role || 'player'
        }
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ message: "Failed to create user" });
    }

    // Create user in our database
    const userData = {
      id: data.user.id,
      email: data.user.email!,
      name: name || data.user.email!,
      globalRole: (role || 'PLAYER').toUpperCase() as any,
      profileComplete: false,
      onboardingComplete: false,
      accountStatus: 'active'
    };

    await storage.upsertUser(userData);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userData.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Supabase login with email/password
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ message: "Invalid email or password" });
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

    // Use Passport's login method to establish session
    req.login(sessionUser, (err) => {
      if (err) {
        return res.status(500).json({ message: "Session creation failed" });
      }

      res.json({
        message: "Login successful",
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          globalRole: sessionUser.globalRole
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Google OAuth login
export async function googleLogin(req: Request, res: Response) {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ message: "Google access token is required" });
    }

    // Verify Google token with Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: access_token
    });

    if (error || !data.user) {
      return res.status(401).json({ message: "Google authentication failed" });
    }

    // Get or create user in our database
    let dbUser = await storage.getUser(data.user.id);
    if (!dbUser) {
      // Create new user
      const userData = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.email!,
        globalRole: 'PLAYER' as any,
        profileComplete: false,
        onboardingComplete: false,
        accountStatus: 'active'
      };
      dbUser = await storage.upsertUser(userData);
    }

    // Create session-compatible user object
    const sessionUser = {
      id: data.user.id,
      email: data.user.email,
      name: dbUser.name,
      globalRole: dbUser.globalRole,
      claims: {
        sub: data.user.id,
        email: data.user.email,
        first_name: data.user.user_metadata?.first_name,
        last_name: data.user.user_metadata?.last_name
      },
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at
    };

    // Use Passport's login method to establish session
    req.login(sessionUser, (err) => {
      if (err) {
        return res.status(500).json({ message: "Session creation failed" });
      }

      res.json({
        message: "Google login successful",
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          globalRole: sessionUser.globalRole
        }
      });
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Supabase logout
export async function logout(req: Request, res: Response) {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Use Passport's logout method
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }

      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get current user info
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const dbUser = await storage.getUser(user.id || user.claims?.sub);

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      globalRole: dbUser.globalRole,
      profileComplete: dbUser.profileComplete,
      onboardingComplete: dbUser.onboardingComplete
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}
