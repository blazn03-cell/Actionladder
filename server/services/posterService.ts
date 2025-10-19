import { AIService } from './ai-service';
import type { IStorage } from '../storage';

export interface ChallengeData {
  id: string;
  aPlayerId: string;
  bPlayerId: string;
  aPlayerName: string;
  bPlayerName: string;
  gameType: string;
  tableType: string;
  hallId: string;
  hallName: string;
  scheduledAt: Date | string;
  stakes: number;
  description: string | null;
  status: string;
}

export interface PosterContent {
  eventTitle: string;
  hypeText: string;
  tagline: string;
  challenge: string;
  description: string;
  callToAction: string;
}

export class PosterService {
  constructor(
    private storage: IStorage
  ) {}

  /**
   * Generate AI-powered poster content for a challenge
   */
  async generatePosterContent(challengeData: ChallengeData): Promise<PosterContent> {
    try {
      // Get player information
      const [playerA, playerB] = await Promise.all([
        this.storage.getPlayer(challengeData.aPlayerId),
        this.storage.getPlayer(challengeData.bPlayerId)
      ]);

      if (!playerA || !playerB) {
        throw new Error('Player data not found');
      }

      // Generate AI content using the AI service
      const aiPrompt = this.buildPosterPrompt(challengeData, playerA, playerB);
      const aiContent = await AIService.generateContent(aiPrompt);
      
      // Parse AI response and structure it
      const parsedContent = this.parseAIContent(aiContent);
      
      return {
        eventTitle: this.generateEventTitle(challengeData, playerA, playerB),
        hypeText: parsedContent.hypeText || this.getDefaultHypeText(playerA, playerB),
        tagline: parsedContent.tagline || '"In here, respect is earned in racks, not words"',
        challenge: `${playerA.name} vs ${playerB.name}`,
        description: this.formatChallengeDescription(challengeData, playerA, playerB),
        callToAction: parsedContent.callToAction || this.getDefaultCallToAction(challengeData),
      };
    } catch (error) {
      console.error('Error generating poster content:', error);
      return this.getFallbackContent(challengeData);
    }
  }

  /**
   * Build AI prompt for poster content generation
   */
  private buildPosterPrompt(challenge: ChallengeData, playerA: any, playerB: any): string {
    const scheduledDate = new Date(challenge.scheduledAt);
    
    return `Generate compelling poster content for an ActionLadder billiards league challenge:

CHALLENGE DETAILS:
- Players: ${playerA.name} (${playerA.rating} rating, ${playerA.city || 'Unknown'}) vs ${playerB.name} (${playerB.rating} rating, ${playerB.city || 'Unknown'})
- Game: ${challenge.gameType} on ${challenge.tableType}
- Location: ${challenge.hallName}
- Date: ${scheduledDate.toLocaleDateString()}
- Time: ${scheduledDate.toLocaleTimeString()}

LEAGUE IDENTITY:
- Slogan: "In here, respect is earned in racks, not words"
- Style: Dark, gritty, street-smart billiards culture
- Atmosphere: Professional league with underground edge

GENERATE (JSON format):
{
  "hypeText": "3-4 word powerful hype phrase (e.g., 'CLASH OF TITANS', 'SHOWDOWN SUPREME')",
  "tagline": "Short memorable phrase about this specific matchup",
  "callToAction": "Action phrase to drive attendance (e.g., 'Witness Greatness', 'Don't Miss History')"
}

Make it exciting, respectful to both players, and capture the intensity of professional billiards competition.`;
  }

  /**
   * Parse AI-generated content
   */
  private parseAIContent(aiResponse: string): Partial<PosterContent> {
    try {
      // Try to parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          hypeText: parsed.hypeText,
          tagline: parsed.tagline,
          callToAction: parsed.callToAction,
        };
      }
      
