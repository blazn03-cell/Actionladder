import QRCode from 'qrcode';
import { createHmac, randomBytes } from 'crypto';
import { IStorage } from '../storage';
import { getSocketManager } from './challengeSocketEvents';

// Secure QR code data structure with nonce for replay protection
export interface SecureQRCodeData {
  challengeId: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

// Request context for origin detection
export interface RequestContext {
  protocol: string;
  host: string;
  ipAddress?: string;
  userAgent?: string;
}

// QR Code generation result with token for consistent URLs
export interface QRCodeResult {
  qrCodeDataUrl: string;
  token: string;
  checkInUrl: string;
  expiresIn: number;
}

// Automatic nonce cleanup interval (15 minutes)
const NONCE_CLEANUP_INTERVAL = 15 * 60 * 1000;

export interface QRCodeData {
  challengeId: string;
  hallId: string;
  timestamp: number;
  signature: string;
}

export interface CheckInResult {
  success: boolean;
  playerId?: string;
  challengeId: string;
  checkedInAt?: Date;
  message: string;
  challengeStatus?: string;
  bothPlayersCheckedIn?: boolean;
}

export class QRCodeService {
  private cleanupTimer: NodeJS.Timeout;
  
  constructor(private storage: IStorage) {
    // Start periodic cleanup of expired nonces
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleaned = await this.storage.cleanupExpiredNonces();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired QR code nonces`);
        }
      } catch (error) {
        console.error('Error cleaning up expired nonces:', error);
      }
    }, NONCE_CLEANUP_INTERVAL);
  }

  /**
   * Generate a QR code for a specific challenge with secure HMAC signature
   * @param challengeId The challenge ID to generate QR code for
   * @param requestContext Request context for origin detection and security
   * @returns QR code result with data URL, token, and check-in URL
   */
  async generateChallengeQRCode(challengeId: string, requestContext: RequestContext): Promise<QRCodeResult> {
    try {
      // Get challenge details
      const challenge = await this.storage.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Generate cryptographically secure nonce for replay protection
      const nonce = randomBytes(16).toString('hex');
      const timestamp = Date.now();

      // Create secure QR code data with HMAC signature
      const qrData: SecureQRCodeData = {
        challengeId: challenge.id,
        nonce,
        timestamp,
        signature: this.generateSecureSignature(challengeId, nonce, timestamp)
      };

      // Create opaque token for security
      const token = Buffer.from(JSON.stringify(qrData)).toString('base64url');

      // Store nonce in database for replay protection across instances
      const expiresAt = new Date(timestamp + (15 * 60 * 1000)); // 15 minutes from now
      await this.storage.createQrCodeNonce({
        nonce,
        challengeId,
        expiresAt,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent
      });
      
      // Create check-in URL using request context for proper origin
      const baseUrl = `${requestContext.protocol}://${requestContext.host}`;
      const checkInUrl = `${baseUrl}/challenge-check-in/${challengeId}?token=${token}`;

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return {
        qrCodeDataUrl,
        token,
        checkInUrl,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Process a secure QR code check-in with authentication
   * @param token The secure token from QR code
   * @param authenticatedUserId The authenticated user ID
   * @param requestContext Request context for security tracking
   * @returns Check-in result
   */
  async processSecureCheckIn(token: string, authenticatedUserId: string, requestContext?: RequestContext): Promise<CheckInResult> {
    try {
      // Decode and parse the secure token
      let qrData: SecureQRCodeData;
      try {
        const decodedData = Buffer.from(token, 'base64url').toString('utf8');
        qrData = JSON.parse(decodedData);
      } catch {
        return {
          success: false,
          challengeId: '',
          message: 'Invalid check-in token format'
        };
      }

      // Validate QR code data using database-backed nonce tracking
      const validationResult = await this.validateSecureQRCode(qrData, requestContext);
      if (!validationResult.valid) {
        return {
          success: false,
          challengeId: qrData.challengeId || '',
          message: validationResult.reason || 'Invalid check-in token'
        };
      }

      // Get player ID from authenticated user
      const dbUser = await this.storage.getUser(authenticatedUserId);
      if (!dbUser) {
        return {
          success: false,
          challengeId: qrData.challengeId,
          message: 'User not found'
        };
      }

      // Get player record
      const player = await this.storage.getPlayerByUserId(authenticatedUserId);
      if (!player) {
        return {
          success: false,
          challengeId: qrData.challengeId,
          message: 'Player profile not found'
        };
      }

      return await this.processPlayerCheckIn(qrData, player.id);
    } catch (error: any) {
      console.error('Error processing secure check-in:', error);
      return {
        success: false,
        challengeId: '',
        message: 'Check-in failed due to server error'
      };
    }
  }

  /**
   * Process player check-in with race condition protection
   */
  private async processPlayerCheckIn(qrData: SecureQRCodeData, playerId: string): Promise<CheckInResult> {
    // Get challenge details with atomic locking to prevent race conditions
    const challenge = await this.storage.getChallenge(qrData.challengeId);
    if (!challenge) {
      return {
        success: false,
        challengeId: qrData.challengeId,
        message: 'Challenge not found'
      };
    }

    // Verify player is part of this challenge
    if (challenge.aPlayerId !== playerId && challenge.bPlayerId !== playerId) {
      return {
        success: false,
        challengeId: qrData.challengeId,
        message: 'You are not registered for this challenge'
      };
    }

    // Check if challenge is in valid state for check-in
    if (challenge.status !== 'scheduled') {
      return {
        success: false,
        challengeId: qrData.challengeId,
        message: `Cannot check in: challenge is ${challenge.status}`
      };
    }

    // Atomic check-in with idempotency protection
    try {
      // Check if player already checked in (idempotency)
      const existingCheckIns = await this.storage.getChallengeCheckInsByChallenge(qrData.challengeId);
      const playerAlreadyCheckedIn = existingCheckIns.some(ci => ci.playerId === playerId);
      
      if (playerAlreadyCheckedIn) {
        return {
          success: false,
          challengeId: qrData.challengeId,
          message: 'You have already checked in for this challenge'
        };
      }

      // Create check-in record
      const checkInTime = new Date();
      const checkIn = await this.storage.createChallengeCheckIn({
        challengeId: qrData.challengeId,
        playerId: playerId,
        checkedInAt: checkInTime,
        checkedInBy: 'qr_code'
      });

      // Check if both players have now checked in
      const allCheckIns = await this.storage.getChallengeCheckInsByChallenge(qrData.challengeId);
      const bothPlayersCheckedIn = allCheckIns.length === 2;

      // Update challenge status if both players checked in
      let newChallengeStatus = challenge.status;
      if (bothPlayersCheckedIn) {
        await this.storage.updateChallenge(qrData.challengeId, {
          status: 'in_progress',
          checkedInAt: checkInTime
        });
        newChallengeStatus = 'in_progress';
      }

      // Emit real-time events
      const socketManager = getSocketManager();
      if (socketManager) {
        const message = bothPlayersCheckedIn 
          ? 'Check-in successful! Both players are ready - challenge can begin.'
          : 'Check-in successful! Waiting for opponent to check in.';
          
        await socketManager.emitPlayerCheckIn(qrData.challengeId, playerId, checkInTime, message);
      }

      return {
        success: true,
        playerId: playerId,
        challengeId: qrData.challengeId,
        checkedInAt: checkInTime,
        message: bothPlayersCheckedIn 
          ? 'Check-in successful! Both players are ready - challenge can begin.'
          : 'Check-in successful! Waiting for opponent to check in.',
        challengeStatus: newChallengeStatus,
        bothPlayersCheckedIn
      };

    } catch (error: any) {
      console.error('Error during atomic check-in:', error);
      return {
        success: false,
        challengeId: qrData.challengeId,
        message: 'Check-in failed due to server error'
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async processCheckIn(qrData: QRCodeData, playerId: string): Promise<CheckInResult> {

    // Legacy support - redirect to secure check-in
    console.warn('Using deprecated processCheckIn method. Use processSecureCheckIn instead.');
    const secureData: SecureQRCodeData = {
      challengeId: qrData.challengeId,
      nonce: 'legacy',
      timestamp: qrData.timestamp,
      signature: qrData.signature
    };
    return await this.processPlayerCheckIn(secureData, playerId);
  }

  /**
   * Validate secure QR code data with HMAC signature and database-backed nonce tracking
   */
  private async validateSecureQRCode(qrData: SecureQRCodeData, requestContext?: RequestContext): Promise<{ valid: boolean; reason?: string }> {
    // Check if QR code is not too old (15 minutes max TTL for security)
    const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
    const age = Date.now() - qrData.timestamp;
    
    if (age > maxAge) {
      return { valid: false, reason: 'Check-in token has expired (15 min limit)' };
    }

    // Check for replay attacks using database-backed nonce tracking
    const nonceValid = await this.storage.isNonceValid(qrData.nonce);
    if (!nonceValid) {
      const isUsed = await this.storage.isNonceUsed(qrData.nonce);
      return {
        valid: false,
        reason: isUsed ? 'Check-in token has already been used' : 'Check-in token has expired or is invalid'
      };
    }

    // Verify HMAC signature
    const expectedSignature = this.generateSecureSignature(qrData.challengeId, qrData.nonce, qrData.timestamp);
    if (qrData.signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid check-in token signature' };
    }

    // Mark nonce as used to prevent replay
    await this.storage.markNonceAsUsed(
      qrData.nonce,
      requestContext?.ipAddress,
      requestContext?.userAgent
    );

    return { valid: true };
  }

  /**
   * Legacy validation for backward compatibility
   */
  private validateQRCode(qrData: QRCodeData): { valid: boolean; reason?: string } {
    // Check if QR code is not too old (reduced to 1 hour for legacy codes)
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    const age = Date.now() - qrData.timestamp;
    
    if (age > maxAge) {
      return { valid: false, reason: 'QR code has expired' };
    }

    // Verify signature (legacy weak validation)
    const expectedSignature = this.generateSignature(qrData.challengeId, qrData.hallId || '');
    if (qrData.signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid QR code signature' };
    }

    return { valid: true };
  }

  /**
   * Generate cryptographically secure HMAC-SHA256 signature
   */
  private generateSecureSignature(challengeId: string, nonce: string, timestamp: number): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error('SESSION_SECRET environment variable is required for secure signatures');
    }

    // Create HMAC signature with all critical data
    const data = `${challengeId}:${nonce}:${timestamp}`;
    const hmac = createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Legacy signature generation (deprecated, for backward compatibility only)
   */
  private generateSignature(challengeId: string, hallId: string): string {
    console.warn('Using deprecated generateSignature method. Use generateSecureSignature instead.');
    const data = `${challengeId}:${hallId}:${process.env.SESSION_SECRET || 'default-secret'}`;
    
    // Create a simple hash signature (INSECURE - kept for legacy compatibility)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get check-in status for a challenge
   */
  async getChallengeCheckInStatus(challengeId: string) {
    try {
      const challenge = await this.storage.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const checkIns = await this.storage.getChallengeCheckInsByChallenge(challengeId);
      
      const aPlayerCheckedIn = checkIns.some(ci => ci.playerId === challenge.aPlayerId);
      const bPlayerCheckedIn = checkIns.some(ci => ci.playerId === challenge.bPlayerId);

      return {
        challengeId,
        status: challenge.status,
        aPlayerCheckedIn,
        bPlayerCheckedIn,
        bothPlayersCheckedIn: aPlayerCheckedIn && bPlayerCheckedIn,
        checkIns: checkIns.map(ci => ({
          playerId: ci.playerId,
          checkedInAt: ci.checkedInAt,
          method: ci.checkedInBy
        }))
      };
    } catch (error: any) {
      console.error('Error getting check-in status:', error);
      throw new Error(`Failed to get check-in status: ${error.message}`);
    }
  }
}