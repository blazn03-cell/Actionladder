import { Request, Response } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { insertTeamRegistrationSchema } from "@shared/schema";
import { emailService } from "../services/email-service";

export function getTeams(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function getTeam(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function createTeam(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function updateTeam(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function deleteTeam(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function getTeamPlayers(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function createTeamPlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function deleteTeamPlayer(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_management" 
    });
  };
}

export function getTeamMatches(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function getTeamMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function createTeamMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function updateTeamMatch(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function revealTeamMatchLineup(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function triggerCaptainBurden(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function getTeamSets(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function createTeamSet(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function updateTeamSet(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_matches" 
    });
  };
}

export function getTeamChallenges(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_challenges" 
    });
  };
}

export function createTeamChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_challenges" 
    });
  };
}

export function acceptTeamChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    res.status(503).json({ 
      message: "Team functionality is coming soon", 
      status: "locked",
      feature: "team_challenges" 
    });
  };
}

export function createTeamStripeOnboarding(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { email, businessType = "individual", country = "US" } = req.body;

      const existingAccount = await storage.getTeamStripeAccount(teamId);
      if (existingAccount) {
        return res.status(400).json({ 
          message: "Team already has a Stripe account",
          accountId: existingAccount.stripeAccountId 
        });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        business_type: businessType,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      const teamStripeAccount = await storage.createTeamStripeAccount({
        teamId,
        stripeAccountId: account.id,
        accountStatus: "pending",
        onboardingCompleted: false,
        detailsSubmitted: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        businessType,
        country,
        email,
      });

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/refresh`,
        return_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/complete`,
        type: 'account_onboarding',
      });

      res.json({
        account: teamStripeAccount,
        onboardingUrl: accountLink.url,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function refreshTeamStripeOnboarding(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const teamAccount = await storage.getTeamStripeAccount(teamId);
      if (!teamAccount) {
        return res.status(404).json({ message: "Team Stripe account not found" });
      }

      const accountLink = await stripe.accountLinks.create({
        account: teamAccount.stripeAccountId,
        refresh_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/refresh`,
        return_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/complete`,
        type: 'account_onboarding',
      });

      await storage.updateTeamStripeAccount(teamId, {
        lastOnboardingRefresh: new Date(),
      });

      res.redirect(accountLink.url);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function completeTeamStripeOnboarding(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const teamAccount = await storage.getTeamStripeAccount(teamId);
      if (!teamAccount) {
        return res.status(404).json({ message: "Team Stripe account not found" });
      }

      const account = await stripe.accounts.retrieve(teamAccount.stripeAccountId);

      const updatedAccount = await storage.updateTeamStripeAccount(teamId, {
        onboardingCompleted: true,
        detailsSubmitted: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        accountStatus: account.payouts_enabled ? "active" : "restricted",
      });

      if (updatedAccount && updatedAccount.email) {
        try {
          await emailService.sendOnboardingComplete({
            teamName: `Team ${teamId}`,
            accountId: account.id,
            platformUrl: `${req.protocol}://${req.get('host')}`,
          }, updatedAccount.email);
        } catch (emailError) {
          console.error('Failed to send onboarding email:', emailError);
        }
      }

      res.redirect(`${req.protocol}://${req.get('host')}/app?tab=team-management&success=onboarding-complete`);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getTeamStripeAccount(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const teamAccount = await storage.getTeamStripeAccount(teamId);
      
      if (!teamAccount) {
        return res.status(404).json({ message: "Team Stripe account not found" });
      }

      if (req.query.refresh === "true") {
        try {
          const account = await stripe.accounts.retrieve(teamAccount.stripeAccountId);
          await storage.updateTeamStripeAccount(teamId, {
            detailsSubmitted: account.details_submitted || false,
            payoutsEnabled: account.payouts_enabled || false,
            chargesEnabled: account.charges_enabled || false,
            accountStatus: account.payouts_enabled ? "active" : "restricted",
          });
        } catch (stripeError) {
          console.error("Error refreshing Stripe account:", stripeError);
        }
      }

      const updatedAccount = await storage.getTeamStripeAccount(teamId);
      res.json(updatedAccount);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createTeamRegistration(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamRegistrationSchema.parse(req.body);
      const registration = await storage.createTeamRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getTeamRegistration(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const registration = await storage.getTeamRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Team registration not found" });
      }
      res.json(registration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getTeamRegistrationsByDivision(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { divisionId } = req.params;
      const registrations = await storage.getTeamRegistrationsByDivision(divisionId);
      res.json(registrations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