      // Fallback: extract content from plain text
      return {
        hypeText: this.extractLine(aiResponse, 'hype'),
        tagline: this.extractLine(aiResponse, 'tagline'),
        callToAction: this.extractLine(aiResponse, 'action'),
      };
    } catch (error) {
      console.error('Error parsing AI content:', error);
      return {};
    }
  }

  /**
   * Extract specific content lines from AI response
   */
  private extractLine(text: string, type: string): string {
    const lines = text.split('\n');
    const keywords = {
      hype: ['hype', 'clash', 'battle', 'showdown'],
      tagline: ['tagline', 'slogan', 'phrase'],
      action: ['action', 'call', 'witness', 'don\'t miss']
    };
    
    const relevantKeywords = keywords[type as keyof typeof keywords] || [];
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (relevantKeywords.some(keyword => lowerLine.includes(keyword))) {
        return line.replace(/^[^a-zA-Z]*/, '').trim();
      }
    }
    return '';
  }

  /**
   * Generate event title based on challenge data
   */
  private generateEventTitle(challenge: ChallengeData, playerA: any, playerB: any): string {
    const gameTypes = {
      '8-ball': '8-BALL SHOWDOWN',
      '9-ball': '9-BALL CHAMPIONSHIP',
      'straight-pool': 'STRAIGHT POOL CLASSIC',
      'one-pocket': 'ONE-POCKET BATTLE'
    };
    
    return gameTypes[challenge.gameType as keyof typeof gameTypes] || 'ACTIONLADDER CHALLENGE';
  }

  /**
   * Format comprehensive challenge description
   */
  private formatChallengeDescription(challenge: ChallengeData, playerA: any, playerB: any): string {
    const scheduledDate = new Date(challenge.scheduledAt);
    const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = scheduledDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    
    let description = `${challenge.gameType.toUpperCase()} • ${challenge.tableType}\n`;
    description += `${dateStr} at ${timeStr}\n`;
    description += `📍 ${challenge.hallName}\n\n`;
    
    // Player stats comparison
    description += `🎱 ${playerA.name}\n`;
    description += `   ${playerA.rating} Rating • ${playerA.city || 'Unknown'}\n`;
    description += `   ${playerA.rookieWins || 0}W - ${playerA.rookieLosses || 0}L\n\n`;
    
    description += `🎱 ${playerB.name}\n`;
    description += `   ${playerB.rating} Rating • ${playerB.city || 'Unknown'}\n`;
    description += `   ${playerB.rookieWins || 0}W - ${playerB.rookieLosses || 0}L\n\n`;
    
    if (challenge.description) {
      description += `💬 ${challenge.description}\n\n`;
    }
    
    description += `Join the ActionLadder League\n`;
    description += `"In here, respect is earned in racks, not words"`;
    
    return description;
  }

  /**
   * Get default hype text when AI fails
   */
  private getDefaultHypeText(playerA: any, playerB: any): string {
    const hypeOptions = [
      'SHOWDOWN SUPREME',
      'CLASH OF CHAMPIONS',
      'BATTLE ROYALE',
      'TITANS COLLIDE',
      'ULTIMATE FACE-OFF',
      'LEGENDARY DUEL'
    ];
    
    // Pick based on player ratings for consistency
    const index = (playerA.rating + playerB.rating) % hypeOptions.length;
    return hypeOptions[index];
  }

  /**
   * Get default call to action
   */
  private getDefaultCallToAction(challenge: ChallengeData): string {
    const scheduledDate = new Date(challenge.scheduledAt);
    const isEvening = scheduledDate.getHours() >= 18;
    return isEvening ? 'WITNESS GREATNESS' : 'DON\'T MISS HISTORY';
  }

  /**
   * Fallback content when everything fails
   */
  private getFallbackContent(challenge: ChallengeData): PosterContent {
    return {
      eventTitle: 'ACTIONLADDER CHALLENGE',
      hypeText: 'BATTLE AWAITS',
      tagline: '"In here, respect is earned in racks, not words"',
      challenge: `${challenge.aPlayerName} vs ${challenge.bPlayerName}`,
      description: `${challenge.gameType} match at ${challenge.hallName}`,
      callToAction: 'JOIN THE ACTION',
    };
  }

  /**
   * Generate poster data for frontend Canvas generator
   */
  async generatePosterData(challengeId: string): Promise<any> {
    try {
      const challenge = await this.storage.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const [playerA, playerB, content] = await Promise.all([
        this.storage.getPlayer(challenge.aPlayerId),
        this.storage.getPlayer(challenge.bPlayerId),
        this.generatePosterContent(challenge)
      ]);

      if (!playerA || !playerB) {
        throw new Error('Player data not found');
      }

      return {
        player1: {
          name: playerA.name,
          rating: playerA.rating,
          city: playerA.city || 'Unknown',
          record: `${playerA.rookieWins || 0}W - ${playerA.rookieLosses || 0}L`,
          nickname: '',
        },
        player2: {
          name: playerB.name,
          rating: playerB.rating,
          city: playerB.city || 'Unknown',
          record: `${playerB.rookieWins || 0}W - ${playerB.rookieLosses || 0}L`,
          nickname: '',
        },
        event: {
          title: content.eventTitle,
          date: new Date(challenge.scheduledAt).toLocaleDateString(),
          time: new Date(challenge.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: challenge.hallName,
          stakes: `${challenge.gameType} • ${challenge.tableType}`,
          gameType: challenge.gameType,
          tableType: challenge.tableType,
          description: content.description,
          hypeText: content.hypeText,
          callToAction: content.callToAction,
        },
        content: {
          tagline: content.tagline,
          challenge: content.challenge,
        },
        design: {
          template: 'fight-night',
          theme: 'dark',
        }
      };
    } catch (error) {
      console.error('Error generating poster data:', error);
      throw new Error('Failed to generate poster data');
    }
  }

  /**
   * Get poster templates available
   */
  getAvailableTemplates(): string[] {
    return ['fight-night', 'championship', 'classic', 'neon'];
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return ['dark', 'green', 'gold', 'neon'];
  }
}