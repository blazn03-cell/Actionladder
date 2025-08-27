import type { Player, Match, MistakeEntry, Video, Bounty, SocialContent, Settings, SpecialEvent, StreamStatus, PlayerQueue } from "../shared/schema.js";

export interface IStorage {
  // Players
  createPlayer(player: Omit<Player, 'id' | 'createdAt'>): Promise<Player>;
  getPlayers(): Promise<Player[]>;
  getPlayerById(id: string): Promise<Player | null>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null>;
  deletePlayer(id: string): Promise<boolean>;

  // Matches
  createMatch(match: Omit<Match, 'id' | 'createdAt'>): Promise<Match>;
  getMatches(): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  updateMatch(id: string, updates: Partial<Match>): Promise<Match | null>;
  deleteMatch(id: string): Promise<boolean>;

  // Videos
  createVideo(video: Omit<Video, 'id' | 'createdAt'>): Promise<Video>;
  getVideosByPlayer(playerId: string): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | null>;
  deleteVideo(id: string): Promise<boolean>;

  // Mistake Entries
  createMistakeEntry(entry: Omit<MistakeEntry, 'id' | 'createdAt'>): Promise<MistakeEntry>;
  getMistakeEntriesByPlayer(playerId: string): Promise<MistakeEntry[]>;
  getMistakeEntriesByVideo(videoId: string): Promise<MistakeEntry[]>;
  updateMistakeEntry(id: string, updates: Partial<MistakeEntry>): Promise<MistakeEntry | null>;
  deleteMistakeEntry(id: string): Promise<boolean>;

  // Bounties
  createBounty(bounty: Omit<Bounty, 'id' | 'createdAt'>): Promise<Bounty>;
  getBounties(): Promise<Bounty[]>;
  updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | null>;
  deleteBounty(id: string): Promise<boolean>;

  // Social Content
  createSocialContent(content: Omit<SocialContent, 'id' | 'createdAt'>): Promise<SocialContent>;
  getSocialContent(): Promise<SocialContent[]>;
  getSocialContentByWeek(week: string): Promise<SocialContent[]>;
  updateSocialContent(id: string, updates: Partial<SocialContent>): Promise<SocialContent | null>;
  deleteSocialContent(id: string): Promise<boolean>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(updates: Partial<Settings>): Promise<Settings>;

  // Special Events
  createSpecialEvent(event: Omit<SpecialEvent, 'id' | 'createdAt'>): Promise<SpecialEvent>;
  getSpecialEvents(): Promise<SpecialEvent[]>;
  getActiveSpecialEvents(): Promise<SpecialEvent[]>;
  updateSpecialEvent(id: string, updates: Partial<SpecialEvent>): Promise<SpecialEvent | null>;

  // Stream Status
  getStreamStatus(): Promise<StreamStatus>;
  updateStreamStatus(updates: Partial<StreamStatus>): Promise<StreamStatus>;

