import { useMemo } from "react";
import { sanitizeText } from "@shared/safeLanguage";

/**
 * Hook to automatically sanitize text content
 * @param text - The text to sanitize
 * @returns Sanitized text with gambling terms replaced
 */
export function useSafeText(text: string | undefined | null): string {
  return useMemo(() => {
    if (!text) return "";
    return sanitizeText(text);
  }, [text]);
}

/**
 * Hook to sanitize form data before submission
 * @param data - Object with string fields to sanitize
 * @param fields - Array of field names to sanitize
 * @returns Sanitized data object
 */
export function useSafeFormData<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  return useMemo(() => {
    const cleaned = { ...data };
    fields.forEach(field => {
      if (typeof cleaned[field] === "string") {
        cleaned[field] = sanitizeText(cleaned[field]);
      }
    });
    return cleaned;
  }, [data, fields]);
}