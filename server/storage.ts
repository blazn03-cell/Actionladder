import { 
  type Player, type InsertPlayer,
  type Match, type InsertMatch,
  type Tournament, type InsertTournament,
  type KellyPool, type InsertKellyPool,
  type Bounty, type InsertBounty,
  type CharityEvent, type InsertCharityEvent,
  type SupportRequest, type InsertSupportRequest,
  type LiveStream, type InsertLiveStream,
  type WebhookEvent, type InsertWebhookEvent,
  type PoolHall, type InsertPoolHall,
  type HallMatch, type InsertHallMatch,
  type HallRoster, type InsertHallRoster,
  type OperatorSettings, type InsertOperatorSettings,
  type GlobalRole,
  insertUserSchema,
  insertOrganizationSchema,
  insertPayoutTransferSchema
} from "@shared/schema";

// New types for user management and payouts
export interface User {
  id: string;
  email: string;
  name?: string;
  globalRole: GlobalRole;
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;
  onboardingComplete: boolean;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  seatLimit: number;
  createdAt: Date;
}

export interface PayoutTransfer {
  id: string;
  invoiceId: string;
  stripeTransferId: string;
  recipientUserId: string;
  amount: number;
  shareType: string;
  createdAt: Date;
}

export type InsertUser = {
  email: string;
  name?: string;
  globalRole: GlobalRole;
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;
  onboardingComplete?: boolean;
};

export type InsertOrganization = {
  name: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  seatLimit?: number;
};

export type InsertPayoutTransfer = {
  invoiceId: string;
  stripeTransferId: string;
  recipientUserId: string;
  amount: number;
  shareType: string;
};

import { randomUUID } from "crypto";

export interface IStorage {
  // Users (for platform management)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeConnectId(stripeConnectId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getStaffUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  
  // Payout Transfers
  getPayoutTransfer(id: string): Promise<PayoutTransfer | undefined>;
  getPayoutTransfersByInvoice(invoiceId: string): Promise<PayoutTransfer[]>;
  getAllPayoutTransfers(): Promise<PayoutTransfer[]>;
  createPayoutTransfer(transfer: InsertPayoutTransfer): Promise<PayoutTransfer>;
  
  // Operator Settings
  getOperatorSettings(operatorUserId: string): Promise<OperatorSettings | undefined>;
  getAllOperatorSettings(): Promise<OperatorSettings[]>;
  createOperatorSettings(settings: InsertOperatorSettings): Promise<OperatorSettings>;
  updateOperatorSettings(operatorUserId: string, updates: Partial<OperatorSettings>): Promise<OperatorSettings | undefined>;
  
