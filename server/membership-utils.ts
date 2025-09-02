// League membership utility functions for Basic and Pro tiers

export interface LeagueMembershipBenefits {
  leagueFeeRate: number; // Decimal (0.05 = 5%)
  freeTournaments: boolean;
  tournamentEntryFee: number; // Cents
  perks: string[];
}

export function getLeagueMembershipBenefits(membershipTier: string): LeagueMembershipBenefits {
  switch (membershipTier) {
    case 'basic':
      return {
        leagueFeeRate: 0.05, // 5% league fee (rounded up)
        freeTournaments: false,
        tournamentEntryFee: 2500, // $25 (can be $25-30 range)
        perks: [
          'Jump in the ladder',
          '5% league dues (rounded up)',
          'Tournament entry: $25–30'
        ]
      };
    
    case 'pro':
      return {
        leagueFeeRate: 0.03, // 3% league fee (lower than Basic)
        freeTournaments: true,
        tournamentEntryFee: 0, // FREE tournament entry
        perks: [
          'FREE tournament entry (worth $25–30)',
          'Lower league fees (3%)',
          'Premium perks (priority seeding, livestream)',
          'Tutor Bonus: $15 credit per session',
          'Effective cost: $45/month (with 2 tutoring sessions)'
        ]
      };
    
    default: // 'none' or no membership
      return {
        leagueFeeRate: 0.15, // 15% league fee for non-members
        freeTournaments: false,
        tournamentEntryFee: 3000, // $30 for non-members
        perks: []
      };
  }
}

export function calculateLeagueFees(challengeAmount: number, membershipTier: string): number {
  const benefits = getLeagueMembershipBenefits(membershipTier);
  const leagueFee = challengeAmount * benefits.leagueFeeRate;
  
  // For Basic tier: "5% league dues (rounded up)"
  if (membershipTier === 'basic') {
    return Math.ceil(leagueFee);
  }
  
  return Math.round(leagueFee);
}

export function getTournamentEntryFee(membershipTier: string): number {
  const benefits = getLeagueMembershipBenefits(membershipTier);
  return benefits.tournamentEntryFee;
}