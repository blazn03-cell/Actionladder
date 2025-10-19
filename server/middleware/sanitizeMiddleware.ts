import type { Request, Response, NextFunction } from "express";
import { sanitizeText } from "@shared/safeLanguage";

// Sanitizes common text fields on req.body
export function sanitizeBody(fields: string[] = ["title", "description", "notes", "message", "name", "blurb", "rules"]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === "object") {
      for (const f of fields) {
        if (typeof req.body[f] === "string") {
          req.body[f] = sanitizeText(req.body[f]);
        }
      }
    }
    next();
  };
}

// Sanitizes response data before sending
export function sanitizeResponse() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      if (body && typeof body === "object") {
        sanitizeObjectRecursively(body);
      }
      return originalJson.call(this, body);
    };
    
    next();
  };
}

function sanitizeObjectRecursively(obj: any): void {
  if (!obj || typeof obj !== "object") return;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      obj[key] = sanitizeText(value);
    } else if (typeof value === "object" && value !== null) {
      sanitizeObjectRecursively(value);
    }
  }
}