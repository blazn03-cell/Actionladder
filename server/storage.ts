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
  type RookieMatch, type InsertRookieMatch,
  type RookieEvent, type InsertRookieEvent,
  type RookieAchievement, type InsertRookieAchievement,
  type RookieSubscription, type InsertRookieSubscription,
  type OperatorSubscription, type InsertOperatorSubscription,
  type Team, type InsertTeam,
  type TeamPlayer, type InsertTeamPlayer,
  type TeamMatch, type InsertTeamMatch,
  type TeamSet, type InsertTeamSet,
  type TeamChallenge, type InsertTeamChallenge,
  type TeamChallengeParticipant, type InsertTeamChallengeParticipant,
  type Checkin, type InsertCheckin,
  type AttitudeVote, type InsertAttitudeVote,
  type AttitudeBallot, type InsertAttitudeBallot,
  type Incident, type InsertIncident,
  type Wallet, type InsertWallet,
  type ChallengePool, type InsertChallengePool,
  type ChallengeEntry, type InsertChallengeEntry,
  type LedgerEntry, type InsertLedgerEntry,
  type Resolution, type InsertResolution,
  type MatchDivision, type InsertMatchDivision,
  type OperatorTier, type InsertOperatorTier,
  type TeamStripeAccount, type InsertTeamStripeAccount,
  type MatchEntry, type InsertMatchEntry,
  type PayoutDistribution, type InsertPayoutDistribution,
  type TeamRegistration, type InsertTeamRegistration,
  type UploadedFile, type InsertUploadedFile,
  type FileShare, type InsertFileShare,
  type GlobalRole,
  insertUserSchema,
  insertOrganizationSchema,
  insertPayoutTransferSchema
} from "@shared/schema";

// Type aliases for backward compatibility
type SidePot = ChallengePool;
type InsertSidePot = InsertChallengePool;
type SideBet = ChallengeEntry;
type InsertSideBet = InsertChallengeEntry;

// New types for user management and payouts
export interface User {
  id: string;
  email: string;
  name?: string;
  // Enhanced authentication fields
  passwordHash?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  phoneNumber?: string;
  lastLoginAt?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
  
  globalRole: GlobalRole;
  role?: string;
  
  // Profile and status
  profileComplete?: boolean;
  onboardingComplete: boolean;
  accountStatus?: string;
  
  // Payment integration
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;
  
  // Operator-specific fields
  hallName?: string;
  city?: string;
  state?: string;
  subscriptionTier?: string;
  
  createdAt: Date;
  updatedAt?: Date;
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
  // Enhanced authentication fields
  passwordHash?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  phoneNumber?: string;
  
  globalRole: GlobalRole;
  role?: string;
  
  // Profile and status
  profileComplete?: boolean;
  onboardingComplete?: boolean;
  accountStatus?: string;
  
  // Payment integration
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;
  
  // Operator-specific fields
  hallName?: string;
  city?: string;
  state?: string;
  subscriptionTier?: string;
};

