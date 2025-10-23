import { config } from "dotenv";
config();
import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log } from "./vite";

const app = express();

// Trust proxy for proper IP detection behind reverse proxy
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"], // unsafe-eval needed for Vite in dev, js.stripe.com for Stripe.js
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Stripe iframe embedding
}));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.REPLIT_DOMAINS?.split(',') || [], 'https://*.replit.app'].flat()
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Exclude webhooks from rate limiting (machine-to-machine traffic)
const isWebhookRoute = (req: express.Request) => {
  return req.path.includes('/webhook') ||
    req.path.includes('/stripe-webhook') ||
    req.headers['stripe-signature'];
};

const skipWebhooks = (limiter: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (isWebhookRoute(req)) return next();
  return limiter(req, res, next);
};

// Create persistent rate limiter instances at app initialization
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes for user payments
  message: { error: 'Too many payment requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many API requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Uncomment this when we have a way to test the rate limiting
// Apply rate limiting with webhook exclusions
// app.use('/api/auth', skipWebhooks(authLimiter));
// app.use('/api/payments', skipWebhooks(paymentLimiter));
// app.use('/api', skipWebhooks(generalLimiter));

// Development-only API logging middleware
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });
}

(async () => {
  // Initialize revenue configuration system
  const { initializeRevenueConfig } = await import("./services/revenueConfigService");
  try {
    await initializeRevenueConfig();
    log("Revenue configuration system initialized");
  } catch (error) {
    log(`Warning: Failed to initialize revenue configuration: ${error}`);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // DISABLED: Vite integration removed for separated client/server architecture
  // Client now runs independently on port 5173
  // Server is now a pure API server
  // if (app.get("env") === "development") {
  //   await setupVite(app, server);
  // } else {
  //   serveStatic(app);
  // }

  // ALWAYS serve the API server on the port specified in the environment variable PORT
  // The system expects port 5000 to be opened. Use environment variable PORT which is set to 5000.
  // This serves only the API - client runs separately on port 5173
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // server.listen({
  //   port,
  //   host: "0.0.0.0",
  //   reusePort: true,
  // }, () => {
  //   log(`serving on port ${port}`);
  // });
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