  // Players
  getPlayer(id: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<boolean>;
  
  // Matches
  getMatch(id: string): Promise<Match | undefined>;
  getAllMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined>;
  
  // Tournaments
  getTournament(id: string): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | undefined>;
  
  // Kelly Pools
  getKellyPool(id: string): Promise<KellyPool | undefined>;
  getAllKellyPools(): Promise<KellyPool[]>;
  createKellyPool(kellyPool: InsertKellyPool): Promise<KellyPool>;
  updateKellyPool(id: string, updates: Partial<KellyPool>): Promise<KellyPool | undefined>;
  
  // Bounties
  getBounty(id: string): Promise<Bounty | undefined>;
  getAllBounties(): Promise<Bounty[]>;
  createBounty(bounty: InsertBounty): Promise<Bounty>;
  updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | undefined>;
  
  // Charity Events
  getCharityEvent(id: string): Promise<CharityEvent | undefined>;
  getAllCharityEvents(): Promise<CharityEvent[]>;
  createCharityEvent(event: InsertCharityEvent): Promise<CharityEvent>;
  updateCharityEvent(id: string, updates: Partial<CharityEvent>): Promise<CharityEvent | undefined>;
  
  // Support Requests
  getSupportRequest(id: string): Promise<SupportRequest | undefined>;
  getAllSupportRequests(): Promise<SupportRequest[]>;
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined>;
  
  // Live Streams
  getLiveStream(id: string): Promise<LiveStream | undefined>;
  getAllLiveStreams(): Promise<LiveStream[]>;
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  updateLiveStream(id: string, updates: Partial<LiveStream>): Promise<LiveStream | undefined>;

  // Pool Halls
  getPoolHall(id: string): Promise<PoolHall | undefined>;
  getAllPoolHalls(): Promise<PoolHall[]>;
  createPoolHall(poolHall: InsertPoolHall): Promise<PoolHall>;
  updatePoolHall(id: string, updates: Partial<PoolHall>): Promise<PoolHall | undefined>;
  unlockHallBattles(hallId: string, unlockedBy: string): Promise<PoolHall | undefined>;
  lockHallBattles(hallId: string): Promise<PoolHall | undefined>;

  // Hall Matches
  getHallMatch(id: string): Promise<HallMatch | undefined>;
  getAllHallMatches(): Promise<HallMatch[]>;
  getHallMatchesByHall(hallId: string): Promise<HallMatch[]>;
  createHallMatch(hallMatch: InsertHallMatch): Promise<HallMatch>;
  updateHallMatch(id: string, updates: Partial<HallMatch>): Promise<HallMatch | undefined>;

  // Hall Rosters
  getHallRoster(id: string): Promise<HallRoster | undefined>;
  getAllHallRosters(): Promise<HallRoster[]>;
  getRosterByHall(hallId: string): Promise<HallRoster[]>;
  getRosterByPlayer(playerId: string): Promise<HallRoster[]>;
  createHallRoster(roster: InsertHallRoster): Promise<HallRoster>;
  updateHallRoster(id: string, updates: Partial<HallRoster>): Promise<HallRoster | undefined>;
  
  // Webhook Events
  getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | undefined>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private organizations = new Map<string, Organization>();
  private payoutTransfers = new Map<string, PayoutTransfer>();
  private players = new Map<string, Player>();
  private matches = new Map<string, Match>();
  private tournaments = new Map<string, Tournament>();
  private kellyPools = new Map<string, KellyPool>();
  private bounties = new Map<string, Bounty>();
  private charityEvents = new Map<string, CharityEvent>();
  private supportRequests = new Map<string, SupportRequest>();
  private liveStreams = new Map<string, LiveStream>();
  private poolHalls = new Map<string, PoolHall>();
  private hallMatches = new Map<string, HallMatch>();
  private hallRosters = new Map<string, HallRoster>();
  private webhookEvents = new Map<string, WebhookEvent>();
  private operatorSettings = new Map<string, OperatorSettings>(); // keyed by operatorUserId

  constructor() {
    // Initialize with seed data for demonstration (disabled in production)
    if (process.env.NODE_ENV === "development") {
      this.initializeSeedData();
    }
  }

  // User Management Methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByStripeConnectId(stripeConnectId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.stripeConnectId === stripeConnectId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getStaffUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.globalRole === "STAFF" || user.globalRole === "OWNER"
    );
  }

  async createUser(data: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      email: data.email,
      name: data.name,
      globalRole: data.globalRole,
      stripeCustomerId: data.stripeCustomerId,
      stripeConnectId: data.stripeConnectId,
      payoutShareBps: data.payoutShareBps,
      onboardingComplete: data.onboardingComplete || false,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Organization Methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(data: InsertOrganization): Promise<Organization> {
    const org: Organization = {
      id: randomUUID(),
      name: data.name,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      seatLimit: data.seatLimit || 5,
      createdAt: new Date(),
    };
    this.organizations.set(org.id, org);
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    
    const updatedOrg = { ...org, ...updates };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  // Payout Transfer Methods
  async getPayoutTransfer(id: string): Promise<PayoutTransfer | undefined> {
    return this.payoutTransfers.get(id);
  }

  async getPayoutTransfersByInvoice(invoiceId: string): Promise<PayoutTransfer[]> {
    return Array.from(this.payoutTransfers.values()).filter(transfer => 
      transfer.invoiceId === invoiceId
    );
  }

  async getAllPayoutTransfers(): Promise<PayoutTransfer[]> {
    return Array.from(this.payoutTransfers.values());
  }

  async createPayoutTransfer(data: InsertPayoutTransfer): Promise<PayoutTransfer> {
    const transfer: PayoutTransfer = {
      id: randomUUID(),
      invoiceId: data.invoiceId,
      stripeTransferId: data.stripeTransferId,
      recipientUserId: data.recipientUserId,
      amount: data.amount,
      shareType: data.shareType,
      createdAt: new Date(),
    };
    this.payoutTransfers.set(transfer.id, transfer);
    return transfer;
  }

  // Operator Settings Methods
  async getOperatorSettings(operatorUserId: string): Promise<OperatorSettings | undefined> {
    return this.operatorSettings.get(operatorUserId);
  }

  async getAllOperatorSettings(): Promise<OperatorSettings[]> {
    return Array.from(this.operatorSettings.values());
  }

  async createOperatorSettings(data: InsertOperatorSettings): Promise<OperatorSettings> {
    const settings: OperatorSettings = {
      id: randomUUID(),
      operatorUserId: data.operatorUserId,
      cityName: data.cityName || "Your City",
      areaName: data.areaName || "Your Area", 
      customBranding: data.customBranding || null,
      hasFreeMonths: data.hasFreeMonths || false,
      freeMonthsCount: data.freeMonthsCount || 0,
      freeMonthsGrantedBy: data.freeMonthsGrantedBy || null,
      freeMonthsGrantedAt: data.freeMonthsGrantedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.operatorSettings.set(settings.operatorUserId, settings);
    return settings;
  }

  async updateOperatorSettings(operatorUserId: string, updates: Partial<OperatorSettings>): Promise<OperatorSettings | undefined> {
    const existing = this.operatorSettings.get(operatorUserId);
    if (!existing) return undefined;

    const updated: OperatorSettings = {
      ...existing,
      ...updates,
      operatorUserId, // Keep the key consistent
      updatedAt: new Date(),
    };
    this.operatorSettings.set(operatorUserId, updated);
    return updated;
  }

  private initializeSeedData() {
    // Initialize owner user for platform management
    const ownerId = randomUUID();
    const ownerUser: User = {
      id: ownerId,
      email: "owner@actionladder.com",
      name: "Platform Owner",
      globalRole: "OWNER",
      payoutShareBps: 4000, // 40% share
      onboardingComplete: true,
      createdAt: new Date(),
    };
    this.users.set(ownerId, ownerUser);

    // Initialize test organizations for demonstration
    const testOrg1: Organization = {
      id: randomUUID(),
      name: "Seguin Winners Pool Hall",
      stripeCustomerId: "cus_test_seguin123",
      stripeSubscriptionId: "sub_test_seguin123",
      seatLimit: 25,
      createdAt: new Date(),
    };
    this.organizations.set(testOrg1.id, testOrg1);

    const testOrg2: Organization = {
      id: randomUUID(),
      name: "San Marcos Sharks",
      seatLimit: 5,
      createdAt: new Date(),
    };
    this.organizations.set(testOrg2.id, testOrg2);

    // Initialize Tri-City pool halls
    const seguin: PoolHall = {
      id: "hall-seguin",
      name: "Seguin Winners Pool Hall",
      city: "Seguin",
      wins: 12,
      losses: 8,
      points: 1200,
      description: "Home of the champions, where legends are made on felt",
      address: "123 Main St, Seguin, TX",
      phone: "(830) 555-0123",
      active: true,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      createdAt: new Date(),
    };
    this.poolHalls.set(seguin.id, seguin);

    const newBraunfels: PoolHall = {
      id: "hall-new-braunfels",
      name: "New Braunfels Sharks",
      city: "New Braunfels",
      wins: 10,
      losses: 7,
      points: 1050,
      description: "Sharp shooters with precision game play",
      address: "456 River Rd, New Braunfels, TX",
      phone: "(830) 555-0456",
      active: true,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      createdAt: new Date(),
    };
    this.poolHalls.set(newBraunfels.id, newBraunfels);

    const sanMarcos: PoolHall = {
      id: "hall-san-marcos",
      name: "San Marcos Hustlers",
      city: "San Marcos",
      wins: 8,
      losses: 12,
      points: 850,
      description: "Underdogs with heart and hustle",
      address: "789 University Dr, San Marcos, TX",
      phone: "(512) 555-0789",
      active: true,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      createdAt: new Date(),
    };
    this.poolHalls.set(sanMarcos.id, sanMarcos);

    // Initialize some hall matches for demonstration
    const hallMatch1: HallMatch = {
      id: "match-1",
      homeHallId: seguin.id,
      awayHallId: newBraunfels.id,
      format: "team_9ball",
      totalRacks: 9,
      homeScore: 5,
      awayScore: 4,
      status: "completed",
      winnerHallId: seguin.id,
      scheduledDate: new Date("2024-01-15"),
      completedAt: new Date("2024-01-15T21:30:00"),
      notes: "Intense match, came down to the final rack",
      stake: 50000, // $500 per team
      createdAt: new Date("2024-01-10"),
    };
    this.hallMatches.set(hallMatch1.id, hallMatch1);

    const hallMatch2: HallMatch = {
      id: "match-2",
      homeHallId: sanMarcos.id,
      awayHallId: seguin.id,
      format: "team_8ball",
      totalRacks: 7,
      homeScore: 2,
      awayScore: 5,
      status: "completed",
      winnerHallId: seguin.id,
      scheduledDate: new Date("2024-01-20"),
      completedAt: new Date("2024-01-20T20:45:00"),
      notes: "Seguin dominated with solid fundamentals",
      stake: 30000, // $300 per team
      createdAt: new Date("2024-01-18"),
    };
    this.hallMatches.set(hallMatch2.id, hallMatch2);

    // Seed players
    const seedPlayers: Player[] = [
      {
        id: randomUUID(),
        name: "Tommy 'The Knife' Rodriguez",
        rating: 720,
        city: "Seguin",
        member: true,
        theme: "Blood and chalk dust",
        points: 2850,
        streak: 7,
        respectPoints: 45,
        birthday: "03-15",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        graduatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Jesse — The Spot",
        rating: 605,
        city: "Seguin",
        member: false,
        theme: "Back in Black",
        points: 350,
        streak: 1,
        respectPoints: 10,
        birthday: "01-15",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        graduatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "San Marcos Sniper",
        rating: 590,
        city: "San Marcos",
        member: true,
        theme: "X Gon' Give It to Ya",
        points: 160,
        streak: 2,
        respectPoints: 5,
        birthday: "12-20",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        graduatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Seguin Shark",
        rating: 540,
        city: "Seguin",
        member: false,
        theme: "Congratulations",
        points: 280,
        streak: 0,
        respectPoints: 8,
        birthday: "06-10",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        graduatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Chalktopus",
        rating: 520,
        city: "New Braunfels",
        member: true,
        theme: "Monster",
        points: 220,
        streak: 0,
        respectPoints: 25,
        birthday: "09-05",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        graduatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "New Braunfels Ninja",
        rating: 480,
        city: "New Braunfels",
        member: false,
        theme: "Ninja",
        points: 180,
        streak: 1,
        respectPoints: 3,
        birthday: "01-28",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 3,
        graduatedAt: null,
        createdAt: new Date(),
      },
      // Add some rookie players for demonstration
      {
        id: randomUUID(),
        name: "Rookie Mike",
        rating: 420,
        city: "San Marcos",
        member: false,
        theme: "Learning the ropes",
        points: 100,
        streak: 2,
        respectPoints: 5,
        birthday: "05-12",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 5,
        graduatedAt: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Sarah 'Rising Star'",
        rating: 460,
        city: "Seguin",
        member: true,
        theme: "Grinding to the top",
        points: 140,
        streak: 1,
        respectPoints: 12,
        birthday: "08-03",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 8,
        graduatedAt: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Pocket Rookie",
        rating: 380,
        city: "New Braunfels",
        member: false,
        theme: "Future champion",
        points: 80,
        streak: 0,
        respectPoints: 3,
        birthday: "11-22",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 2,
        graduatedAt: null,
        createdAt: new Date(),
      },
    ];

    seedPlayers.forEach(player => {
      this.players.set(player.id, player);
    });

    // Seed tournaments
    const tournament1: Tournament = {
      id: randomUUID(),
      name: "Friday Night Fights",
      entry: 50,
      prizePool: 400,
      format: "Double Elimination",
      game: "8-Ball",
      maxPlayers: 16,
      currentPlayers: 8,
      status: "open",
      stripeProductId: null,
      createdAt: new Date(),
    };

    const tournament2: Tournament = {
      id: randomUUID(),
      name: "Weekly 9-Ball Open",
      entry: 25,
      prizePool: 175,
      format: "Single Elimination",
      game: "9-Ball",
      maxPlayers: 12,
      currentPlayers: 7,
      status: "open",
      stripeProductId: null,
      createdAt: new Date(),
    };

    this.tournaments.set(tournament1.id, tournament1);
    this.tournaments.set(tournament2.id, tournament2);

    // Seed Kelly Pool
    const kellyPool: KellyPool = {
      id: randomUUID(),
      name: "Table 3 Kelly Pool",
      entry: 20,
      pot: 80,
      maxPlayers: 8,
      currentPlayers: 4,
      balls: ["1", "2", "3", "open"],
      status: "open",
      table: "Table 3",
      createdAt: new Date(),
    };

    this.kellyPools.set(kellyPool.id, kellyPool);

    // Seed charity event
    const charityEvent: CharityEvent = {
      id: randomUUID(),
      name: "Local Youth Center Support",
      description: "Tournament proceeds benefit Seguin Youth Programs",
      goal: 500,
      raised: 285,
      percentage: 0.1,
      active: true,
      createdAt: new Date(),
    };

    this.charityEvents.set(charityEvent.id, charityEvent);

    // Seed bounties
    const bounty1: Bounty = {
      id: randomUUID(),
      type: "onPlayer",
      rank: null,
      targetId: seedPlayers[0].id, // Tyga Hoodz
      prize: 50,
      active: true,
      description: "Beat the King of 600+ Division",
      createdAt: new Date(),
    };

    const bounty2: Bounty = {
      id: randomUUID(),
      type: "onPlayer",
      rank: null,
      targetId: seedPlayers[2].id, // San Marcos Sniper
      prize: 30,
      active: true,
      description: "Beat the King of 599 & Under Division",
      createdAt: new Date(),
    };

    this.bounties.set(bounty1.id, bounty1);
    this.bounties.set(bounty2.id, bounty2);
  }

  // Player methods
  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = {
      rating: 500,
      city: null,
      member: null,
      theme: null,
      points: 800,
      streak: null,
      respectPoints: null,
      birthday: null,
      stripeCustomerId: null,
      userId: null,
      isRookie: true,
      rookieWins: 0,
      graduatedAt: null,
      ...insertPlayer,
      id,
      createdAt: new Date(),
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }

  // Match methods
  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const match: Match = {
      notes: null,
      status: "scheduled",
      winner: null,
      commission: null,
      bountyAward: null,
      ...insertMatch,
      id,
      createdAt: new Date(),
      reportedAt: null,
    };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...updates };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  // Tournament methods
  async getTournament(id: string): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = randomUUID();
    const tournament: Tournament = {
      status: null,
      currentPlayers: null,
      stripeProductId: null,
      ...insertTournament,
      id,
      createdAt: new Date(),
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    
    const updatedTournament = { ...tournament, ...updates };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  // Kelly Pool methods
  async getKellyPool(id: string): Promise<KellyPool | undefined> {
    return this.kellyPools.get(id);
  }

  async getAllKellyPools(): Promise<KellyPool[]> {
    return Array.from(this.kellyPools.values());
  }

  async createKellyPool(insertKellyPool: InsertKellyPool): Promise<KellyPool> {
    const id = randomUUID();
    const kellyPool: KellyPool = {
      status: null,
      table: null,
      currentPlayers: null,
      balls: null,
      ...insertKellyPool,
      id,
      createdAt: new Date(),
    };
    this.kellyPools.set(id, kellyPool);
    return kellyPool;
  }

  async updateKellyPool(id: string, updates: Partial<KellyPool>): Promise<KellyPool | undefined> {
    const kellyPool = this.kellyPools.get(id);
    if (!kellyPool) return undefined;
    
    const updatedKellyPool = { ...kellyPool, ...updates };
    this.kellyPools.set(id, updatedKellyPool);
    return updatedKellyPool;
  }

  // Bounty methods
  async getBounty(id: string): Promise<Bounty | undefined> {
    return this.bounties.get(id);
  }

  async getAllBounties(): Promise<Bounty[]> {
    return Array.from(this.bounties.values());
  }

  async createBounty(insertBounty: InsertBounty): Promise<Bounty> {
    const id = randomUUID();
    const bounty: Bounty = {
      rank: null,
      targetId: null,
      active: null,
      description: null,
      ...insertBounty,
      id,
      createdAt: new Date(),
    };
    this.bounties.set(id, bounty);
    return bounty;
  }

  async updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | undefined> {
    const bounty = this.bounties.get(id);
    if (!bounty) return undefined;
    
    const updatedBounty = { ...bounty, ...updates };
    this.bounties.set(id, updatedBounty);
    return updatedBounty;
  }

  // Charity Event methods
  async getCharityEvent(id: string): Promise<CharityEvent | undefined> {
    return this.charityEvents.get(id);
  }

  async getAllCharityEvents(): Promise<CharityEvent[]> {
    return Array.from(this.charityEvents.values());
  }

  async createCharityEvent(insertCharityEvent: InsertCharityEvent): Promise<CharityEvent> {
    const id = randomUUID();
    const charityEvent: CharityEvent = {
      active: null,
      description: null,
      raised: null,
      percentage: null,
      ...insertCharityEvent,
      id,
      createdAt: new Date(),
    };
    this.charityEvents.set(id, charityEvent);
    return charityEvent;
  }

  async updateCharityEvent(id: string, updates: Partial<CharityEvent>): Promise<CharityEvent | undefined> {
    const charityEvent = this.charityEvents.get(id);
    if (!charityEvent) return undefined;
    
    const updatedCharityEvent = { ...charityEvent, ...updates };
    this.charityEvents.set(id, updatedCharityEvent);
    return updatedCharityEvent;
  }

  // Support Request methods
  async getSupportRequest(id: string): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }

  async getAllSupportRequests(): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values());
  }

  async createSupportRequest(insertSupportRequest: InsertSupportRequest): Promise<SupportRequest> {
    const id = randomUUID();
    const supportRequest: SupportRequest = {
      status: null,
      description: null,
      amount: null,
      ...insertSupportRequest,
      id,
      createdAt: new Date(),
    };
    this.supportRequests.set(id, supportRequest);
    return supportRequest;
  }

  async updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined> {
    const supportRequest = this.supportRequests.get(id);
    if (!supportRequest) return undefined;
    
    const updatedSupportRequest = { ...supportRequest, ...updates };
    this.supportRequests.set(id, updatedSupportRequest);
    return updatedSupportRequest;
  }

  // Live Stream methods
  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    return this.liveStreams.get(id);
  }

  async getAllLiveStreams(): Promise<LiveStream[]> {
    return Array.from(this.liveStreams.values());
  }

  async createLiveStream(insertLiveStream: InsertLiveStream): Promise<LiveStream> {
    const id = randomUUID();
    const liveStream: LiveStream = {
      title: null,
      isLive: null,
      viewerCount: null,
      matchId: null,
      ...insertLiveStream,
      id,
      createdAt: new Date(),
    };
    this.liveStreams.set(id, liveStream);
    return liveStream;
  }

  async updateLiveStream(id: string, updates: Partial<LiveStream>): Promise<LiveStream | undefined> {
    const liveStream = this.liveStreams.get(id);
    if (!liveStream) return undefined;
    
    const updatedLiveStream = { ...liveStream, ...updates };
    this.liveStreams.set(id, updatedLiveStream);
    return updatedLiveStream;
  }

  // Webhook Event methods
  async getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | undefined> {
    return Array.from(this.webhookEvents.values()).find(event => event.stripeEventId === stripeEventId);
  }

  async createWebhookEvent(insertWebhookEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const id = randomUUID();
    const webhookEvent: WebhookEvent = {
      ...insertWebhookEvent,
      id,
      processedAt: new Date(),
    };
    this.webhookEvents.set(id, webhookEvent);
    return webhookEvent;
  }

  // Pool Hall methods
  async getPoolHall(id: string): Promise<PoolHall | undefined> {
    return this.poolHalls.get(id);
  }

  async getAllPoolHalls(): Promise<PoolHall[]> {
    return Array.from(this.poolHalls.values());
  }

  async createPoolHall(insertPoolHall: InsertPoolHall): Promise<PoolHall> {
    const id = randomUUID();
    const poolHall: PoolHall = {
      id,
      ...insertPoolHall,
      createdAt: new Date(),
    };
    this.poolHalls.set(id, poolHall);
    return poolHall;
  }

  async updatePoolHall(id: string, updates: Partial<PoolHall>): Promise<PoolHall | undefined> {
    const poolHall = this.poolHalls.get(id);
    if (!poolHall) return undefined;
    
    const updated = { ...poolHall, ...updates };
    this.poolHalls.set(id, updated);
    return updated;
  }

  async unlockHallBattles(hallId: string, unlockedBy: string): Promise<PoolHall | undefined> {
    const hall = this.poolHalls.get(hallId);
    if (!hall) return undefined;
    
    const updated = {
      ...hall,
      battlesUnlocked: true,
      unlockedBy,
      unlockedAt: new Date(),
    };
    this.poolHalls.set(hallId, updated);
    return updated;
  }

  async lockHallBattles(hallId: string): Promise<PoolHall | undefined> {
    const hall = this.poolHalls.get(hallId);
    if (!hall) return undefined;
    
    const updated = {
      ...hall,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
    };
    this.poolHalls.set(hallId, updated);
    return updated;
  }

  // Hall Match methods
  async getHallMatch(id: string): Promise<HallMatch | undefined> {
    return this.hallMatches.get(id);
  }

  async getAllHallMatches(): Promise<HallMatch[]> {
    return Array.from(this.hallMatches.values());
  }

  async getHallMatchesByHall(hallId: string): Promise<HallMatch[]> {
    return Array.from(this.hallMatches.values()).filter(
      match => match.homeHallId === hallId || match.awayHallId === hallId
    );
  }

  async createHallMatch(insertHallMatch: InsertHallMatch): Promise<HallMatch> {
    const id = randomUUID();
    const hallMatch: HallMatch = {
      id,
      ...insertHallMatch,
      createdAt: new Date(),
    };
    this.hallMatches.set(id, hallMatch);
    return hallMatch;
  }

  async updateHallMatch(id: string, updates: Partial<HallMatch>): Promise<HallMatch | undefined> {
    const hallMatch = this.hallMatches.get(id);
    if (!hallMatch) return undefined;
    
    const updated = { ...hallMatch, ...updates };
    
    // If completing a match, update hall standings
    if (updates.status === "completed" && updates.winnerHallId && !hallMatch.winnerHallId) {
      const homeHall = await this.getPoolHall(hallMatch.homeHallId);
      const awayHall = await this.getPoolHall(hallMatch.awayHallId);
      
      if (homeHall && awayHall) {
        if (updates.winnerHallId === hallMatch.homeHallId) {
          await this.updatePoolHall(homeHall.id, { wins: homeHall.wins + 1, points: homeHall.points + 100 });
          await this.updatePoolHall(awayHall.id, { losses: awayHall.losses + 1, points: Math.max(0, awayHall.points - 50) });
        } else {
          await this.updatePoolHall(awayHall.id, { wins: awayHall.wins + 1, points: awayHall.points + 100 });
          await this.updatePoolHall(homeHall.id, { losses: homeHall.losses + 1, points: Math.max(0, homeHall.points - 50) });
        }
      }
    }
    
    this.hallMatches.set(id, updated);
    return updated;
  }

  // Hall Roster methods
  async getHallRoster(id: string): Promise<HallRoster | undefined> {
    return this.hallRosters.get(id);
  }

  async getAllHallRosters(): Promise<HallRoster[]> {
    return Array.from(this.hallRosters.values());
  }

  async getRosterByHall(hallId: string): Promise<HallRoster[]> {
    return Array.from(this.hallRosters.values()).filter(
      roster => roster.hallId === hallId && roster.isActive
    );
  }

  async getRosterByPlayer(playerId: string): Promise<HallRoster[]> {
    return Array.from(this.hallRosters.values()).filter(
      roster => roster.playerId === playerId && roster.isActive
    );
  }

  async createHallRoster(insertHallRoster: InsertHallRoster): Promise<HallRoster> {
    const id = randomUUID();
    const hallRoster: HallRoster = {
      id,
      ...insertHallRoster,
      joinedAt: new Date(),
    };
    this.hallRosters.set(id, hallRoster);
    return hallRoster;
  }

  async updateHallRoster(id: string, updates: Partial<HallRoster>): Promise<HallRoster | undefined> {
    const hallRoster = this.hallRosters.get(id);
    if (!hallRoster) return undefined;
    
    const updated = { ...hallRoster, ...updates };
    this.hallRosters.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
