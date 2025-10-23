import { Strategy, VerifiedCallback, VerifyCallback } from 'passport-custom';
import { supabase } from '../config/supabase';
import { storage } from '../storage';
// import type { VerifyFunction } from 'passport-custom';

export interface SupabaseUser {
  id: string;
  email: string;
  name?: string;
  globalRole?: string;
  claims?: any;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

export class SupabaseStrategy extends Strategy {
  constructor() {
    super(async (req: any, done: VerifiedCallback) => {
      try {
        // Extract auth data from request
        const { email, password, provider, access_token } = req.body;

        if (!email) {
          return done(new Error('Email is required'));
        }

        // Handle different auth methods
        if (provider === 'google' && access_token) {
          const result = await this.handleGoogleAuth(req);
          if (result.success) {
            return done(null, result.user);
          } else {
            return done(new Error(result.error));
          }
        } else if (password) {
          const result = await this.handleEmailPasswordAuth(req);
          if (result.success) {
            return done(null, result.user);
          } else {
            return done(new Error(result.error));
          }
        } else {
          return done(new Error('Invalid authentication method'));
        }
      } catch (error) {
        return done(error);
      }
    });
  }

  private async handleGoogleAuth(req: any): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      const { access_token } = req.body;

      // Verify Google token with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: access_token
      });

      if (error || !data.user) {
        return { success: false, error: 'Google authentication failed' };
      }

      // Create or update user in our database
      const user = await this.upsertSupabaseUser(data.user);

      // Create session data compatible with existing system
      const sessionUser: SupabaseUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.email!,
        globalRole: user.globalRole,
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

      return { success: true, user: sessionUser };
    } catch (error) {
      return { success: false, error: 'Google authentication error' };
    }
  }

  private async handleEmailPasswordAuth(req: any): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
    try {
      const { email, password } = req.body;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Create or update user in our database
      const user = await this.upsertSupabaseUser(data.user);

      // Create session data compatible with existing system
      const sessionUser: SupabaseUser = {
        id: data.user.id,
        email: data.user.email!,
        name: user.name || data.user.email!,
        globalRole: user.globalRole,
        claims: {
          sub: data.user.id,
          email: data.user.email
        },
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at
      };

      return { success: true, user: sessionUser };
    } catch (error) {
      return { success: false, error: 'Email/password authentication error' };
    }
  }

  private async upsertSupabaseUser(supabaseUser: any) {
    // Create or update user in our database
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
      globalRole: 'PLAYER' as const, // Default role
      profileComplete: false,
      onboardingComplete: false,
      accountStatus: 'active'
    };

    return await storage.upsertUser(userData);
  }
}
