import * as cron from 'node-cron';
import { IStorage } from './storage';
import { generateMonthlyRewardCoupons } from './services/rewardService';
import { MailService } from '@sendgrid/mail';

interface RewardResult {
  hallId: string;
  hallName?: string;
  playerId?: string;
  playerName?: string;
  couponId: string | null;
  applied: boolean;
  error?: string;
  rewardId?: string;
}

export class TrainingRewardsScheduler {
  private storage: IStorage;
  private isRunning = false;
  private tasks: cron.ScheduledTask[] = [];

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Calculate previous month period in YYYY-MM format
   */
  private getPreviousMonthPeriod(): string {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Start the monthly training rewards scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('[REWARDS_CRON] Monthly training rewards scheduler is already running');
      return;
    }

    // Run on the 1st day of each month at midnight (00:00)
    const monthlyTask = cron.schedule('0 0 1 * *', async () => {
      await this.processMonthlyRewards();
    });

    this.tasks.push(monthlyTask);
    this.isRunning = true;
    
    console.log('[REWARDS_CRON] Monthly training rewards scheduler started - runs on 1st of each month at midnight');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('[REWARDS_CRON] Monthly training rewards scheduler is not running');
      return;
    }

    this.tasks.forEach(task => {
      if ('destroy' in task) {
        task.destroy();
      }
    });
    
    this.tasks = [];
    this.isRunning = false;
    console.log('[REWARDS_CRON] Monthly training rewards scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.length
    };
  }

  /**
   * Main reward processing logic
   */
  async processMonthlyRewards(period?: string): Promise<{
    success: boolean;
    period: string;
    results: RewardResult[];
    summary: {
      total: number;
      applied: number;
      failed: number;
      noData: number;
    };
  }> {
    const rewardPeriod = period || this.getPreviousMonthPeriod();
    console.log(`[REWARDS_CRON] Running monthly training rewards job for period: ${rewardPeriod}`);

    const results: RewardResult[] = [];
    let noDataCount = 0;

    try {
      // Calculate monthly scores for the period
      await this.storage.calculateMonthlyScores(rewardPeriod);
      console.log(`[REWARDS_CRON] Monthly scores calculated for ${rewardPeriod}`);

      // Get all halls
      const halls = await this.storage.getAllPoolHalls();
      console.log(`[REWARDS_CRON] Processing ${halls.length} halls`);

      // Process each hall
      for (const hall of halls) {
        try {
          // Get leaderboard for this hall
          const leaderboard = await this.storage.getHallLeaderboard(hall.id, rewardPeriod);
          
          if (!leaderboard.length) {
            console.log(`[REWARDS_CRON] No training data for hall ${hall.name} (${hall.id}) in ${rewardPeriod}`);
            noDataCount++;
            results.push({
              hallId: hall.id,
              hallName: hall.name,
              couponId: null,
              applied: false,
              error: 'No training data for period'
            });
            continue;
          }

          // Get winners (players marked as winners in the leaderboard)
          const winners = leaderboard.filter(score => score.isWinner);

          if (!winners.length) {
            console.log(`[REWARDS_CRON] No winners for hall ${hall.name} (${hall.id}) in ${rewardPeriod}`);
            noDataCount++;
            results.push({
              hallId: hall.id,
              hallName: hall.name,
              couponId: null,
              applied: false,
              error: 'No winners for period'
            });
            continue;
          }

          // Prepare winners data for reward generation
          const winnersData = winners.map(winner => ({
            playerId: winner.playerId,
            hallId: winner.hallId,
            ladderId: winner.ladderId,
            discountPercent: (winner.rank === 1 ? 100 : 50) as 50 | 100,
            period: rewardPeriod
          }));

          // Generate and apply rewards
          const rewardResults = await generateMonthlyRewardCoupons(winnersData);

          // Get player names for logging
          const players = await this.storage.getAllPlayers();
          
          // Add results with enriched data
          for (const result of rewardResults) {
            const player = players.find(p => p.id === result.playerId);
            results.push({
              hallId: result.hallId,
              hallName: hall.name,
              playerId: result.playerId,
              playerName: player?.name,
              couponId: result.couponId,
              applied: result.applied,
              error: result.error,
              rewardId: result.rewardId
            });

            if (result.applied) {
              const winnerData = winnersData.find(w => w.playerId === result.playerId);
              console.log(`[REWARDS_CRON] Applied ${winnerData?.discountPercent}% reward to player ${player?.name} (${result.playerId}) at hall ${hall.name}`);
            } else {
              console.error(`[REWARDS_CRON] Failed to apply reward for player ${player?.name} (${result.playerId}) at hall ${hall.name}: ${result.error}`);
            }
          }
        } catch (error: any) {
          console.error(`[REWARDS_CRON] Error processing hall ${hall.name} (${hall.id}):`, error.message);
          results.push({
            hallId: hall.id,
            hallName: hall.name,
            couponId: null,
            applied: false,
            error: error.message
          });
        }
      }

      const appliedCount = results.filter(r => r.applied).length;
      const failedCount = results.filter(r => !r.applied && r.error && r.error !== 'No training data for period' && r.error !== 'No winners for period').length;

      const summary = {
        total: results.length,
        applied: appliedCount,
        failed: failedCount,
        noData: noDataCount
      };

      console.log(`[REWARDS_CRON] Monthly rewards completed for ${rewardPeriod}:`, summary);

      // Send email notification to admins
      await this.sendAdminNotification(rewardPeriod, results, summary);

      return {
        success: true,
        period: rewardPeriod,
        results,
        summary
      };
    } catch (error: any) {
      console.error(`[REWARDS_CRON] Error in monthly rewards processing:`, error.message);
      return {
        success: false,
        period: rewardPeriod,
        results,
        summary: {
          total: results.length,
          applied: results.filter(r => r.applied).length,
          failed: results.filter(r => !r.applied).length,
          noData: noDataCount
        }
      };
    }
  }

  /**
   * Send email notification to admins with reward summary
   */
  private async sendAdminNotification(period: string, results: RewardResult[], summary: any): Promise<void> {
    try {
      // Get admin users (OWNER and STAFF)
      const allUsers = await this.storage.getAllUsers();
      const adminUsers = allUsers.filter(u => u.globalRole === 'OWNER' || u.globalRole === 'STAFF');

      if (!adminUsers.length) {
        console.log('[REWARDS_CRON] No admin users found to send notification');
        return;
      }

      // Get admin emails
      const adminEmails = adminUsers.map(u => u.email).filter(Boolean);
      
      if (!adminEmails.length) {
        console.log('[REWARDS_CRON] No admin email addresses found');
        return;
      }

      // Prepare email content
      const appliedRewards = results.filter(r => r.applied);
      const failedRewards = results.filter(r => !r.applied && r.error && !r.error.includes('No training data') && !r.error.includes('No winners'));

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">ActionLadder Training Rewards</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Monthly Reward Summary</p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">Period: ${period}</h2>
            
            <div style="margin-bottom: 30px;">
              <h3 style="color: #374151;">Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f3f4f6;">
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">Total Processed</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${summary.total}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">Successfully Applied</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; color: #059669; font-weight: bold;">${summary.applied}</td>
                </tr>
                <tr style="background: #f3f4f6;">
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">Failed</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${summary.failed}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">No Data</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; color: #9ca3af;">${summary.noData}</td>
                </tr>
              </table>
            </div>

            ${appliedRewards.length > 0 ? `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #059669;">Successfully Applied Rewards</h3>
                <ul style="color: #6b7280; list-style: none; padding: 0;">
                  ${appliedRewards.map(r => `
                    <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong>${r.playerName || r.playerId}</strong> at <em>${r.hallName}</em>
                      ${r.couponId ? `<br/><small style="color: #9ca3af;">Coupon: ${r.couponId}</small>` : ''}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            ${failedRewards.length > 0 ? `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #dc2626;">Failed Rewards</h3>
                <ul style="color: #6b7280; list-style: none; padding: 0;">
                  ${failedRewards.map(r => `
                    <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong>${r.playerName || r.playerId || 'Unknown'}</strong> at <em>${r.hallName}</em>
                      <br/><small style="color: #dc2626;">Error: ${r.error}</small>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from the ActionLadder training rewards system.
              </p>
            </div>
          </div>
          
          <div style="background: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 ActionLadder - In here, respect is earned in racks, not words</p>
          </div>
        </div>
      `;

      const emailText = `
ActionLadder Training Rewards - Monthly Summary

Period: ${period}

Summary:
- Total Processed: ${summary.total}
- Successfully Applied: ${summary.applied}
- Failed: ${summary.failed}
- No Data: ${summary.noData}

${appliedRewards.length > 0 ? `
Successfully Applied Rewards:
${appliedRewards.map(r => `- ${r.playerName || r.playerId} at ${r.hallName}${r.couponId ? ` (${r.couponId})` : ''}`).join('\n')}
` : ''}

${failedRewards.length > 0 ? `
Failed Rewards:
${failedRewards.map(r => `- ${r.playerName || r.playerId || 'Unknown'} at ${r.hallName}: ${r.error}`).join('\n')}
` : ''}

This is an automated notification from the ActionLadder training rewards system.
      `;

      // Check if SendGrid is configured
      if (!process.env.SENDGRID_API_KEY) {
        console.log('[REWARDS_CRON] SENDGRID_API_KEY not set - skipping email (dev mode)');
        console.log(`[REWARDS_CRON] Email would have been sent to: ${adminEmails.join(', ')}`);
        console.log('[REWARDS_CRON] Email content preview:');
        console.log(emailText);
        return;
      }

      // Initialize SendGrid
      const mailService = new MailService();
      mailService.setApiKey(process.env.SENDGRID_API_KEY);

      // Send email to all admins
      try {
        await mailService.send({
          to: adminEmails,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@actionladder.com',
          subject: `Monthly Training Rewards Applied - ${period}`,
          text: emailText,
          html: emailHtml,
        });

        console.log(`[REWARDS_CRON] Notification email sent successfully to ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);
      } catch (emailError: any) {
        console.error('[REWARDS_CRON] Failed to send email via SendGrid:', emailError.message);
        if (emailError.response) {
          console.error('[REWARDS_CRON] SendGrid error details:', emailError.response.body);
        }
      }
    } catch (error: any) {
      console.error('[REWARDS_CRON] Failed to send admin notification:', error.message);
    }
  }
}

// Global instance
let schedulerInstance: TrainingRewardsScheduler | null = null;

export function initializeTrainingRewardsScheduler(storage: IStorage) {
  if (!schedulerInstance) {
    schedulerInstance = new TrainingRewardsScheduler(storage);
    schedulerInstance.start();
  }
  return schedulerInstance;
}

export function getTrainingRewardsScheduler(): TrainingRewardsScheduler | null {
  return schedulerInstance;
}
