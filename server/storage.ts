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
  private webhookEvents = new Map<string, WebhookEvent>();

  constructor() {
    // Initialize with seed data for demonstration
    this.initializeSeedData();
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

    // Seed players
    const seedPlayers: Player[] = [
      {
        id: randomUUID(),
        name: "Tyga Hoodz",
        rating: 620,
        city: "San Marcos",
        member: true,
        theme: "Eye of the Tiger",
        points: 420,
        streak: 3,
        respectPoints: 15,
        birthday: "03-15",
        stripeCustomerId: null,
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
}

export const storage = new MemStorage();
