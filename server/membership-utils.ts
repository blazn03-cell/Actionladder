// Membership utility functions for Basic and Pro tiers

export interface MembershipBenefits {
  commissionRate: number; // Decimal (0.05 = 5%)
  freeTournaments: boolean;
  tournamentEntryFee: number; // Cents
  perks: string[];
}

export function getMembershipBenefits(membershipTier: string): MembershipBenefits {
  switch (membershipTier) {
    case 'basic':
      return {
        commissionRate: 0.05, // 5% commission (rounded up)
        freeTournaments: false,
        tournamentEntryFee: 2500, // $25 (can be $25-30 range)
        perks: [
          'Jump in the ladder',
          '5% commission (rounded up)',
          'Tournament entry: $25–30'
        ]
      };
    
    case 'pro':
      return {
        commissionRate: 0.03, // 3% commission (lower than Basic)
        freeTournaments: true,
        tournamentEntryFee: 0, // FREE tournament entry
        perks: [
          'FREE tournament entry (worth $25–30)',
          'Lower commission (3%)',
          'Premium perks (priority seeding, livestream)',
          'Tutor Bonus: $15 credit per session',
          'Effective cost: $45/month (with 2 tutoring sessions)'
        ]
      };
    
    default: // 'none' or no membership
      return {
        commissionRate: 0.15, // 15% commission for non-members
        freeTournaments: false,
        tournamentEntryFee: 3000, // $30 for non-members
        perks: []
      };
  }
}

export function calculateCommission(stake: number, membershipTier: string): number {
  const benefits = getMembershipBenefits(membershipTier);
  const commission = stake * benefits.commissionRate;
  
  // For Basic tier: "5% commission (rounded up, don't cry over $1)"
  if (membershipTier === 'basic') {
    return Math.ceil(commission);
  }
  
  return Math.round(commission);
}

export function getTournamentEntry(membershipTier: string): number {
  const benefits = getMembershipBenefits(membershipTier);
  return benefits.tournamentEntryFee;
}