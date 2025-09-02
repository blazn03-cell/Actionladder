// Tutoring system utility functions

export interface TutoringSessionData {
  id: string;
  tutorId: string;
  rookieId: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  rookieConfirmed: boolean;
  creditAmount: number; // $15 in cents
  creditApplied: boolean;
}

export class TutoringSystem {
  
  // Check if player qualifies as tutor (580+ Fargo rating)
  static canTutor(fargoRating: number): boolean {
    return fargoRating >= 580;
  }
  
  // Calculate monthly discount based on completed sessions
  static calculateMonthlyDiscount(completedSessions: number): number {
    const creditPerSession = 15; // $15 per session
    return Math.min(completedSessions * creditPerSession, 30); // Max $30 discount
  }
  
  // Calculate effective membership cost after tutoring credits
  static getEffectiveMembershipCost(completedSessions: number): number {
    const baseCost = 60; // $60/month for Pro
    const discount = this.calculateMonthlyDiscount(completedSessions);
    return Math.max(baseCost - discount, 30); // Minimum $30 (50% discount)
  }
  
  // Create tutoring session
  static createSession(tutorId: string, rookieId: string, scheduledAt: Date): Omit<TutoringSessionData, 'id'> {
    return {
      tutorId,
      rookieId,
      scheduledAt,
      duration: 30, // 30 minutes minimum
      status: 'scheduled',
      rookieConfirmed: false,
      creditAmount: 1500, // $15 in cents
      creditApplied: false
    };
  }
  
  // Complete session and award credit
  static completeSession(session: TutoringSessionData): TutoringSessionData {
    return {
      ...session,
      status: 'completed',
      rookieConfirmed: true // Rookie must confirm before credit releases
    };
  }
  
  // Apply tutoring credit to membership or challenge fee
  static applyCredit(
    creditAmount: number, 
    applicationType: 'membership' | 'challenge_fee'
  ): { appliedAmount: number; remaining: number } {
    // For membership: apply up to $30 per month
    // For challenge fee: apply full credit amount
    
    if (applicationType === 'membership') {
      const maxMonthlyCredit = 30; // $30 max discount per month
      const appliedAmount = Math.min(creditAmount, maxMonthlyCredit);
      return {
        appliedAmount,
        remaining: creditAmount - appliedAmount
      };
    }
    
    // Apply full amount to challenge fee
    return {
      appliedAmount: creditAmount,
      remaining: 0
    };
  }
  
  // Validate session requirements
  static validateSession(session: Partial<TutoringSessionData>): boolean {
    return !!(
      session.tutorId &&
      session.rookieId &&
      session.duration &&
      session.duration >= 30 && // Minimum 30 minutes
      session.scheduledAt
    );
  }
  
  // Get tutoring requirements for Pro members
  static getTutoringRequirements(): string[] {
    return [
      'Pro member (580+ Fargo rating)',
      'Tutor at least 2 Rookies per month',
      'Each session must be 30+ minutes',
      'Rookie must confirm session completion',
      '$15 credit per completed session',
      'Max 2 sessions/month = $30 off → $45 effective cost'
    ];
  }
}

export const tutoringSystem = new TutoringSystem();