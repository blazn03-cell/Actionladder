import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message: string; // Error message when limit exceeded
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message,
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip || 'unknown'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Initialize or get existing rate limit data
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime <= now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    const rateLimit = rateLimitStore[key];

    // Check if limit exceeded
    if (rateLimit.count >= max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
      });
    }

    // Increment counter
    rateLimit.count++;

    // Set headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': Math.max(0, max - rateLimit.count).toString(),
      'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
    });

    // Skip incrementing on successful requests if configured
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(body) {
        if (res.statusCode < 400) {
          rateLimit.count--;
        }
        return originalSend.call(this, body);
      };
    }

    next();
  };
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiting
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: "Too many requests, please try again later"
  }),

  // Authentication endpoints (stricter)
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: "Too many authentication attempts, please try again later"
  }),

  // Payment endpoints (very strict)
  payment: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 payment attempts per 5 minutes
    message: "Too many payment attempts, please wait before trying again"
  }),

  // Challenge creation (moderate)
  challenges: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 challenges per minute
    message: "Please wait before creating more challenges"
  }),

  // File upload (strict)
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    message: "Upload limit reached, please wait before uploading more files"
  }),

  // Challenge check-in (strict - prevent spam)
  checkin: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 check-in attempts per minute per IP
    message: "Too many check-in attempts, please wait before trying again"
  }),

  // Admin operations (very strict)
  admin: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 admin operations per 5 minutes
    message: "Admin operation limit reached"
  })
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime <= now) {
      delete rateLimitStore[key];
    }
  }
}, 60 * 1000); // Cleanup every minute