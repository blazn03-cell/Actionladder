import { Request, Response } from 'express';
import type { IStorage } from '../storage';
import { PosterService } from '../services/posterService';
import { AIService } from '../services/ai-service';

// Helper functions for poster options
function getTemplateDescription(template: string): string {
  const descriptions = {
    'fight-night': 'Classic fight night poster with dramatic VS layout',
    'championship': 'Championship tournament style with formal presentation',
    'classic': 'Timeless billiards design with traditional elements',
    'neon': 'Modern neon-style poster with electric colors',
  };
  return descriptions[template as keyof typeof descriptions] || 'Custom poster template';
}

function getThemeDescription(theme: string): string {
  const descriptions = {
    'dark': 'Dark background with green accents - signature ActionLadder style',
    'green': 'Pool table green theme with gold highlights',
    'gold': 'Luxury gold and black championship theme',
    'neon': 'Electric neon colors with cyberpunk aesthetics',
  };
  return descriptions[theme as keyof typeof descriptions] || 'Custom color theme';
}

function getThemeColors(theme: string): { primary: string; secondary: string; accent: string } {
  const colors = {
    'dark': { primary: '#0a0a0a', secondary: '#00ff41', accent: '#ffffff' },
    'green': { primary: '#1B5E20', secondary: '#FFD700', accent: '#ffffff' },
    'gold': { primary: '#000000', secondary: '#FFD700', accent: '#B8860B' },
    'neon': { primary: '#0f0f23', secondary: '#00FFFF', accent: '#FF6B6B' },
  };
  return colors[theme as keyof typeof colors] || colors.dark;
}

// Generate poster data for a specific challenge
export function generatePosterForChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const { template = 'fight-night', theme = 'dark' } = req.query;

      const posterService = new PosterService(storage);
      const posterData = await posterService.generatePosterData(challengeId);
      
      // Apply design preferences
      posterData.design = {
        template: template as string,
        theme: theme as string,
      };

      res.json({
        success: true,
        data: posterData,
        meta: {
          challengeId,
          generatedAt: new Date().toISOString(),
          template,
          theme,
        }
      });
    } catch (error) {
      console.error('Error generating poster data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Challenge not found') {
        res.status(404).json({ error: 'Challenge not found' });
      } else if (errorMessage === 'Player data not found') {
        res.status(404).json({ error: 'Player data not found' });
      } else {
        res.status(500).json({ error: 'Failed to generate poster data' });
      }
    }
  };
}

// Generate AI content for a challenge poster
export function generatePosterContent(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const posterService = new PosterService(storage);
      const content = await posterService.generatePosterContent(challenge);
      
      res.json({
        success: true,
        content,
        meta: {
          challengeId,
          generatedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('Error generating poster content:', error);
      res.status(500).json({ error: 'Failed to generate poster content' });
    }
  };
}

// Get available templates and themes
export function getPosterOptions(req: Request, res: Response) {
  try {
    const posterService = new PosterService({} as IStorage);
    const templates = posterService.getAvailableTemplates();
    const themes = posterService.getAvailableThemes();
    
    res.json({
      success: true,
      options: {
        templates: templates.map(template => ({
          id: template,
          name: template.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: getTemplateDescription(template),
        })),
        themes: themes.map(theme => ({
          id: theme,
          name: theme.charAt(0).toUpperCase() + theme.slice(1),
          description: getThemeDescription(theme),
          colors: getThemeColors(theme),
        })),
      }
    });
  } catch (error) {
    console.error('Error getting poster options:', error);
    res.status(500).json({ error: 'Failed to get poster options' });
  }
}

// Generate poster for upcoming challenges (batch)
export function generateUpcomingPosters(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { limit = 5, template = 'fight-night', theme = 'dark' } = req.query;
      
      // Get upcoming challenges (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const challenges = await storage.getChallengesByDateRange(now, nextWeek);
      const upcomingChallenges = challenges
        .filter(c => c.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, Number(limit));

      const posterService = new PosterService(storage);
      const posterPromises = upcomingChallenges.map(async (challenge) => {
        try {
          const posterData = await posterService.generatePosterData(challenge.id);
          posterData.design = { template: template as string, theme: theme as string };
          return { challengeId: challenge.id, posterData, error: null };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { challengeId: challenge.id, posterData: null, error: errorMessage };
        }
      });

      const results = await Promise.all(posterPromises);
      
      res.json({
        success: true,
        posters: results,
        meta: {
          total: results.length,
          successful: results.filter(r => !r.error).length,
          failed: results.filter(r => r.error).length,
          generatedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('Error generating upcoming posters:', error);
      res.status(500).json({ error: 'Failed to generate upcoming posters' });
    }
  };
}

// Regenerate AI content for existing poster
export function regeneratePoster(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const posterService = new PosterService(storage);
      // Force regenerate AI content
      const content = await posterService.generatePosterContent(challenge);
      const posterData = await posterService.generatePosterData(challengeId);
      
      res.json({
        success: true,
        content,
        posterData,
        meta: {
          challengeId,
          regeneratedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('Error regenerating poster:', error);
      res.status(500).json({ error: 'Failed to regenerate poster' });
    }
  };
}
