import fs from "fs";
import path from "path";
import { sanitizeText } from "../shared/safeLanguage";

const ROOT = process.argv[2] ?? "client/src"; // default to client source

function processFile(filePath: string) {
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    const clean = sanitizeText(txt);
    if (clean !== txt) {
      fs.writeFileSync(filePath, clean, "utf8");
      console.log(`✓ Sanitized: ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠ Could not process: ${filePath}`, error);
  }
}

function walk(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!["node_modules", "dist", "build", ".git"].includes(f)) {
        walk(full);
      }
    } else if (/\.(md|txt|json|html|tsx?|jsx?)$/.test(f)) {
      processFile(full);
    }
  }
}

console.log(`Starting bulk sanitization of: ${path.resolve(ROOT)}`);
walk(path.resolve(ROOT));
console.log("Bulk sanitize complete.");

// Usage: npx tsx scripts/bulkSanitize.ts ./client/src