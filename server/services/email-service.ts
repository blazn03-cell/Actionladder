import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface PayoutEmailData {
  teamName: string;
  matchId: string;
  division: string;
  amount: number;
  transferId: string;
  opponentTeam?: string;
}

interface OnboardingEmailData {
  teamName: string;
  accountId: string;
  platformUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure nodemailer (using SMTP or service like SendGrid)
    this.transporter = nodemailer.createTransport({
      // For development, use ethereal email (test emails)
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: options.from || '"Action Ladder" <noreply@actionladder.net>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  generatePayoutEmail(data: PayoutEmailData): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(data.amount / 100);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You Just Got Paid! 💸</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #000000;
            color: #ffffff;
            font-family: 'Courier New', monospace;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #111111;
          }
          .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 2px solid #00ff00;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 10px;
          }
          .tagline {
            color: #888888;
            font-size: 14px;
            font-style: italic;
          }
          .payout-amount {
            text-align: center;
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: #000000;
            font-size: 48px;
            font-weight: bold;
            padding: 30px;
            margin: 30px 0;
            border-radius: 10px;
            text-shadow: none;
          }
          .match-details {
            background-color: #1a1a1a;
            padding: 20px;
            border-left: 4px solid #00ff00;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #333333;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #888888;
            font-weight: bold;
          }
          .detail-value {
            color: #00ff00;
          }
          .celebration {
            text-align: center;
            font-size: 24px;
            margin: 30px 0;
            color: #00ff00;
          }
          .footer {
            text-align: center;
            padding: 30px 0;
            border-top: 2px solid #00ff00;
            margin-top: 30px;
            color: #888888;
            font-size: 12px;
          }
          .respect-earned {
            background-color: #1a1a1a;
            padding: 20px;
            border: 2px solid #00ff00;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
          }
          .transfer-id {
            font-family: monospace;
            background-color: #222222;
            padding: 10px;
            border-radius: 5px;
            color: #00ff00;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎱 ACTION LADDER</div>
            <div class="tagline">"In here, respect is earned in racks, not words"</div>
          </div>

          <div class="celebration">
            🏆 YOU JUST GOT PAID! 💸
          </div>

          <div class="payout-amount">
            ${formattedAmount}
          </div>

          <div class="respect-earned">
            <h2 style="color: #00ff00; margin-top: 0;">RESPECT EARNED 🔥</h2>
            <p>You put in the work and showed up when it mattered. That's what separates the real players from the pretenders.</p>
          </div>

          <div class="match-details">
            <h3 style="color: #00ff00; margin-top: 0;">Match Details</h3>
            <div class="detail-row">
              <span class="detail-label">Team:</span>
              <span class="detail-value">${data.teamName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Division:</span>
              <span class="detail-value">${data.division}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Match ID:</span>
              <span class="detail-value">${data.matchId}</span>
            </div>
            ${data.opponentTeam ? `
            <div class="detail-row">
              <span class="detail-label">Defeated:</span>
              <span class="detail-value">${data.opponentTeam}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Payout Amount:</span>
              <span class="detail-value">${formattedAmount}</span>
            </div>
          </div>

          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #00ff00; margin-top: 0;">Transfer Details</h4>
            <p style="color: #888888; margin-bottom: 10px;">Transfer ID:</p>
            <div class="transfer-id">${data.transferId}</div>
            <p style="color: #888888; font-size: 14px; margin-top: 15px;">
              💳 Funds will appear in your connected bank account within 1-2 business days.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #888888;">Ready for the next challenge?</p>
            <a href="https://actionladder.net/app" style="background-color: #00ff00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              FIND YOUR NEXT MATCH 🎯
            </a>
          </div>

          <div class="footer">
            <p><strong>Powered by Action Ladder</strong></p>
            <p>The premier billiards competition platform where legends are made.</p>
            <p>Questions? Contact support@actionladder.net</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOnboardingCompleteEmail(data: OnboardingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Action Ladder! 🎱</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #000000;
            color: #ffffff;
            font-family: 'Courier New', monospace;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #111111;
          }
          .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 2px solid #00ff00;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 10px;
          }
          .tagline {
            color: #888888;
            font-size: 14px;
            font-style: italic;
          }
          .welcome-message {
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: #000000;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
          }
          .setup-complete {
            background-color: #1a1a1a;
            padding: 20px;
            border-left: 4px solid #00ff00;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 30px 0;
            border-top: 2px solid #00ff00;
            margin-top: 30px;
            color: #888888;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎱 ACTION LADDER</div>
            <div class="tagline">"In here, respect is earned in racks, not words"</div>
          </div>

          <div class="welcome-message">
            <h1 style="margin-top: 0; color: #000000;">WELCOME TO THE LADDER! 🏆</h1>
            <p style="font-size: 18px; margin-bottom: 0; color: #000000;">Your team is now ready to compete and earn.</p>
          </div>

          <div class="setup-complete">
            <h2 style="color: #00ff00; margin-top: 0;">✅ Setup Complete</h2>
            <p><strong>${data.teamName}</strong> is now fully connected to Action Ladder's payout system.</p>
            <ul style="color: #888888;">
              <li>✅ Stripe account verified and active</li>
              <li>✅ Bank account connected for payouts</li>
              <li>✅ Ready to receive winnings instantly</li>
              <li>✅ Tax information submitted</li>
            </ul>
          </div>

          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #00ff00; margin-top: 0;">What's Next?</h3>
            <ol style="color: #888888;">
              <li><strong style="color: #00ff00;">Find Matches:</strong> Browse available challenges in your division</li>
              <li><strong style="color: #00ff00;">Pay Entry Fees:</strong> Secure your spot with instant payment</li>
              <li><strong style="color: #00ff00;">Compete:</strong> Show up and put in the work</li>
              <li><strong style="color: #00ff00;">Get Paid:</strong> Winners receive payouts within 1-2 business days</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #888888;">Ready to earn your respect?</p>
            <a href="${data.platformUrl}/app?tab=match-divisions" style="background-color: #00ff00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              START COMPETING 🎯
            </a>
          </div>

          <div style="background-color: #1a1a1a; padding: 20px; border: 2px solid #00ff00; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h4 style="color: #00ff00; margin-top: 0;">Remember the Code 💯</h4>
            <p style="margin-bottom: 0;">In here, respect is earned in racks, not words. Show up, play hard, and let your game do the talking.</p>
          </div>

          <div class="footer">
            <p><strong>Powered by Action Ladder</strong></p>
            <p>The premier billiards competition platform where legends are made.</p>
            <p>Questions? Contact support@actionladder.net</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPayoutNotification(data: PayoutEmailData, recipientEmail: string): Promise<void> {
    const html = this.generatePayoutEmail(data);
    await this.sendEmail({
      to: recipientEmail,
      subject: `🎱 You Just Got Paid! ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount / 100)} from Action Ladder 💸`,
      html,
    });
  }

  async sendOnboardingComplete(data: OnboardingEmailData, recipientEmail: string): Promise<void> {
    const html = this.generateOnboardingCompleteEmail(data);
    await this.sendEmail({
      to: recipientEmail,
      subject: `🏆 Welcome to Action Ladder! Your team ${data.teamName} is ready to compete`,
      html,
    });
  }

  async sendMatchEntryConfirmation(teamName: string, division: string, entryFee: number, matchId: string, recipientEmail: string): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(entryFee / 100);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Match Entry Confirmed! 🎱</title>
        <style>
          body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: 'Courier New', monospace; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111111; }
          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #00ff00; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #00ff00; margin-bottom: 10px; }
          .confirmation { background: linear-gradient(45deg, #00ff00, #00cc00); color: #000000; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; }
          .details { background-color: #1a1a1a; padding: 20px; border-left: 4px solid #00ff00; margin: 20px 0; }
          .footer { text-align: center; padding: 30px 0; border-top: 2px solid #00ff00; margin-top: 30px; color: #888888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎱 ACTION LADDER</div>
          </div>
          <div class="confirmation">
            <h1 style="margin-top: 0; color: #000000;">ENTRY CONFIRMED! 🔥</h1>
            <p style="font-size: 18px; margin-bottom: 0; color: #000000;">You're locked in. Time to show what you're made of.</p>
          </div>
          <div class="details">
            <h3 style="color: #00ff00; margin-top: 0;">Match Details</h3>
            <p><strong>Team:</strong> ${teamName}</p>
            <p><strong>Division:</strong> ${division}</p>
            <p><strong>Entry Fee:</strong> ${formattedAmount}</p>
            <p><strong>Match ID:</strong> ${matchId}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #888888;">Get ready to earn your respect on the table.</p>
            <a href="https://actionladder.net/app?tab=matches" style="background-color: #00ff00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              VIEW MY MATCHES 🎯
            </a>
          </div>
          <div class="footer">
            <p><strong>Powered by Action Ladder</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `🎱 Match Entry Confirmed: ${division} - ${formattedAmount} entry fee paid`,
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    appBaseUrl: string = process.env.APP_BASE_URL || "http://localhost:5000"
  ): Promise<boolean> {
    const resetUrl = `${appBaseUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">ActionLadder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Pool • Points • Pride</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password for your ActionLadder account. 
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #059669; font-size: 14px; word-break: break-all; background: #f3f4f6; 
                    padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="background: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2025 ActionLadder - In here, respect is earned in racks, not words</p>
        </div>
      </div>
    `;

    try {
      await this.sendEmail({
        to: email,
        subject: "ActionLadder - Password Reset Request",
        html,
      });
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  appBaseUrl?: string
): Promise<boolean> {
  return emailService.sendPasswordResetEmail(email, resetToken, appBaseUrl);
}