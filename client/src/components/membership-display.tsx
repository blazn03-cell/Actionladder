import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Star, Trophy } from "lucide-react";

interface MembershipDisplayProps {
  membershipTier: string;
  onUpgrade?: () => void;
}

export function MembershipDisplay({ membershipTier, onUpgrade }: MembershipDisplayProps) {
  const getMembershipInfo = (tier: string) => {
    switch (tier) {
      case 'basic':
        return {
          name: 'Basic Member',
          price: '$25/month',
          commission: '5%',
          tournamentEntry: '$25-30',
          icon: <Star className="w-5 h-5" />,
          color: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
          perks: [
            'Jump in the ladder',
            '5% commission (rounded up)',
            'Tournament entry: $25–30'
          ]
        };
      
      case 'pro':
        return {
          name: 'Pro Member',
          price: '$45/month',
          commission: '3%',
          tournamentEntry: 'FREE',
          icon: <Crown className="w-5 h-5" />,
          color: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
          perks: [
            'FREE tournament entry (worth $25–30)',
            'Lower commission (3%)',
            'Premium perks → play like a boss',
            'Priority table booking',
            'Advanced analytics'
          ]
        };
      
      default:
        return {
          name: 'No Membership',
          price: 'Free',
          commission: '15%',
          tournamentEntry: '$30',
          icon: <Trophy className="w-5 h-5" />,
          color: 'bg-gray-600/20 text-gray-400 border-gray-500/30',
          perks: [
            'Basic ladder access',
            '15% commission for non-members',
            'Tournament entry: $30'
          ]
        };
    }
  };

  const info = getMembershipInfo(membershipTier);

  return (
    <Card className={`bg-black/60 backdrop-blur-sm border shadow-felt ${info.color}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {info.icon}
          {info.name}
          <Badge className={info.color}>
            {info.price}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold">{info.commission}</div>
            <div className="text-xs text-gray-400">Commission</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{info.tournamentEntry}</div>
            <div className="text-xs text-gray-400">Tournament Entry</div>
          </div>
        </div>
        
        <div className="space-y-2">
          {info.perks.map((perk, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-green-400 font-bold">•</span>
              <span className="text-sm text-gray-300">{perk}</span>
            </div>
          ))}
        </div>
        
        {membershipTier !== 'pro' && onUpgrade && (
          <Button
            onClick={onUpgrade}
            className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-black font-bold"
            data-testid="button-upgrade-membership"
          >
            {membershipTier === 'basic' ? 'Upgrade to Pro' : 'Get Basic Membership'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}