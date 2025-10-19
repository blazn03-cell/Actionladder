import { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { hashPassword } from "../middleware/auth";
import { sendPasswordResetEmail } from "../services/email-service";

// Validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// In-memory storage for reset tokens (in production, use Redis or database)
const resetTokens = new Map<string, { email: string; expires: number }>();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(resetTokens.entries());
  for (const [token, data] of entries) {
    if (data.expires < now) {
      resetTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

// Request password reset
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour

    // Store reset token
    resetTokens.set(resetToken, { email, expires });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}`);
    }
    
    res.json({ 
      message: "If the email exists, a reset link has been sent.",
      // In development, include token for testing
      ...(process.env.NODE_ENV === "development" && { resetToken })
    });
    
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(400).json({ message: error.message || "Invalid request" });
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    
    // Check if token exists and is valid
    const tokenData = resetTokens.get(token);
    if (!tokenData || tokenData.expires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Get user
    const user = await storage.getUserByEmail(tokenData.email);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await storage.updateUser(user.id, { passwordHash });

    // Remove used token
    resetTokens.delete(token);

    // Reset login attempts
    await storage.updateUser(user.id, { 
      loginAttempts: 0, 
      lockedUntil: undefined 
    });

    res.json({ message: "Password reset successful" });
    
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: error.message || "Invalid request" });
  }
}
