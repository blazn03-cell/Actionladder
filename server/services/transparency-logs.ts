
import { storage } from "../storage";

// Automated transparency logging for all financial transactions
export class TransparencyLogger {
  private static instance: TransparencyLogger;
  
  static getInstance(): TransparencyLogger {
    if (!TransparencyLogger.instance) {
      TransparencyLogger.instance = new TransparencyLogger();
    }
    return TransparencyLogger.instance;
  }

  /**
   * Log all revenue transactions for transparency
   */
  async logRevenueTransaction(transaction: {
    type: "challenge_fee" | "membership" | "streak_bonus" | "weekly_prize";
    playerId: string;
    operatorId?: string;
    amount: number; // in cents
    platformShare: number;
    operatorShare: number;
    bonusFundShare: number;
    description: string;
    stripePaymentId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Create detailed audit log entry
      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: transaction.type,
        playerId: transaction.playerId,
        operatorId: transaction.operatorId,
        totalAmount: transaction.amount,
        platformShare: transaction.platformShare,
        operatorShare: transaction.operatorShare,
        bonusFundShare: transaction.bonusFundShare,
        description: transaction.description,
        stripePaymentId: transaction.stripePaymentId,
        verificationHash: this.generateVerificationHash(transaction),
        metadata: transaction.metadata || {}
      };

      // Store in database for permanent record
      await storage.createTransparencyLog(logEntry);

      // Auto-export to Google Sheets (if configured)
      await this.exportToGoogleSheets(logEntry);

      console.log(`Transparency log created: ${logEntry.id}`);
    } catch (error) {
      console.error("Failed to log transparency transaction:", error);
      // Don't throw - logging failures shouldn't break payments
    }
  }

  /**
   * Generate verification hash for transaction integrity
   */
  private generateVerificationHash(transaction: any): string {
    const data = JSON.stringify({
      amount: transaction.amount,
      playerId: transaction.playerId,
      timestamp: Date.now()
    });
    // Simple hash for demo - use crypto.subtle in production
    return btoa(data).slice(0, 16);
  }

  /**
   * Export transaction to Google Sheets for public transparency
   */
  private async exportToGoogleSheets(logEntry: any): Promise<void> {
    if (!process.env.GOOGLE_SHEETS_API_KEY) {
      console.log("Google Sheets not configured - skipping export");
      return;
    }

    try {
      // Format for sheets export
      const sheetRow = [
        logEntry.timestamp,
        logEntry.type,
        logEntry.playerId,
        logEntry.operatorId || "N/A",
        `$${(logEntry.totalAmount / 100).toFixed(2)}`,
        `$${(logEntry.platformShare / 100).toFixed(2)}`,
        `$${(logEntry.operatorShare / 100).toFixed(2)}`,
        `$${(logEntry.bonusFundShare / 100).toFixed(2)}`,
        logEntry.description,
        logEntry.verificationHash
      ];

      // In production, use Google Sheets API to append row
      console.log("Would export to sheets:", sheetRow);
    } catch (error) {
      console.error("Google Sheets export failed:", error);
    }
  }

  /**
   * Generate monthly transparency report
   */
  async generateMonthlyReport(month: string): Promise<{
    totalRevenue: number;
    platformEarnings: number;
    operatorPayouts: number;
    bonusFundDistributed: number;
    playerBenefits: number;
    transactionCount: number;
  }> {
    const logs = await storage.getTransparencyLogsByMonth(month);
    
    return logs.reduce((report, log) => {
      report.totalRevenue += log.totalAmount;
      report.platformEarnings += log.platformShare;
      report.operatorPayouts += log.operatorShare;
      report.bonusFundDistributed += log.bonusFundShare;
      report.transactionCount++;
      return report;
    }, {
      totalRevenue: 0,
      platformEarnings: 0,
      operatorPayouts: 0,
      bonusFundDistributed: 0,
      playerBenefits: 0,
      transactionCount: 0
    });
  }

  /**
   * Log streak bonus payment for transparency
   */
  async logStreakBonus(playerId: string, streakCount: number, amount: number): Promise<void> {
    await this.logRevenueTransaction({
      type: "streak_bonus",
      playerId,
      amount,
      platformShare: 0, // Bonuses come from bonus fund
      operatorShare: 0,
      bonusFundShare: -amount, // Deducted from bonus fund
      description: `${streakCount}-match streak bonus: $${(amount / 100).toFixed(2)}`
    });
  }

  /**
   * Log weekly mini-prize drawing for transparency
   */
  async logWeeklyPrize(winnerId: string, amount: number, participants: number): Promise<void> {
    await this.logRevenueTransaction({
      type: "weekly_prize",
      playerId: winnerId,
      amount,
      platformShare: 0,
      operatorShare: 0,
      bonusFundShare: -amount,
      description: `Weekly $${(amount / 100).toFixed(2)} mini-prize (${participants} participants)`
    });
  }
}

// Export singleton instance
export const transparencyLogger = TransparencyLogger.getInstance();
