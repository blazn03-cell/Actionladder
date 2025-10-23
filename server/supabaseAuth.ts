import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      dbUser?: any;
    }
  }
}

// Supabase configuration
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

// Passport serialization for Supabase users
passport.serializeUser((user: Express.User, cb) => {
  cb(null, user);
});

passport.deserializeUser((user: Express.User, cb) => {
  cb(null, user);
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Import and register Supabase auth routes
  const { registerAuthRoutes } = await import("./routes/auth.routes");
  registerAuthRoutes(app);
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user as any;
    let dbUser;

    // Check if user came from Supabase auth
    if (user.id) {
      dbUser = await storage.getUser(user.id);
    } else if (user.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    }

    if (!dbUser) {
      return res.status(401).json({ message: "User not found in database" });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Owner-only middleware
export const requireOwner: RequestHandler = async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user as any;
    let dbUser;

    if (user.id) {
      dbUser = await storage.getUser(user.id);
    } else if (user.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    }

    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (dbUser.globalRole !== 'OWNER') {
      return res.status(403).json({ message: "Owner access required" });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Owner check error:', error);
    res.status(500).json({ message: "Authorization error" });
  }
};

// Staff or Owner middleware
export const requireStaffOrOwner: RequestHandler = async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user as any;
    let dbUser;

    if (user.id) {
      dbUser = await storage.getUser(user.id);
    } else if (user.claims?.sub) {
      dbUser = await storage.getUser(user.claims.sub);
    }

    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!['OWNER', 'STAFF'].includes(dbUser.globalRole)) {
      return res.status(403).json({ message: "Staff or Owner access required" });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Staff/Owner check error:', error);
    res.status(500).json({ message: "Authorization error" });
  }
};