export type UpsertUser = {
  id: string;
  email?: string;
  name?: string;
  globalRole?: GlobalRole;
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
  upsertUser(user: UpsertUser): Promise<User>;
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
  deleteLiveStream(id: string): Promise<boolean>;
  getLiveStreamsByLocation(city?: string, state?: string): Promise<LiveStream[]>;
  getLiveStreamStats(): Promise<any>;

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
  
  // Rookie System
  getRookieMatch(id: string): Promise<RookieMatch | undefined>;
  getAllRookieMatches(): Promise<RookieMatch[]>;
  getRookieMatchesByPlayer(playerId: string): Promise<RookieMatch[]>;
  createRookieMatch(match: InsertRookieMatch): Promise<RookieMatch>;
  updateRookieMatch(id: string, updates: Partial<RookieMatch>): Promise<RookieMatch | undefined>;
  
  getRookieEvent(id: string): Promise<RookieEvent | undefined>;
  getAllRookieEvents(): Promise<RookieEvent[]>;
  createRookieEvent(event: InsertRookieEvent): Promise<RookieEvent>;
  updateRookieEvent(id: string, updates: Partial<RookieEvent>): Promise<RookieEvent | undefined>;
  
  getRookieAchievement(id: string): Promise<RookieAchievement | undefined>;
  getRookieAchievementsByPlayer(playerId: string): Promise<RookieAchievement[]>;
  createRookieAchievement(achievement: InsertRookieAchievement): Promise<RookieAchievement>;
  
  getRookieSubscription(playerId: string): Promise<RookieSubscription | undefined>;
  getAllRookieSubscriptions(): Promise<RookieSubscription[]>;
  createRookieSubscription(subscription: InsertRookieSubscription): Promise<RookieSubscription>;
  updateRookieSubscription(playerId: string, updates: Partial<RookieSubscription>): Promise<RookieSubscription | undefined>;
  
  getRookieLeaderboard(): Promise<Player[]>;
  promoteRookieToMainLadder(playerId: string): Promise<Player | undefined>;
  
  // Side Betting - Wallet Operations
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet | undefined>;
  creditWallet(userId: string, amount: number): Promise<Wallet | undefined>;
  lockCredits(userId: string, amount: number): Promise<boolean>;
  unlockCredits(userId: string, amount: number): Promise<boolean>;
  
  // Wallet aliases (for backwards compatibility)
  addCredits(userId: string, amount: number): Promise<Wallet | undefined>;
  
  // Side Betting - Side Pots
  getSidePot(id: string): Promise<SidePot | undefined>;
  getAllSidePots(): Promise<SidePot[]>;
  getSidePotsByMatch(matchId: string): Promise<SidePot[]>;
  getSidePotsByStatus(status: string): Promise<SidePot[]>;
  createSidePot(pot: InsertSidePot): Promise<SidePot>;
  updateSidePot(id: string, updates: Partial<SidePot>): Promise<SidePot | undefined>;
  getExpiredDisputePots(now: Date): Promise<SidePot[]>;
  processDelayedPayouts(potId: string, winningSide: string): Promise<any>;
  
  // Challenge Pool aliases (for backwards compatibility)
  getChallengePool(id: string): Promise<ChallengePool | undefined>;
  getAllChallengePools(): Promise<ChallengePool[]>;
  createChallengePool(pool: InsertChallengePool): Promise<ChallengePool>;
  updateChallengePool(id: string, updates: Partial<ChallengePool>): Promise<ChallengePool | undefined>;
  
  // Side Betting - Side Bets
  getSideBet(id: string): Promise<SideBet | undefined>;
  getSideBetsByPot(sidePotId: string): Promise<SideBet[]>;
  getSideBetsByUser(userId: string): Promise<SideBet[]>;
  createSideBet(bet: InsertSideBet): Promise<SideBet>;
  updateSideBet(id: string, updates: Partial<SideBet>): Promise<SideBet | undefined>;
  
  // Challenge Entry aliases (for backwards compatibility)
  getChallengeEntry(id: string): Promise<ChallengeEntry | undefined>;
  getChallengeEntriesByPool(poolId: string): Promise<ChallengeEntry[]>;
  createChallengeEntry(entry: InsertChallengeEntry): Promise<ChallengeEntry>;
  updateChallengeEntry(id: string, updates: Partial<ChallengeEntry>): Promise<ChallengeEntry | undefined>;
  
  // Side Betting - Ledger
  getLedgerEntry(id: string): Promise<LedgerEntry | undefined>;
  getLedgerByUser(userId: string): Promise<LedgerEntry[]>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  
  // Side Betting - Resolutions
  getResolution(id: string): Promise<Resolution | undefined>;
  getResolutionByPot(sidePotId: string): Promise<Resolution | undefined>;
  createResolution(resolution: InsertResolution): Promise<Resolution>;
  
  // Operator Subscriptions
  getOperatorSubscription(operatorId: string): Promise<OperatorSubscription | undefined>;
  getAllOperatorSubscriptions(): Promise<OperatorSubscription[]>;
  createOperatorSubscription(subscription: InsertOperatorSubscription): Promise<OperatorSubscription>;
  updateOperatorSubscription(operatorId: string, updates: Partial<OperatorSubscription>): Promise<OperatorSubscription | undefined>;
  
  // Team Division System
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByOperator(operatorId: string): Promise<Team[]>;
  getTeamsByHall(hallId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;
  
  getTeamPlayer(id: string): Promise<TeamPlayer | undefined>;
  getTeamPlayersByTeam(teamId: string): Promise<TeamPlayer[]>;
  getTeamPlayersByPlayer(playerId: string): Promise<TeamPlayer[]>;
  createTeamPlayer(teamPlayer: InsertTeamPlayer): Promise<TeamPlayer>;
  updateTeamPlayer(id: string, updates: Partial<TeamPlayer>): Promise<TeamPlayer | undefined>;
  removeTeamPlayer(id: string): Promise<boolean>;
  
  getTeamMatch(id: string): Promise<TeamMatch | undefined>;
  getTeamMatchesByTeam(teamId: string): Promise<TeamMatch[]>;
  getTeamMatchesByOperator(operatorId: string): Promise<TeamMatch[]>;
  createTeamMatch(teamMatch: InsertTeamMatch): Promise<TeamMatch>;
  updateTeamMatch(id: string, updates: Partial<TeamMatch>): Promise<TeamMatch | undefined>;
  
  getTeamSet(id: string): Promise<TeamSet | undefined>;
  getTeamSetsByMatch(teamMatchId: string): Promise<TeamSet[]>;
  createTeamSet(teamSet: InsertTeamSet): Promise<TeamSet>;
  updateTeamSet(id: string, updates: Partial<TeamSet>): Promise<TeamSet | undefined>;
  
  // Team Challenge System
  getTeamChallenge(id: string): Promise<TeamChallenge | undefined>;
  getAllTeamChallenges(): Promise<TeamChallenge[]>;
  getTeamChallengesByOperator(operatorId: string): Promise<TeamChallenge[]>;
  getTeamChallengesByType(challengeType: string): Promise<TeamChallenge[]>;
  getTeamChallengesByStatus(status: string): Promise<TeamChallenge[]>;
  createTeamChallenge(challenge: InsertTeamChallenge): Promise<TeamChallenge>;
  updateTeamChallenge(id: string, updates: Partial<TeamChallenge>): Promise<TeamChallenge | undefined>;
  acceptTeamChallenge(challengeId: string, acceptingTeamId: string): Promise<TeamChallenge | undefined>;
  
  getTeamChallengeParticipant(id: string): Promise<TeamChallengeParticipant | undefined>;
  getTeamChallengeParticipantsByChallenge(challengeId: string): Promise<TeamChallengeParticipant[]>;
  createTeamChallengeParticipant(participant: InsertTeamChallengeParticipant): Promise<TeamChallengeParticipant>;
  updateTeamChallengeParticipant(id: string, updates: Partial<TeamChallengeParticipant>): Promise<TeamChallengeParticipant | undefined>;
  
  // Team Challenge Business Logic
  calculateTeamChallengeStake(challengeType: string, individualFee: number): number;
  validateProMembership(playerId: string): Promise<boolean>;
  createTeamChallengeWithParticipants(challengeData: InsertTeamChallenge, teamPlayers: string[]): Promise<{ challenge: TeamChallenge; participants: TeamChallengeParticipant[] }>;
  
  // === SPORTSMANSHIP VOTE-OUT SYSTEM ===
  
  // Check-in management
  checkinUser(data: InsertCheckin): Promise<Checkin>;
  getCheckinsBySession(sessionId: string): Promise<Checkin[]>;
  getCheckinsByVenue(venueId: string): Promise<Checkin[]>;
  getActiveCheckins(sessionId: string, venueId: string): Promise<Checkin[]>;
  
  // Vote management
  createAttitudeVote(data: InsertAttitudeVote): Promise<AttitudeVote>;
  getAttitudeVote(id: string): Promise<AttitudeVote | undefined>;
  getActiveVotes(sessionId: string, venueId: string): Promise<AttitudeVote[]>;
  updateAttitudeVote(id: string, updates: Partial<AttitudeVote>): Promise<AttitudeVote | undefined>;
  closeAttitudeVote(id: string, result: string): Promise<AttitudeVote | undefined>;
  
  // Ballot management
  createAttitudeBallot(data: InsertAttitudeBallot): Promise<AttitudeBallot>;
  getBallotsByVote(voteId: string): Promise<AttitudeBallot[]>;
  hasUserVoted(voteId: string, userId: string): Promise<boolean>;
  
  // Vote calculation utilities
  calculateVoteWeights(voteId: string): Promise<{ totalWeight: number; outWeight: number; keepWeight: number }>;
  checkVoteQuorum(voteId: string): Promise<boolean>;
  
  // Incident management
  createIncident(data: InsertIncident): Promise<Incident>;
  getIncidentsByUser(userId: string): Promise<Incident[]>;
  getRecentIncidents(venueId: string, hours: number): Promise<Incident[]>;
  
  // User eligibility and cooldowns
  canUserBeVotedOn(userId: string, sessionId: string): Promise<boolean>;
  getLastVoteForUser(userId: string, sessionId: string): Promise<AttitudeVote | undefined>;
  isUserImmune(userId: string, sessionId: string): Promise<boolean>;
  
  // File Upload Tracking
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  getUploadedFileByPath(objectPath: string): Promise<UploadedFile | undefined>;
  getUserUploadedFiles(userId: string, category?: string): Promise<UploadedFile[]>;
  getAllUploadedFiles(): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined>;
  deleteUploadedFile(id: string): Promise<boolean>;
  incrementFileDownloadCount(id: string): Promise<void>;
  
  // File Sharing
  getFileShare(id: string): Promise<FileShare | undefined>;
  getFileShares(fileId: string): Promise<FileShare[]>;
  getUserSharedFiles(userId: string): Promise<FileShare[]>;
  createFileShare(share: InsertFileShare): Promise<FileShare>;
  updateFileShare(id: string, updates: Partial<FileShare>): Promise<FileShare | undefined>;
  deleteFileShare(id: string): Promise<boolean>;
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
  private rookieMatches = new Map<string, RookieMatch>();
  private rookieEvents = new Map<string, RookieEvent>();
  private rookieAchievements = new Map<string, RookieAchievement>();
  private rookieSubscriptions = new Map<string, RookieSubscription>();
  private hallRosters = new Map<string, HallRoster>();
  private webhookEvents = new Map<string, WebhookEvent>();
  private operatorSettings = new Map<string, OperatorSettings>(); // keyed by operatorUserId
  
  // Side Betting Storage
  private wallets = new Map<string, Wallet>(); // keyed by userId
  private sidePots = new Map<string, SidePot>();
  private sideBets = new Map<string, SideBet>();
  private ledgerEntries = new Map<string, LedgerEntry>();
  private resolutions = new Map<string, Resolution>();
  
  // Operator Subscription Storage
  private operatorSubscriptions = new Map<string, OperatorSubscription>(); // keyed by operatorId
  
  // Team Division Storage
  private teams = new Map<string, Team>();
  private teamPlayers = new Map<string, TeamPlayer>();
  private teamMatches = new Map<string, TeamMatch>();
  private teamSets = new Map<string, TeamSet>();
  
  // Team Challenge Storage
  private teamChallenges = new Map<string, TeamChallenge>();
  private teamChallengeParticipants = new Map<string, TeamChallengeParticipant>();
  
  // === SPORTSMANSHIP VOTE-OUT SYSTEM ===
  private checkins = new Map<string, Checkin>();
  private attitudeVotes = new Map<string, AttitudeVote>();
  private attitudeBallots = new Map<string, AttitudeBallot>();
  private incidents = new Map<string, Incident>();

  // === MATCH DIVISION SYSTEM ===
  private matchDivisions = new Map<string, MatchDivision>();
  private operatorTiers = new Map<string, OperatorTier>();
  private teamStripeAccounts = new Map<string, TeamStripeAccount>();
  private matchEntries = new Map<string, MatchEntry>();
  private payoutDistributions = new Map<string, PayoutDistribution>();
  private teamRegistrations = new Map<string, TeamRegistration>();
  
  // === FILE UPLOAD SYSTEM ===
  private uploadedFiles = new Map<string, UploadedFile>();
  private fileShares = new Map<string, FileShare>();

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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      return await this.updateUser(userData.id, userData) || existingUser;
    } else {
      // For new user creation, email is required
      if (!userData.email) {
        throw new Error("Email is required for new user creation");
      }
      return await this.createUser({
        email: userData.email,
        name: userData.name,
        globalRole: userData.globalRole || "PLAYER",
        stripeCustomerId: userData.stripeCustomerId,
        stripeConnectId: userData.stripeConnectId,
        payoutShareBps: userData.payoutShareBps,
        onboardingComplete: userData.onboardingComplete,
      });
    }
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
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        membershipTier: "basic",
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
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        membershipTier: "none",
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
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        membershipTier: "pro",
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
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        membershipTier: "none",
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
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        membershipTier: "basic",
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
        rookieLosses: 1,
        rookiePoints: 25,
        rookieStreak: 2,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: null,
        membershipTier: "none",
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
        rookieLosses: 2,
        rookiePoints: 35,
        rookieStreak: 2,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: null,
        membershipTier: "none",
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
        rookieLosses: 3,
        rookiePoints: 55,
        rookieStreak: 1,
        rookiePassActive: true,
        rookiePassExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        graduatedAt: null,
        membershipTier: "basic",
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
        rookieLosses: 4,
        rookiePoints: 15,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: null,
        membershipTier: "none",
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

    // === INITIALIZE MATCH DIVISIONS ===
    const poolhallDivision: MatchDivision = {
      id: randomUUID(),
      name: "poolhall",
      displayName: "Poolhall vs Poolhall",
      minTeamSize: 2,
      maxTeamSize: 5,
      entryFeeMin: 1000, // $10 minimum
      entryFeeMax: 1000000, // $10,000 maximum
      requiresStreaming: false,
      requiresCaptain: false,
      allowsSideBets: true,
      description: "2v2 or 3v3 or 5v5 matches. Each player plays singles + one team match. Poolhall Operators set challenge rules + fee. Played in-house or neutral site. Winner takes challenge fee + points. Trash talk + walk-ins encouraged.",
      active: true,
      createdAt: new Date(),
    };

    const cityDivision: MatchDivision = {
      id: randomUUID(),
      name: "city",
      displayName: "City vs City",
      minTeamSize: 5,
      maxTeamSize: 10,
      entryFeeMin: 50000, // $500 minimum
      entryFeeMax: 200000, // $2,000 maximum
      requiresStreaming: true,
      requiresCaptain: true,
      allowsSideBets: true,
      description: "5 or 10-man squads. Played on 2–3 tables simultaneously. Each team must name a captain + streamer. 'Put-Up' Rule: Captain must pick who plays under pressure. Side bets allowed — but official result = Ladder Points only.",
      active: true,
      createdAt: new Date(),
    };

    const stateDivision: MatchDivision = {
      id: randomUUID(),
      name: "state",
      displayName: "State vs State",
      minTeamSize: 10,
      maxTeamSize: 12,
      entryFeeMin: 1000000, // $10,000 minimum
      entryFeeMax: 1000000, // $10,000 maximum
      requiresStreaming: true,
      requiresCaptain: true,
      allowsSideBets: true,
      description: "10–12 man teams. Home/Away rotation OR neutral high-end venue. 1-Day Battle Format or 3-Day Series. Includes Side Games: 3pt contest, Trick Shot, Speed Run. States build fans, merch, hype. Real MVP and 'Brick Award' for worst performance.",
      active: true,
      createdAt: new Date(),
    };

    this.matchDivisions.set(poolhallDivision.id, poolhallDivision);
    this.matchDivisions.set(cityDivision.id, cityDivision);
    this.matchDivisions.set(stateDivision.id, stateDivision);

    // === INITIALIZE OPERATOR TIERS ===
    const rookieHall: OperatorTier = {
      id: randomUUID(),
      name: "rookie_hall",
      displayName: "Rookie Hall",
      monthlyFee: 9900, // $99
      revenueSplitPercent: 5, // 5% to Action Ladder
      maxTeams: 1,
      hasPromoTools: false,
      hasLiveStreamBonus: false,
      hasResellRights: false,
      description: "Perfect for new operators getting started",
      features: ["Poolhall Ladder", "1 Team", "5% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    const basicHall: OperatorTier = {
      id: randomUUID(),
      name: "basic_hall",
      displayName: "Basic Hall",
      monthlyFee: 19900, // $199
      revenueSplitPercent: 10, // 10% to Action Ladder
      maxTeams: 1,
      hasPromoTools: false,
      hasLiveStreamBonus: false,
      hasResellRights: false,
      description: "Access to all ladders with competitive revenue split",
      features: ["All Ladders", "1 Team", "10% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    const eliteOperator: OperatorTier = {
      id: randomUUID(),
      name: "elite_operator",
      displayName: "Elite Operator",
      monthlyFee: 39900, // $399
      revenueSplitPercent: 10, // 10% to Action Ladder
      maxTeams: 2,
      hasPromoTools: true,
      hasLiveStreamBonus: true,
      hasResellRights: false,
      description: "Full access with promotional tools and streaming bonuses",
      features: ["All Ladders", "2 Teams", "Promo Tools", "Live Stream Bonus", "10% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    const franchise: OperatorTier = {
      id: randomUUID(),
      name: "franchise",
      displayName: "Franchise",
      monthlyFee: 79900, // $799
      revenueSplitPercent: 10, // 10% to Action Ladder
      maxTeams: null, // Unlimited
      hasPromoTools: true,
      hasLiveStreamBonus: true,
      hasResellRights: true,
      description: "Complete control with reselling rights and unlimited teams",
      features: ["Full Control", "Unlimited Teams", "Resell Rights", "All Features", "10% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    this.operatorTiers.set(rookieHall.id, rookieHall);
    this.operatorTiers.set(basicHall.id, basicHall);
    this.operatorTiers.set(eliteOperator.id, eliteOperator);
    this.operatorTiers.set(franchise.id, franchise);
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
      rookieLosses: 0,
      rookiePoints: 0,
      rookieStreak: 0,
      rookiePassActive: false,
      rookiePassExpiresAt: null,
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
      hallMatchId: null,
      maxViewers: 0,
      embedUrl: null,
      lastLiveAt: null,
      ...insertLiveStream,
      category: insertLiveStream.category || null,
      quality: insertLiveStream.quality || null,
      tags: insertLiveStream.tags || [],
      tournamentId: insertLiveStream.tournamentId || null,
      streamerId: insertLiveStream.streamerId || null,
      thumbnailUrl: insertLiveStream.thumbnailUrl || null,
      language: insertLiveStream.language || "en",
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

  async deleteLiveStream(id: string): Promise<boolean> {
    return this.liveStreams.delete(id);
  }

  async getLiveStreamsByLocation(city?: string, state?: string): Promise<LiveStream[]> {
    const allStreams = Array.from(this.liveStreams.values());
    return allStreams.filter(stream => {
      const matchesCity = !city || stream.city?.toLowerCase().includes(city.toLowerCase());
      const matchesState = !state || stream.state?.toLowerCase() === state.toLowerCase();
      return matchesCity && matchesState;
    });
  }

  async getLiveStreamStats(): Promise<any> {
    const allStreams = Array.from(this.liveStreams.values());
    const liveStreams = allStreams.filter(s => s.isLive);
    const totalViewers = liveStreams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0);
    const peakViewers = allStreams.reduce((max, stream) => Math.max(max, stream.maxViewers || 0), 0);
    
    const platformStats = allStreams.reduce((acc, stream) => {
      acc[stream.platform] = (acc[stream.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const locationStats = allStreams.reduce((acc, stream) => {
      if (stream.state) {
        acc[stream.state] = (acc[stream.state] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalStreams: allStreams.length,
      liveStreams: liveStreams.length,
      totalViewers,
      peakViewers,
      platformStats,
      locationStats
    };
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
      points: 0,
      active: true,
      description: null,
      wins: 0,
      losses: 0,
      address: null,
      phone: null,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      ...insertPoolHall,
      id,
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
      status: "scheduled",
      stake: null,
      notes: null,
      totalRacks: 7,
      homeScore: null,
      awayScore: null,
      winnerHallId: null,
      scheduledDate: null,
      completedAt: null,
      ...insertHallMatch,
      id,
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
      position: null,
      isActive: true,
      ...insertHallRoster,
      id,
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

  // Rookie System Implementation
  async getRookieMatch(id: string): Promise<RookieMatch | undefined> {
    return this.rookieMatches.get(id);
  }

  async getAllRookieMatches(): Promise<RookieMatch[]> {
    return Array.from(this.rookieMatches.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getRookieMatchesByPlayer(playerId: string): Promise<RookieMatch[]> {
    return Array.from(this.rookieMatches.values())
      .filter(match => match.challenger === playerId || match.opponent === playerId)
      .sort((a, b) => 
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
  }

  async createRookieMatch(match: InsertRookieMatch): Promise<RookieMatch> {
    const newMatch = {
      status: "scheduled",
      notes: null,
      winner: null,
      commission: 200, // $2 default
      fee: 800, // $8 default
      pointsAwarded: null,
      ...match,
      id: randomUUID(),
      reportedAt: null,
      createdAt: new Date(),
    };
    this.rookieMatches.set(newMatch.id, newMatch);
    return newMatch;
  }

  async updateRookieMatch(id: string, updates: Partial<RookieMatch>): Promise<RookieMatch | undefined> {
    const match = this.rookieMatches.get(id);
    if (!match) return undefined;
    const updatedMatch = { ...match, ...updates };
    this.rookieMatches.set(id, updatedMatch);
    return updatedMatch;
  }

  async getRookieEvent(id: string): Promise<RookieEvent | undefined> {
    return this.rookieEvents.get(id);
  }

  async getAllRookieEvents(): Promise<RookieEvent[]> {
    return Array.from(this.rookieEvents.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createRookieEvent(event: InsertRookieEvent): Promise<RookieEvent> {
    const newEvent = {
      id: randomUUID(),
      status: event.status || "open",
      prizePool: event.prizePool || 0,
      maxPlayers: event.maxPlayers || 8,
      currentPlayers: event.currentPlayers || 0,
      buyIn: event.buyIn || 500,
      prizeType: event.prizeType || "credit",
      description: event.description || null,
      ...event,
      createdAt: new Date(),
    };
    this.rookieEvents.set(newEvent.id, newEvent);
    return newEvent;
  }

  async updateRookieEvent(id: string, updates: Partial<RookieEvent>): Promise<RookieEvent | undefined> {
    const event = this.rookieEvents.get(id);
    if (!event) return undefined;
    const updatedEvent = { ...event, ...updates };
    this.rookieEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async getRookieAchievement(id: string): Promise<RookieAchievement | undefined> {
    return this.rookieAchievements.get(id);
  }

  async getRookieAchievementsByPlayer(playerId: string): Promise<RookieAchievement[]> {
    return Array.from(this.rookieAchievements.values())
      .filter(achievement => achievement.playerId === playerId)
      .sort((a, b) => 
        (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0)
      );
  }

  async createRookieAchievement(achievement: InsertRookieAchievement): Promise<RookieAchievement> {
    const newAchievement = {
      id: randomUUID(),
      description: achievement.description || null,
      badge: achievement.badge || null,
      ...achievement,
      earnedAt: new Date(),
    };
    this.rookieAchievements.set(newAchievement.id, newAchievement);
    return newAchievement;
  }

  async getRookieSubscription(playerId: string): Promise<RookieSubscription | undefined> {
    return Array.from(this.rookieSubscriptions.values()).find(sub => sub.playerId === playerId);
  }

  async getAllRookieSubscriptions(): Promise<RookieSubscription[]> {
    return Array.from(this.rookieSubscriptions.values()).sort((a, b) => 
      (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0)
    );
  }

  async createRookieSubscription(subscription: InsertRookieSubscription): Promise<RookieSubscription> {
    const newSubscription = {
      status: "active",
      stripeSubscriptionId: null,
      monthlyFee: 500,
      expiresAt: null,
      cancelledAt: null,
      ...subscription,
      id: randomUUID(),
      startedAt: new Date(),
    };
    this.rookieSubscriptions.set(newSubscription.id, newSubscription);
    return newSubscription;
  }

  async updateRookieSubscription(playerId: string, updates: Partial<RookieSubscription>): Promise<RookieSubscription | undefined> {
    const subscription = await this.getRookieSubscription(playerId);
    if (!subscription) return undefined;
    const updatedSubscription = { ...subscription, ...updates };
    this.rookieSubscriptions.set(subscription.id, updatedSubscription);
    return updatedSubscription;
  }

  async getRookieLeaderboard(): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.isRookie)
      .sort((a, b) => {
        // Sort by rookie points descending, then by wins
        const aPoints = a.rookiePoints || 0;
        const bPoints = b.rookiePoints || 0;
        const aWins = a.rookieWins || 0;
        const bWins = b.rookieWins || 0;
        
        if (bPoints !== aPoints) {
          return bPoints - aPoints;
        }
        return bWins - aWins;
      });
  }

  async promoteRookieToMainLadder(playerId: string): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (!player || !player.isRookie) return undefined;

    const updatedPlayer = {
      ...player,
      isRookie: false,
      graduatedAt: new Date(),
    };
    this.players.set(playerId, updatedPlayer);

    // Award graduation achievement
    await this.createRookieAchievement({
      playerId,
      type: "graduated",
      title: "Graduated to Main Ladder",
      description: "Reached 100 rookie points and joined the main ladder",
      badge: "🎓",
    });

    return updatedPlayer;
  }

  // Side Betting - Wallet Operations
  async getWallet(userId: string): Promise<Wallet | undefined> {
    return this.wallets.get(userId);
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const newWallet: Wallet = {
      userId: wallet.userId,
      balanceCredits: wallet.balanceCredits || 0,
      balanceLockedCredits: wallet.balanceLockedCredits || 0,
      createdAt: new Date(),
    };
    this.wallets.set(wallet.userId, newWallet);
    return newWallet;
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(userId);
    if (!wallet) return undefined;
    
    const updatedWallet = { ...wallet, ...updates };
    this.wallets.set(userId, updatedWallet);
    return updatedWallet;
  }

  async creditWallet(userId: string, amount: number): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(userId);
    if (!wallet) return undefined;
    
    const updatedWallet = {
      ...wallet,
      balanceCredits: wallet.balanceCredits + amount,
    };
    this.wallets.set(userId, updatedWallet);
    return updatedWallet;
  }

  async lockCredits(userId: string, amount: number): Promise<boolean> {
    const wallet = this.wallets.get(userId);
    if (!wallet || wallet.balanceCredits < amount) return false;
    
    const updatedWallet = {
      ...wallet,
      balanceCredits: wallet.balanceCredits - amount,
      balanceLockedCredits: wallet.balanceLockedCredits + amount,
    };
    this.wallets.set(userId, updatedWallet);
    return true;
  }

  async unlockCredits(userId: string, amount: number): Promise<boolean> {
    const wallet = this.wallets.get(userId);
    if (!wallet || wallet.balanceLockedCredits < amount) return false;
    
    const updatedWallet = {
      ...wallet,
      balanceCredits: wallet.balanceCredits + amount,
      balanceLockedCredits: wallet.balanceLockedCredits - amount,
    };
    this.wallets.set(userId, updatedWallet);
    return true;
  }

  // Side Betting - Side Pots
  async getSidePot(id: string): Promise<SidePot | undefined> {
    return this.sidePots.get(id);
  }

  async getAllSidePots(): Promise<SidePot[]> {
    return Array.from(this.sidePots.values());
  }

  async getSidePotsByMatch(matchId: string): Promise<SidePot[]> {
    return Array.from(this.sidePots.values()).filter(pot => pot.matchId === matchId);
  }

  async getSidePotsByStatus(status: string): Promise<SidePot[]> {
    return Array.from(this.sidePots.values()).filter(pot => pot.status === status);
  }

  async createSidePot(insertPot: InsertSidePot): Promise<SidePot> {
    const id = randomUUID();
    const pot: SidePot = {
      id,
      matchId: insertPot.matchId,
      creatorId: insertPot.creatorId,
      sideALabel: insertPot.sideALabel,
      sideBLabel: insertPot.sideBLabel,
      stakePerSide: insertPot.stakePerSide,
      feeBps: insertPot.feeBps || 800,
      status: insertPot.status || "open",
      lockCutoffAt: insertPot.lockCutoffAt,
      createdAt: new Date(),
    };
    this.sidePots.set(id, pot);
    return pot;
  }

  async updateSidePot(id: string, updates: Partial<SidePot>): Promise<SidePot | undefined> {
    const pot = this.sidePots.get(id);
    if (!pot) return undefined;
    
    const updatedPot = { ...pot, ...updates };
    this.sidePots.set(id, updatedPot);
    return updatedPot;
  }

  async getExpiredDisputePots(now: Date): Promise<SidePot[]> {
    return Array.from(this.sidePots.values()).filter(pot => 
      pot.status === "resolved" && 
      pot.disputeDeadline && 
      now > pot.disputeDeadline && 
      pot.disputeStatus === "none" &&
      !pot.autoResolvedAt
    );
  }

  async processDelayedPayouts(potId: string, winningSide: string): Promise<any> {
    const pot = await this.getSidePot(potId);
    if (!pot) throw new Error("Side pot not found");

    // Get all bets for this pot
    const bets = await this.getSideBetsByPot(potId);
    const winners = bets.filter(bet => bet.side === winningSide);
    const losers = bets.filter(bet => bet.side !== winningSide);
    
    // Calculate total pot and service fee
    const totalPot = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
    const serviceFee = Math.floor(totalPot * (pot.feeBps || 850) / 10000);
    const netPot = totalPot - serviceFee;
    
    // Calculate winnings for each winner
    const totalWinnerStake = winners.reduce((sum, bet) => sum + (bet.amount || 0), 0);
    const payouts = [];
    
    for (const winner of winners) {
      const winnerShare = totalWinnerStake > 0 ? (winner.amount || 0) / totalWinnerStake : 0;
      const winnings = Math.floor(winnerShare * netPot);
      
      // Credit winner's wallet
      await this.creditWallet(winner.userId!, winnings);
      
      // Update bet status
      await this.updateSideBet(winner.id, { status: "paid" });
      
      // Create ledger entry
      await this.createLedgerEntry({
        userId: winner.userId!,
        type: "pot_release_win",
        amount: winnings,
        refId: winner.id,
        metaJson: JSON.stringify({ sidePotId: potId, winnings, originalStake: winner.amount }),
      });

      payouts.push({
        userId: winner.userId,
        amount: winnings,
        originalStake: winner.amount
      });
    }
    
    // Mark losers as lost (no payout)
    for (const loser of losers) {
      await this.updateSideBet(loser.id, { status: "lost" });
    }

    return {
      totalPot,
      serviceFee,
      netPot,
      winnersCount: winners.length,
      losersCount: losers.length,
      payouts
    };
  }

  // Side Betting - Side Bets
  async getSideBet(id: string): Promise<SideBet | undefined> {
    return this.sideBets.get(id);
  }

  async getSideBetsByPot(sidePotId: string): Promise<SideBet[]> {
    return Array.from(this.sideBets.values()).filter(bet => bet.sidePotId === sidePotId);
  }

  async getSideBetsByUser(userId: string): Promise<SideBet[]> {
    return Array.from(this.sideBets.values()).filter(bet => bet.userId === userId);
  }

  async createSideBet(insertBet: InsertSideBet): Promise<SideBet> {
    const id = randomUUID();
    const bet: SideBet = {
      id,
      sidePotId: insertBet.sidePotId,
      userId: insertBet.userId,
      side: insertBet.side,
      amount: insertBet.amount,
      status: insertBet.status,
      fundedAt: insertBet.fundedAt,
      createdAt: new Date(),
    };
    this.sideBets.set(id, bet);
    return bet;
  }

  async updateSideBet(id: string, updates: Partial<SideBet>): Promise<SideBet | undefined> {
    const bet = this.sideBets.get(id);
    if (!bet) return undefined;
    
    const updatedBet = { ...bet, ...updates };
    this.sideBets.set(id, updatedBet);
    return updatedBet;
  }

  // Side Betting - Ledger
  async getLedgerEntry(id: string): Promise<LedgerEntry | undefined> {
    return this.ledgerEntries.get(id);
  }

  async getLedgerByUser(userId: string): Promise<LedgerEntry[]> {
    return Array.from(this.ledgerEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createLedgerEntry(insertEntry: InsertLedgerEntry): Promise<LedgerEntry> {
    const id = randomUUID();
    const entry: LedgerEntry = {
      id,
      userId: insertEntry.userId,
      type: insertEntry.type,
      amount: insertEntry.amount,
      refId: insertEntry.refId,
      metaJson: insertEntry.metaJson,
      createdAt: new Date(),
    };
    this.ledgerEntries.set(id, entry);
    return entry;
  }

  // Side Betting - Resolutions
  async getResolution(id: string): Promise<Resolution | undefined> {
    return this.resolutions.get(id);
  }

  async getResolutionByPot(sidePotId: string): Promise<Resolution | undefined> {
    return Array.from(this.resolutions.values()).find(res => res.sidePotId === sidePotId);
  }

  async createResolution(insertResolution: InsertResolution): Promise<Resolution> {
    const id = randomUUID();
    const resolution: Resolution = {
      id,
      sidePotId: insertResolution.sidePotId,
      winnerSide: insertResolution.winnerSide,
      decidedBy: insertResolution.decidedBy,
      decidedAt: new Date(),
      notes: insertResolution.notes,
    };
    this.resolutions.set(id, resolution);
    return resolution;
  }

  // Challenge Pool aliases (for backwards compatibility)
  async getChallengePool(id: string): Promise<ChallengePool | undefined> {
    return this.getSidePot(id);
  }

  async getAllChallengePools(): Promise<ChallengePool[]> {
    return this.getAllSidePots();
  }

  async createChallengePool(pool: InsertChallengePool): Promise<ChallengePool> {
    return this.createSidePot(pool);
  }

  async updateChallengePool(id: string, updates: Partial<ChallengePool>): Promise<ChallengePool | undefined> {
    return this.updateSidePot(id, updates);
  }

  // Challenge Entry aliases (for backwards compatibility)
  async getChallengeEntry(id: string): Promise<ChallengeEntry | undefined> {
    return this.getSideBet(id);
  }

  async getChallengeEntriesByPool(poolId: string): Promise<ChallengeEntry[]> {
    return this.getSideBetsByPot(poolId);
  }

  async createChallengeEntry(entry: InsertChallengeEntry): Promise<ChallengeEntry> {
    return this.createSideBet(entry);
  }

  async updateChallengeEntry(id: string, updates: Partial<ChallengeEntry>): Promise<ChallengeEntry | undefined> {
    return this.updateSideBet(id, updates);
  }

  // Wallet aliases (for backwards compatibility)
  async addCredits(userId: string, amount: number): Promise<Wallet | undefined> {
    return this.creditWallet(userId, amount);
  }

  // Operator Subscription Methods
  async getOperatorSubscription(operatorId: string): Promise<OperatorSubscription | undefined> {
    return this.operatorSubscriptions.get(operatorId);
  }

  async getAllOperatorSubscriptions(): Promise<OperatorSubscription[]> {
    return Array.from(this.operatorSubscriptions.values());
  }

  async createOperatorSubscription(insertSubscription: InsertOperatorSubscription): Promise<OperatorSubscription> {
    const id = randomUUID();
    
    // Calculate pricing based on tier and player count
    const { basePriceMonthly, tier } = this.calculateSubscriptionPricing(
      insertSubscription.playerCount || 0,
      insertSubscription.extraLadders || 0,
      insertSubscription.rookieModuleActive || false,
      insertSubscription.rookiePassesActive || 0
    );
    
    const subscription: OperatorSubscription = {
      id,
      operatorId: insertSubscription.operatorId,
      hallName: insertSubscription.hallName,
      playerCount: insertSubscription.playerCount || 0,
      tier,
      basePriceMonthly,
      extraPlayersCharge: insertSubscription.extraPlayersCharge || 0,
      extraLadders: insertSubscription.extraLadders || 0,
      extraLadderCharge: (insertSubscription.extraLadders || 0) * 10000, // $100 per extra ladder
      rookieModuleActive: insertSubscription.rookieModuleActive || false,
      rookieModuleCharge: insertSubscription.rookieModuleActive ? 5000 : 0, // $50/mo
      rookiePassesActive: insertSubscription.rookiePassesActive || 0,
      rookiePassCharge: (insertSubscription.rookiePassesActive || 0) * 1500, // $15 per pass
      stripeSubscriptionId: insertSubscription.stripeSubscriptionId,
      stripeCustomerId: insertSubscription.stripeCustomerId,
      status: insertSubscription.status || "active",
      billingCycleStart: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      totalMonthlyCharge: this.calculateTotalMonthlyCharge(basePriceMonthly, insertSubscription),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.operatorSubscriptions.set(insertSubscription.operatorId, subscription);
    return subscription;
  }

  async updateOperatorSubscription(operatorId: string, updates: Partial<OperatorSubscription>): Promise<OperatorSubscription | undefined> {
    const subscription = this.operatorSubscriptions.get(operatorId);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
    this.operatorSubscriptions.set(operatorId, updatedSubscription);
    return updatedSubscription;
  }

  // Helper method to calculate subscription pricing
  private calculateSubscriptionPricing(playerCount: number, extraLadders: number, rookieModule: boolean, rookiePasses: number) {
    let tier: string;
    let basePriceMonthly: number;
    
    if (playerCount <= 15) {
      tier = "small";
      basePriceMonthly = 19900; // $199
    } else if (playerCount <= 25) {
      tier = "medium"; 
      basePriceMonthly = 29900; // $299
    } else if (playerCount <= 40) {
      tier = "large";
      basePriceMonthly = 39900; // $399
    } else {
      tier = "mega";
      basePriceMonthly = 49900; // $499
    }
    
    return { basePriceMonthly, tier };
  }

  private calculateTotalMonthlyCharge(basePriceMonthly: number, subscription: InsertOperatorSubscription): number {
    let total = basePriceMonthly;
    
    // Add extra ladder charges
    total += (subscription.extraLadders || 0) * 10000; // $100 per extra ladder
    
    // Add rookie module charge
    if (subscription.rookieModuleActive) {
      total += 5000; // $50/mo
    }
    
    // Add rookie pass charges
    total += (subscription.rookiePassesActive || 0) * 1500; // $15 per pass
    
    // Add extra player charges for players beyond tier limit
    const tierLimits = { small: 15, medium: 25, large: 40, mega: 999 };
    const playerCount = subscription.playerCount || 0;
    
    if (playerCount > 15 && subscription.tier === "small") {
      total += Math.max(0, playerCount - 15) * 800; // $8 per extra player
    } else if (playerCount > 25 && subscription.tier === "medium") {
      total += Math.max(0, playerCount - 25) * 800;
    } else if (playerCount > 40 && subscription.tier === "large") {
      total += Math.max(0, playerCount - 40) * 800;
    }
    
    return total;
  }

  // Team Division System Methods
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByOperator(operatorId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.operatorId === operatorId);
  }

  async getTeamsByHall(hallId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.hallId === hallId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = {
      id,
      name: insertTeam.name,
      operatorId: insertTeam.operatorId,
      hallId: insertTeam.hallId,
      captainId: insertTeam.captainId,
      teamType: insertTeam.teamType,
      maxPlayers: insertTeam.teamType === "3man" ? 3 : 5,
      maxSubs: insertTeam.teamType === "3man" ? 2 : 3,
      currentPlayers: 1, // Start with captain
      currentSubs: 0,
      rosterLocked: false,
      status: insertTeam.status || "active",
      seasonWins: 0,
      seasonLosses: 0,
      ladderPoints: 800,
      consecutiveLosses: 0,
      captainForcedNext: false,
      createdAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Team Player Methods
  async getTeamPlayer(id: string): Promise<TeamPlayer | undefined> {
    return this.teamPlayers.get(id);
  }

  async getTeamPlayersByTeam(teamId: string): Promise<TeamPlayer[]> {
    return Array.from(this.teamPlayers.values()).filter(player => player.teamId === teamId);
  }

  async getTeamPlayersByPlayer(playerId: string): Promise<TeamPlayer[]> {
    return Array.from(this.teamPlayers.values()).filter(player => player.playerId === playerId);
  }

  async createTeamPlayer(insertTeamPlayer: InsertTeamPlayer): Promise<TeamPlayer> {
    const id = randomUUID();
    const teamPlayer: TeamPlayer = {
      id,
      teamId: insertTeamPlayer.teamId,
      playerId: insertTeamPlayer.playerId,
      role: insertTeamPlayer.role,
      position: insertTeamPlayer.position,
      isActive: insertTeamPlayer.isActive ?? true,
      seasonWins: 0,
      seasonLosses: 0,
      joinedAt: new Date(),
    };
    this.teamPlayers.set(id, teamPlayer);
    return teamPlayer;
  }

  async updateTeamPlayer(id: string, updates: Partial<TeamPlayer>): Promise<TeamPlayer | undefined> {
    const teamPlayer = this.teamPlayers.get(id);
    if (!teamPlayer) return undefined;
    
    const updatedTeamPlayer = { ...teamPlayer, ...updates };
    this.teamPlayers.set(id, updatedTeamPlayer);
    return updatedTeamPlayer;
  }

  async removeTeamPlayer(id: string): Promise<boolean> {
    return this.teamPlayers.delete(id);
  }

  // Team Match Methods
  async getTeamMatch(id: string): Promise<TeamMatch | undefined> {
    return this.teamMatches.get(id);
  }

  async getTeamMatchesByTeam(teamId: string): Promise<TeamMatch[]> {
    return Array.from(this.teamMatches.values()).filter(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );
  }

  async getTeamMatchesByOperator(operatorId: string): Promise<TeamMatch[]> {
    return Array.from(this.teamMatches.values()).filter(match => match.operatorId === operatorId);
  }

  async createTeamMatch(insertTeamMatch: InsertTeamMatch): Promise<TeamMatch> {
    const id = randomUUID();
    const teamMatch: TeamMatch = {
      id,
      homeTeamId: insertTeamMatch.homeTeamId,
      awayTeamId: insertTeamMatch.awayTeamId,
      operatorId: insertTeamMatch.operatorId,
      homeScore: 0,
      awayScore: 0,
      maxSets: insertTeamMatch.maxSets,
      currentSet: 1,
      status: insertTeamMatch.status || "scheduled",
      winnerTeamId: insertTeamMatch.winnerTeamId,
      isHillHill: false,
      putUpRound: insertTeamMatch.putUpRound,
      homeLineupOrder: insertTeamMatch.homeLineupOrder || [],
      awayLineupOrder: insertTeamMatch.awayLineupOrder || [],
      homeLineupRevealed: false,
      awayLineupRevealed: false,
      moneyBallActive: insertTeamMatch.moneyBallActive || false,
      moneyBallAmount: insertTeamMatch.moneyBallAmount || 2000,
      scheduledAt: insertTeamMatch.scheduledAt,
      completedAt: insertTeamMatch.completedAt,
      createdAt: new Date(),
    };
    this.teamMatches.set(id, teamMatch);
    return teamMatch;
  }

  async updateTeamMatch(id: string, updates: Partial<TeamMatch>): Promise<TeamMatch | undefined> {
    const teamMatch = this.teamMatches.get(id);
    if (!teamMatch) return undefined;
    
    const updatedTeamMatch = { ...teamMatch, ...updates };
    this.teamMatches.set(id, updatedTeamMatch);
    return updatedTeamMatch;
  }

  // Team Set Methods
  async getTeamSet(id: string): Promise<TeamSet | undefined> {
    return this.teamSets.get(id);
  }

  async getTeamSetsByMatch(teamMatchId: string): Promise<TeamSet[]> {
    return Array.from(this.teamSets.values()).filter(set => set.teamMatchId === teamMatchId);
  }

  async createTeamSet(insertTeamSet: InsertTeamSet): Promise<TeamSet> {
    const id = randomUUID();
    const teamSet: TeamSet = {
      id,
      teamMatchId: insertTeamSet.teamMatchId,
      setNumber: insertTeamSet.setNumber,
      homePlayerId: insertTeamSet.homePlayerId,
      awayPlayerId: insertTeamSet.awayPlayerId,
      winnerId: insertTeamSet.winnerId,
      loserId: insertTeamSet.loserId,
      isPutUpSet: insertTeamSet.isPutUpSet || false,
      putUpType: insertTeamSet.putUpType,
      isMoneyBallSet: insertTeamSet.isMoneyBallSet || false,
      status: insertTeamSet.status || "scheduled",
      completedAt: insertTeamSet.completedAt,
      clipUrl: insertTeamSet.clipUrl,
      createdAt: new Date(),
    };
    this.teamSets.set(id, teamSet);
    return teamSet;
  }

  async updateTeamSet(id: string, updates: Partial<TeamSet>): Promise<TeamSet | undefined> {
    const teamSet = this.teamSets.get(id);
    if (!teamSet) return undefined;
    
    const updatedTeamSet = { ...teamSet, ...updates };
    this.teamSets.set(id, updatedTeamSet);
    return updatedTeamSet;
  }

  // Team Challenge System Methods
  async getTeamChallenge(id: string): Promise<TeamChallenge | undefined> {
    return this.teamChallenges.get(id);
  }

  async getAllTeamChallenges(): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values());
  }

  async getTeamChallengesByOperator(operatorId: string): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values()).filter(challenge => 
      challenge.operatorId === operatorId
    );
  }

  async getTeamChallengesByType(challengeType: string): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values()).filter(challenge => 
      challenge.challengeType === challengeType
    );
  }

  async getTeamChallengesByStatus(status: string): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values()).filter(challenge => 
      challenge.status === status
    );
  }

  async createTeamChallenge(data: InsertTeamChallenge): Promise<TeamChallenge> {
    const challenge: TeamChallenge = {
      id: randomUUID(),
      challengingTeamId: data.challengingTeamId,
      challengeType: data.challengeType,
      individualFee: data.individualFee,
      totalStake: data.totalStake,
      title: data.title,
      description: data.description || null,
      status: data.status || "open",
      acceptingTeamId: data.acceptingTeamId || null,
      challengePoolId: data.challengePoolId || null,
      winnerId: data.winnerId || null,
      completedAt: data.completedAt || null,
      expiresAt: data.expiresAt || null,
      requiresProMembership: data.requiresProMembership ?? true,
      operatorId: data.operatorId,
      createdAt: new Date(),
    };
    this.teamChallenges.set(challenge.id, challenge);
    return challenge;
  }

  async updateTeamChallenge(id: string, updates: Partial<TeamChallenge>): Promise<TeamChallenge | undefined> {
    const challenge = this.teamChallenges.get(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { ...challenge, ...updates };
    this.teamChallenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async acceptTeamChallenge(challengeId: string, acceptingTeamId: string): Promise<TeamChallenge | undefined> {
    const challenge = this.teamChallenges.get(challengeId);
    if (!challenge || challenge.status !== "open") return undefined;
    
    const updatedChallenge = { 
      ...challenge, 
      acceptingTeamId,
      status: "accepted" as const
    };
    this.teamChallenges.set(challengeId, updatedChallenge);
    return updatedChallenge;
  }

  async getTeamChallengeParticipant(id: string): Promise<TeamChallengeParticipant | undefined> {
    return this.teamChallengeParticipants.get(id);
  }

  async getTeamChallengeParticipantsByChallenge(challengeId: string): Promise<TeamChallengeParticipant[]> {
    return Array.from(this.teamChallengeParticipants.values()).filter(participant => 
      participant.teamChallengeId === challengeId
    );
  }

  async createTeamChallengeParticipant(data: InsertTeamChallengeParticipant): Promise<TeamChallengeParticipant> {
    const participant: TeamChallengeParticipant = {
      id: randomUUID(),
      teamChallengeId: data.teamChallengeId,
      teamId: data.teamId,
      playerId: data.playerId,
      feeContribution: data.feeContribution,
      hasPaid: data.hasPaid || false,
      membershipTier: data.membershipTier,
      createdAt: new Date(),
    };
    this.teamChallengeParticipants.set(participant.id, participant);
    return participant;
  }

  async updateTeamChallengeParticipant(id: string, updates: Partial<TeamChallengeParticipant>): Promise<TeamChallengeParticipant | undefined> {
    const participant = this.teamChallengeParticipants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...updates };
    this.teamChallengeParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  // Team Challenge Business Logic Methods
  calculateTeamChallengeStake(challengeType: string, individualFee: number): number {
    const teamSize = this.getTeamSizeFromChallengeType(challengeType);
    return individualFee * teamSize;
  }

  private getTeamSizeFromChallengeType(challengeType: string): number {
    switch (challengeType) {
      case "2man_army": return 2;
      case "3man_crew": return 3;
      case "5man_squad": return 5;
      default: throw new Error(`Unknown challenge type: ${challengeType}`);
    }
  }

  async validateProMembership(playerId: string): Promise<boolean> {
    const player = this.players.get(playerId);
    return player?.membershipTier === "pro";
  }

  async createTeamChallengeWithParticipants(
    challengeData: InsertTeamChallenge, 
    teamPlayers: string[]
  ): Promise<{ challenge: TeamChallenge; participants: TeamChallengeParticipant[] }> {
    // Validate Pro membership for all players
    for (const playerId of teamPlayers) {
      const isProMember = await this.validateProMembership(playerId);
      if (!isProMember) {
        throw new Error(`Player ${playerId} does not have Pro membership required for team challenges`);
      }
    }

    // Calculate total stake
    const totalStake = this.calculateTeamChallengeStake(challengeData.challengeType, challengeData.individualFee);
    
    // Create the challenge
    const challenge = await this.createTeamChallenge({
      ...challengeData,
      totalStake,
    });

    // Create participants
    const participants: TeamChallengeParticipant[] = [];
    for (const playerId of teamPlayers) {
      const player = this.players.get(playerId);
      if (!player) throw new Error(`Player ${playerId} not found`);
      
      const participant = await this.createTeamChallengeParticipant({
        teamChallengeId: challenge.id,
        teamId: challengeData.challengingTeamId,
        playerId,
        feeContribution: challengeData.individualFee,
        membershipTier: player.membershipTier || "none",
      });
      participants.push(participant);
    }

    return { challenge, participants };
  }

  // === SPORTSMANSHIP VOTE-OUT SYSTEM IMPLEMENTATION ===

  // Check-in management
  async checkinUser(data: InsertCheckin): Promise<Checkin> {
    const checkin: Checkin = {
      id: randomUUID(),
      userId: data.userId,
      venueId: data.venueId,
      sessionId: data.sessionId,
      role: data.role,
      verified: data.verified || false,
      createdAt: new Date(),
    };
    this.checkins.set(checkin.id, checkin);
    return checkin;
  }

  async getCheckinsBySession(sessionId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(checkin => 
      checkin.sessionId === sessionId
    );
  }

  async getCheckinsByVenue(venueId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(checkin => 
      checkin.venueId === venueId
    );
  }

  async getActiveCheckins(sessionId: string, venueId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(checkin => 
      checkin.sessionId === sessionId && checkin.venueId === venueId
    );
  }

  // Vote management
  async createAttitudeVote(data: InsertAttitudeVote): Promise<AttitudeVote> {
    const vote: AttitudeVote = {
      id: randomUUID(),
      targetUserId: data.targetUserId,
      sessionId: data.sessionId,
      venueId: data.venueId,
      status: data.status || "open",
      startedAt: new Date(),
      endsAt: data.endsAt,
      quorumRequired: data.quorumRequired,
      thresholdRequired: data.thresholdRequired,
      result: data.result,
      createdBy: data.createdBy,
    };
    this.attitudeVotes.set(vote.id, vote);
    return vote;
  }

  async getAttitudeVote(id: string): Promise<AttitudeVote | undefined> {
    return this.attitudeVotes.get(id);
  }

  async getActiveVotes(sessionId: string, venueId: string): Promise<AttitudeVote[]> {
    return Array.from(this.attitudeVotes.values()).filter(vote => 
      vote.sessionId === sessionId && 
      vote.venueId === venueId && 
      vote.status === "open"
    );
  }

  async updateAttitudeVote(id: string, updates: Partial<AttitudeVote>): Promise<AttitudeVote | undefined> {
    const vote = this.attitudeVotes.get(id);
    if (!vote) return undefined;
    
    const updatedVote = { ...vote, ...updates };
    this.attitudeVotes.set(id, updatedVote);
    return updatedVote;
  }

  async closeAttitudeVote(id: string, result: string): Promise<AttitudeVote | undefined> {
    return this.updateAttitudeVote(id, { status: "closed", result });
  }

  // Ballot management
  async createAttitudeBallot(data: InsertAttitudeBallot): Promise<AttitudeBallot> {
    const ballot: AttitudeBallot = {
      id: randomUUID(),
      voteId: data.voteId,
      voterUserId: data.voterUserId,
      weight: data.weight,
      choice: data.choice,
      tags: data.tags,
      note: data.note,
      createdAt: new Date(),
    };
    this.attitudeBallots.set(ballot.id, ballot);
    return ballot;
  }

  async getBallotsByVote(voteId: string): Promise<AttitudeBallot[]> {
    return Array.from(this.attitudeBallots.values()).filter(ballot => 
      ballot.voteId === voteId
    );
  }

  async hasUserVoted(voteId: string, userId: string): Promise<boolean> {
    return Array.from(this.attitudeBallots.values()).some(ballot => 
      ballot.voteId === voteId && ballot.voterUserId === userId
    );
  }

  // Vote calculation utilities
  async calculateVoteWeights(voteId: string): Promise<{ totalWeight: number; outWeight: number; keepWeight: number }> {
    const ballots = await this.getBallotsByVote(voteId);
    
    let outWeight = 0;
    let keepWeight = 0;
    
    for (const ballot of ballots) {
      if (ballot.choice === "out") {
        outWeight += ballot.weight;
      } else if (ballot.choice === "keep") {
        keepWeight += ballot.weight;
      }
    }
    
    return {
      totalWeight: outWeight + keepWeight,
      outWeight,
      keepWeight
    };
  }

  async checkVoteQuorum(voteId: string): Promise<boolean> {
    const vote = await this.getAttitudeVote(voteId);
    if (!vote) return false;
    
    const { totalWeight } = await this.calculateVoteWeights(voteId);
    return totalWeight >= vote.quorumRequired;
  }

  // Incident management
  async createIncident(data: InsertIncident): Promise<Incident> {
    const incident: Incident = {
      id: randomUUID(),
      userId: data.userId,
      sessionId: data.sessionId,
      venueId: data.venueId,
      type: data.type,
      details: data.details,
      consequence: data.consequence,
      pointsPenalty: data.pointsPenalty || 0,
      creditsFine: data.creditsFine || 0,
      createdBy: data.createdBy,
      voteId: data.voteId,
      createdAt: new Date(),
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  async getIncidentsByUser(userId: string): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(incident => 
      incident.userId === userId
    );
  }

  async getRecentIncidents(venueId: string, hours: number): Promise<Incident[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.incidents.values()).filter(incident => 
      incident.venueId === venueId && 
      incident.createdAt >= cutoffTime
    );
  }

  // User eligibility and cooldowns
  async canUserBeVotedOn(userId: string, sessionId: string): Promise<boolean> {
    // Check for recent votes (15-minute cooldown)
    const recentVotes = Array.from(this.attitudeVotes.values()).filter(vote => 
      vote.targetUserId === userId && 
      vote.sessionId === sessionId &&
      vote.startedAt > new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    );
    
    // Can't be voted on if there was a recent vote
    if (recentVotes.length > 0) return false;
    
    // Check if user was already ejected tonight
    const todayIncidents = Array.from(this.incidents.values()).filter(incident => 
      incident.userId === userId &&
      incident.type === "ejection" &&
      incident.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );
    
    return todayIncidents.length === 0;
  }

  async getLastVoteForUser(userId: string, sessionId: string): Promise<AttitudeVote | undefined> {
    const userVotes = Array.from(this.attitudeVotes.values())
      .filter(vote => vote.targetUserId === userId && vote.sessionId === sessionId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    return userVotes[0];
  }

  async isUserImmune(userId: string, sessionId: string): Promise<boolean> {
    // Check if user is currently shooting in an active match
    // For now, implement basic logic - can be enhanced with actual match state
    const activeMatches = Array.from(this.matches.values()).filter(match => 
      (match.player1 === userId || match.player2 === userId) && 
      match.status === "in_progress"
    );
    
    // If user is in an active match, they have immunity (during their turn)
    // This is a simplified implementation - real implementation would check whose turn it is
    return activeMatches.length > 0;
  }

  // === MATCH DIVISION SYSTEM IMPLEMENTATION ===

  // Match Division management
  async createMatchDivision(data: InsertMatchDivision): Promise<MatchDivision> {
    const division: MatchDivision = {
      id: randomUUID(),
      name: data.name,
      displayName: data.displayName,
      minTeamSize: data.minTeamSize,
      maxTeamSize: data.maxTeamSize,
      entryFeeMin: data.entryFeeMin,
      entryFeeMax: data.entryFeeMax,
      requiresStreaming: data.requiresStreaming || false,
      requiresCaptain: data.requiresCaptain || false,
      allowsSideBets: data.allowsSideBets || false,
      description: data.description,
      active: data.active ?? true,
      createdAt: new Date(),
    };
    this.matchDivisions.set(division.id, division);
    return division;
  }

  async getMatchDivisions(): Promise<MatchDivision[]> {
    return Array.from(this.matchDivisions.values()).filter(d => d.active);
  }

  async getMatchDivision(id: string): Promise<MatchDivision | undefined> {
    return this.matchDivisions.get(id);
  }

  async getMatchDivisionByName(name: string): Promise<MatchDivision | undefined> {
    return Array.from(this.matchDivisions.values()).find(d => d.name === name && d.active);
  }

  // Operator Tier management
  async createOperatorTier(data: InsertOperatorTier): Promise<OperatorTier> {
    const tier: OperatorTier = {
      id: randomUUID(),
      name: data.name,
      displayName: data.displayName,
      monthlyFee: data.monthlyFee,
      revenueSplitPercent: data.revenueSplitPercent,
      maxTeams: data.maxTeams,
      hasPromoTools: data.hasPromoTools || false,
      hasLiveStreamBonus: data.hasLiveStreamBonus || false,
      hasResellRights: data.hasResellRights || false,
      description: data.description,
      features: data.features || [],
      active: data.active ?? true,
      createdAt: new Date(),
    };
    this.operatorTiers.set(tier.id, tier);
    return tier;
  }

  async getOperatorTiers(): Promise<OperatorTier[]> {
    return Array.from(this.operatorTiers.values()).filter(t => t.active);
  }

  async getOperatorTier(id: string): Promise<OperatorTier | undefined> {
    return this.operatorTiers.get(id);
  }

  async getOperatorTierByName(name: string): Promise<OperatorTier | undefined> {
    return Array.from(this.operatorTiers.values()).find(t => t.name === name && t.active);
  }

  // Team Stripe Connect Account management
  async createTeamStripeAccount(data: InsertTeamStripeAccount): Promise<TeamStripeAccount> {
    const account: TeamStripeAccount = {
      id: randomUUID(),
      teamId: data.teamId,
      stripeAccountId: data.stripeAccountId,
      accountStatus: data.accountStatus || "pending",
      onboardingCompleted: data.onboardingCompleted || false,
      detailsSubmitted: data.detailsSubmitted || false,
      payoutsEnabled: data.payoutsEnabled || false,
      chargesEnabled: data.chargesEnabled || false,
      businessType: data.businessType,
      country: data.country || "US",
      email: data.email,
      lastOnboardingRefresh: data.lastOnboardingRefresh,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teamStripeAccounts.set(account.id, account);
    return account;
  }

  async getTeamStripeAccount(teamId: string): Promise<TeamStripeAccount | undefined> {
    return Array.from(this.teamStripeAccounts.values()).find(a => a.teamId === teamId);
  }

  async updateTeamStripeAccount(teamId: string, updates: Partial<TeamStripeAccount>): Promise<TeamStripeAccount | undefined> {
    const account = await this.getTeamStripeAccount(teamId);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
    this.teamStripeAccounts.set(account.id, updatedAccount);
    return updatedAccount;
  }

  // Match Entry management
  async createMatchEntry(data: InsertMatchEntry): Promise<MatchEntry> {
    const entry: MatchEntry = {
      id: randomUUID(),
      matchId: data.matchId,
      divisionId: data.divisionId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      entryFeePerPlayer: data.entryFeePerPlayer,
      totalStake: data.totalStake,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      paymentStatus: data.paymentStatus || "pending",
      matchStatus: data.matchStatus || "open",
      winnerId: data.winnerId,
      homeScore: data.homeScore || 0,
      awayScore: data.awayScore || 0,
      scheduledAt: data.scheduledAt,
      completedAt: data.completedAt,
      venueId: data.venueId,
      streamUrl: data.streamUrl,
      captainHomeId: data.captainHomeId,
      captainAwayId: data.captainAwayId,
      operatorId: data.operatorId,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matchEntries.set(entry.id, entry);
    return entry;
  }

  async getMatchEntry(id: string): Promise<MatchEntry | undefined> {
    return this.matchEntries.get(id);
  }

  async getMatchEntryByMatchId(matchId: string): Promise<MatchEntry | undefined> {
    return Array.from(this.matchEntries.values()).find(e => e.matchId === matchId);
  }

  async getMatchEntriesByDivision(divisionId: string): Promise<MatchEntry[]> {
    return Array.from(this.matchEntries.values()).filter(e => e.divisionId === divisionId);
  }

  async updateMatchEntry(id: string, updates: Partial<MatchEntry>): Promise<MatchEntry | undefined> {
    const entry = this.matchEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date() };
    this.matchEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Payout Distribution management
  async createPayoutDistribution(data: InsertPayoutDistribution): Promise<PayoutDistribution> {
    const payout: PayoutDistribution = {
      id: randomUUID(),
      matchEntryId: data.matchEntryId,
      winningTeamId: data.winningTeamId,
      totalPayout: data.totalPayout,
      platformFee: data.platformFee,
      operatorFee: data.operatorFee,
      teamPayout: data.teamPayout,
      stripeTransferId: data.stripeTransferId,
      transferStatus: data.transferStatus || "pending",
      transferredAt: data.transferredAt,
      operatorTierAtPayout: data.operatorTierAtPayout,
      revenueSplitAtPayout: data.revenueSplitAtPayout,
      payoutMethod: data.payoutMethod || "stripe_transfer",
      notes: data.notes,
      createdAt: new Date(),
    };
    this.payoutDistributions.set(payout.id, payout);
    return payout;
  }

  async getPayoutDistribution(id: string): Promise<PayoutDistribution | undefined> {
    return this.payoutDistributions.get(id);
  }

  async getPayoutByMatchEntry(matchEntryId: string): Promise<PayoutDistribution | undefined> {
    return Array.from(this.payoutDistributions.values()).find(p => p.matchEntryId === matchEntryId);
  }

  async updatePayoutDistribution(id: string, updates: Partial<PayoutDistribution>): Promise<PayoutDistribution | undefined> {
    const payout = this.payoutDistributions.get(id);
    if (!payout) return undefined;

    const updatedPayout = { ...payout, ...updates };
    this.payoutDistributions.set(id, updatedPayout);
    return updatedPayout;
  }

  // Team Registration management
  async createTeamRegistration(data: InsertTeamRegistration): Promise<TeamRegistration> {
    const registration: TeamRegistration = {
      id: randomUUID(),
      teamId: data.teamId,
      divisionId: data.divisionId,
      captainId: data.captainId,
      teamName: data.teamName,
      logoUrl: data.logoUrl,
      playerRoster: data.playerRoster || [],
      entryFeePaid: data.entryFeePaid || false,
      stripePaymentIntentId: data.stripePaymentIntentId,
      registrationStatus: data.registrationStatus || "pending",
      confirmedAt: data.confirmedAt,
      bracketPosition: data.bracketPosition,
      seedRank: data.seedRank,
      operatorId: data.operatorId,
      venueId: data.venueId,
      seasonId: data.seasonId,
      metadata: data.metadata,
      createdAt: new Date(),
    };
    this.teamRegistrations.set(registration.id, registration);
    return registration;
  }

  async getTeamRegistration(id: string): Promise<TeamRegistration | undefined> {
    return this.teamRegistrations.get(id);
  }

  async getTeamRegistrationsByDivision(divisionId: string): Promise<TeamRegistration[]> {
    return Array.from(this.teamRegistrations.values()).filter(r => r.divisionId === divisionId);
  }

  async updateTeamRegistration(id: string, updates: Partial<TeamRegistration>): Promise<TeamRegistration | undefined> {
    const registration = this.teamRegistrations.get(id);
    if (!registration) return undefined;

    const updatedRegistration = { ...registration, ...updates };
    this.teamRegistrations.set(id, updatedRegistration);
    return updatedRegistration;
  }

  // === FILE UPLOAD TRACKING METHODS ===

  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getUploadedFileByPath(objectPath: string): Promise<UploadedFile | undefined> {
    return Array.from(this.uploadedFiles.values()).find(file => file.objectPath === objectPath);
  }

  async getUserUploadedFiles(userId: string, category?: string): Promise<UploadedFile[]> {
    const userFiles = Array.from(this.uploadedFiles.values()).filter(file => 
      file.userId === userId && file.isActive
    );
    
    if (category) {
      return userFiles.filter(file => file.category === category);
    }
    
    return userFiles;
  }

  async getAllUploadedFiles(): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values()).filter(file => file.isActive);
  }

  async createUploadedFile(data: InsertUploadedFile): Promise<UploadedFile> {
    const file: UploadedFile = {
      id: randomUUID(),
      userId: data.userId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      objectPath: data.objectPath,
      category: data.category || "general",
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      uploadedAt: new Date(),
      downloadCount: 0,
      isActive: true,
    };
    this.uploadedFiles.set(file.id, file);
    return file;
  }

  async updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined> {
    const file = this.uploadedFiles.get(id);
    if (!file) return undefined;

    const updatedFile = { ...file, ...updates };
    this.uploadedFiles.set(id, updatedFile);
    return updatedFile;
  }

  async deleteUploadedFile(id: string): Promise<boolean> {
    const file = this.uploadedFiles.get(id);
    if (!file) return false;

    // Soft delete by setting isActive to false
    const updatedFile = { ...file, isActive: false };
    this.uploadedFiles.set(id, updatedFile);
    return true;
  }

  async incrementFileDownloadCount(id: string): Promise<void> {
    const file = this.uploadedFiles.get(id);
    if (!file) return;

    const updatedFile = { ...file, downloadCount: (file.downloadCount || 0) + 1 };
    this.uploadedFiles.set(id, updatedFile);
  }

  // === FILE SHARING METHODS ===

  async getFileShare(id: string): Promise<FileShare | undefined> {
    return this.fileShares.get(id);
  }

  async getFileShares(fileId: string): Promise<FileShare[]> {
    return Array.from(this.fileShares.values()).filter(share => 
      share.fileId === fileId && share.isActive
    );
  }

  async getUserSharedFiles(userId: string): Promise<FileShare[]> {
    return Array.from(this.fileShares.values()).filter(share => 
      share.sharedWithUserId === userId && share.isActive
    );
  }

  async createFileShare(data: InsertFileShare): Promise<FileShare> {
    const share: FileShare = {
      id: randomUUID(),
      fileId: data.fileId,
      sharedWithUserId: data.sharedWithUserId,
      sharedWithRole: data.sharedWithRole,
      sharedWithHallId: data.sharedWithHallId,
      permissions: data.permissions || "read",
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      isActive: true,
    };
    this.fileShares.set(share.id, share);
    return share;
  }

  async updateFileShare(id: string, updates: Partial<FileShare>): Promise<FileShare | undefined> {
    const share = this.fileShares.get(id);
    if (!share) return undefined;

    const updatedShare = { ...share, ...updates };
    this.fileShares.set(id, updatedShare);
    return updatedShare;
  }

  async deleteFileShare(id: string): Promise<boolean> {
    const share = this.fileShares.get(id);
    if (!share) return false;

    // Soft delete by setting isActive to false
    const updatedShare = { ...share, isActive: false };
    this.fileShares.set(id, updatedShare);
    return true;
  }
}

export const storage = new MemStorage();