  // Player Queue
  addToQueue(player: Omit<PlayerQueue, 'id' | 'joinedAt'>): Promise<PlayerQueue>;
  getPlayerQueue(): Promise<PlayerQueue[]>;
  approveQueuedPlayer(id: string): Promise<PlayerQueue | null>;
  removeFromQueue(id: string): Promise<boolean>;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class MemStorage implements IStorage {
  private players: Player[] = [];
  private matches: Match[] = [];
  private videos: Video[] = [];
  private mistakeEntries: MistakeEntry[] = [];
  private bounties: Bounty[] = [];
  private socialContent: SocialContent[] = [];
  private specialEvents: SpecialEvent[] = [];
  private playerQueue: PlayerQueue[] = [];
  private streamStatus: StreamStatus = {
    isLive: false,
    viewers: 0,
    lastUpdated: Date.now(),
  };
  private settings: Settings = {
    commissionMember: 0.05,
    commissionNonMember: 0.15,
    streakBonus: 25,
    jackpotCut: 0.02,
    minBet: 60,
    maxBet: 500000,
    breakAndRunPot: 200,
    hillHillFee: 10,
    noShowFine: 30,
    lateFine: 10,
    badSportsmanshipFine: 20,
    matchFeeNonMember: 12,
    membershipBasic: 25,
    membershipPro: 40,
    birthdayBonus: 25,
    charityPercentage: 0.1,
    supportMaxAmount: 100,
    googleSheetsUrl: "",
    supabaseEnabled: false,
    stripeTestMode: true,
  };

  constructor() {
    // Seed data
    this.seedData();
  }

  private seedData() {
    const now = Date.now();
    
    // Seed players
    this.players = [
      {
        id: uid(),
        name: "Ace Rodriguez",
        rating: 650,
        city: "Seguin",
        member: true,
        theme: "Eye of the Tiger",
        points: 1250,
        streak: 4,
        achievements: ["break_run_master", "king_hill"],
        respectPoints: 5,
        birthday: "03-15",
        specialStatus: "none",
        freePassesRemaining: 0,
        createdAt: now - 86400000 * 30,
        lastActive: now - 86400000,
      },
      {
        id: uid(),
        name: "Sarah 'Banks' Wilson",
        rating: 625,
        city: "New Braunfels", 
        member: true,
        theme: "Thunderstruck",
        points: 1180,
        streak: 2,
        achievements: ["streak_killer"],
        respectPoints: 3,
        birthday: "07-22",
        specialStatus: "none",
        freePassesRemaining: 0,
        createdAt: now - 86400000 * 25,
        lastActive: now - 86400000 * 2,
      },
      {
        id: uid(),
        name: "Ghost Martinez",
        rating: 590,
        city: "San Marcos",
        member: false,
        theme: "X Gon' Give It to Ya",
        points: 980,
        streak: 0,
        achievements: [],
        respectPoints: 1,
        birthday: "12-08",
        specialStatus: "none",
        freePassesRemaining: 0,
        createdAt: now - 86400000 * 20,
        lastActive: now - 86400000 * 3,
      },
      {
        id: uid(),
        name: "Lucky Thompson",
        rating: 520,
        city: "San Antonio",
        member: false,
        theme: "Congratulations",
        points: 750,
        streak: 1,
        achievements: ["rookie_crusher"],
        respectPoints: 2,
        birthday: "01-30",
        specialStatus: "birthday",
        freePassesRemaining: 1,
        createdAt: now - 86400000 * 15,
        lastActive: now - 86400000 * 5,
      }
    ];

    // Set break and run pot based on recent activity
    this.settings.breakAndRunPot = 350;
  }

  // Players
  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
    const player: Player = {
      ...playerData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.players.push(player);
    return player;
  }

  async getPlayers(): Promise<Player[]> {
    return [...this.players];
  }

  async getPlayerById(id: string): Promise<Player | null> {
    return this.players.find(p => p.id === id) || null;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null> {
    const index = this.players.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.players[index] = { ...this.players[index], ...updates };
    return this.players[index];
  }

  async deletePlayer(id: string): Promise<boolean> {
    const index = this.players.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.players.splice(index, 1);
    return true;
  }

  // Matches
  async createMatch(matchData: Omit<Match, 'id' | 'createdAt'>): Promise<Match> {
    const match: Match = {
      ...matchData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.matches.push(match);
    return match;
  }

  async getMatches(): Promise<Match[]> {
    return [...this.matches];
  }

  async getMatchById(id: string): Promise<Match | null> {
    return this.matches.find(m => m.id === id) || null;
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | null> {
    const index = this.matches.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    this.matches[index] = { ...this.matches[index], ...updates };
    return this.matches[index];
  }

  async deleteMatch(id: string): Promise<boolean> {
    const index = this.matches.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.matches.splice(index, 1);
    return true;
  }

  // Videos
  async createVideo(videoData: Omit<Video, 'id' | 'createdAt'>): Promise<Video> {
    const video: Video = {
      ...videoData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.videos.push(video);
    return video;
  }

  async getVideosByPlayer(playerId: string): Promise<Video[]> {
    return this.videos.filter(v => v.playerId === playerId);
  }

  async getVideoById(id: string): Promise<Video | null> {
    return this.videos.find(v => v.id === id) || null;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const index = this.videos.findIndex(v => v.id === id);
    if (index === -1) return false;
    
    this.videos.splice(index, 1);
    return true;
  }

  // Mistake Entries
  async createMistakeEntry(entryData: Omit<MistakeEntry, 'id' | 'createdAt'>): Promise<MistakeEntry> {
    const entry: MistakeEntry = {
      ...entryData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.mistakeEntries.push(entry);
    return entry;
  }

  async getMistakeEntriesByPlayer(playerId: string): Promise<MistakeEntry[]> {
    return this.mistakeEntries.filter(e => e.playerId === playerId);
  }

  async getMistakeEntriesByVideo(videoId: string): Promise<MistakeEntry[]> {
    return this.mistakeEntries.filter(e => e.videoId === videoId);
  }

  async updateMistakeEntry(id: string, updates: Partial<MistakeEntry>): Promise<MistakeEntry | null> {
    const index = this.mistakeEntries.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.mistakeEntries[index] = { ...this.mistakeEntries[index], ...updates };
    return this.mistakeEntries[index];
  }

  async deleteMistakeEntry(id: string): Promise<boolean> {
    const index = this.mistakeEntries.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    this.mistakeEntries.splice(index, 1);
    return true;
  }

  // Bounties
  async createBounty(bountyData: Omit<Bounty, 'id' | 'createdAt'>): Promise<Bounty> {
    const bounty: Bounty = {
      ...bountyData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.bounties.push(bounty);
    return bounty;
  }

  async getBounties(): Promise<Bounty[]> {
    return [...this.bounties];
  }

  async updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | null> {
    const index = this.bounties.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    this.bounties[index] = { ...this.bounties[index], ...updates };
    return this.bounties[index];
  }

  async deleteBounty(id: string): Promise<boolean> {
    const index = this.bounties.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    this.bounties.splice(index, 1);
    return true;
  }

  // Social Content
  async createSocialContent(contentData: Omit<SocialContent, 'id' | 'createdAt'>): Promise<SocialContent> {
    const content: SocialContent = {
      ...contentData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.socialContent.push(content);
    return content;
  }

  async getSocialContent(): Promise<SocialContent[]> {
    return [...this.socialContent];
  }

  async getSocialContentByWeek(week: string): Promise<SocialContent[]> {
    return this.socialContent.filter(c => c.week === week);
  }

  async updateSocialContent(id: string, updates: Partial<SocialContent>): Promise<SocialContent | null> {
    const index = this.socialContent.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    this.socialContent[index] = { ...this.socialContent[index], ...updates };
    return this.socialContent[index];
  }

  async deleteSocialContent(id: string): Promise<boolean> {
    const index = this.socialContent.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.socialContent.splice(index, 1);
    return true;
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }

  // Special Events
  async createSpecialEvent(eventData: Omit<SpecialEvent, 'id' | 'createdAt'>): Promise<SpecialEvent> {
    const event: SpecialEvent = {
      ...eventData,
      id: uid(),
      createdAt: Date.now(),
    };
    this.specialEvents.push(event);
    return event;
  }

  async getSpecialEvents(): Promise<SpecialEvent[]> {
    return [...this.specialEvents];
  }

  async getActiveSpecialEvents(): Promise<SpecialEvent[]> {
    return this.specialEvents.filter(e => e.active);
  }

  async updateSpecialEvent(id: string, updates: Partial<SpecialEvent>): Promise<SpecialEvent | null> {
    const index = this.specialEvents.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.specialEvents[index] = { ...this.specialEvents[index], ...updates };
    return this.specialEvents[index];
  }

  // Stream Status
  async getStreamStatus(): Promise<StreamStatus> {
    return { ...this.streamStatus };
  }

  async updateStreamStatus(updates: Partial<StreamStatus>): Promise<StreamStatus> {
    this.streamStatus = { ...this.streamStatus, ...updates, lastUpdated: Date.now() };
    return { ...this.streamStatus };
  }

  // Player Queue
  async addToQueue(playerData: Omit<PlayerQueue, 'id' | 'joinedAt'>): Promise<PlayerQueue> {
    const player: PlayerQueue = {
      ...playerData,
      id: uid(),
      joinedAt: Date.now(),
    };
    this.playerQueue.push(player);
    return player;
  }

  async getPlayerQueue(): Promise<PlayerQueue[]> {
    return [...this.playerQueue];
  }

  async approveQueuedPlayer(id: string): Promise<PlayerQueue | null> {
    const index = this.playerQueue.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.playerQueue[index] = { 
      ...this.playerQueue[index], 
      status: "approved",
      approvedAt: Date.now()
    };
    return this.playerQueue[index];
  }

  async removeFromQueue(id: string): Promise<boolean> {
    const index = this.playerQueue.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.playerQueue.splice(index, 1);
    return true;
  }
}