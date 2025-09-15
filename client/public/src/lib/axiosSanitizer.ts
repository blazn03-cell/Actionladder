import { sanitizeText } from "@shared/safeLanguage";

// Global request interceptor to sanitize outgoing data
// Only set up if we have fetch available (modern browsers)
if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (init?.body && typeof init.body === "string") {
      try {
        const data = JSON.parse(init.body);
        sanitizeObjectRecursively(data);
        init.body = JSON.stringify(data);
      } catch {
        // If not JSON, sanitize as plain text
        init.body = sanitizeText(init.body);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

function sanitizeObjectRecursively(obj: any): void {
  if (!obj || typeof obj !== "object") return;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      obj[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      value.forEach(item => sanitizeObjectRecursively(item));
    } else if (typeof value === "object" && value !== null) {
      sanitizeObjectRecursively(value);
    }
  }
}