import { File } from "@google-cloud/storage";
import { storage } from "../storage";
import type { GlobalRole } from "@shared/schema";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// Action Ladder specific access group types
export enum ObjectAccessGroupType {
  USER_LIST = "USER_LIST",           // Specific list of user IDs
  EMAIL_DOMAIN = "EMAIL_DOMAIN",     // Users with email in specific domain
  ROLE_GROUP = "ROLE_GROUP",         // Users with specific global role (OWNER, STAFF, OPERATOR, PLAYER)
  HALL_MEMBERS = "HALL_MEMBERS",     // Members of a specific pool hall
  TOURNAMENT_PARTICIPANTS = "TOURNAMENT_PARTICIPANTS", // Participants in a tournament
}

// The logic user group that can access the object.
export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string; // The identifier for the group (role name, hall ID, tournament ID, etc.)
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

// The ACL policy of the object.
export interface ObjectAclPolicy {
  owner: string; // User ID who owns the file
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// Check if the requested permission is allowed based on the granted permission.
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  // Users granted with read or write permissions can read the object.
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }

  // Only users granted with write permissions can write the object.
  return granted === ObjectPermission.WRITE;
}

// The base class for all access groups.
abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  // Check if the user is a member of the group.
  public abstract hasMember(userId: string): Promise<boolean>;
}

// Implementation for user list access group
class UserListAccessGroup extends BaseObjectAccessGroup {
  async hasMember(userId: string): Promise<boolean> {
    // For now, treat the ID as a comma-separated list of user IDs
    const userIds = this.id.split(',').map(id => id.trim());
    return userIds.includes(userId);
  }
}

// Implementation for email domain access group  
class EmailDomainAccessGroup extends BaseObjectAccessGroup {
  async hasMember(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) return false;
      
      const userDomain = user.email.split('@')[1];
      return userDomain === this.id;
    } catch (error) {
      console.error('Error checking email domain membership:', error);
      return false;
    }
  }
}

// Implementation for role-based access group
class RoleGroupAccessGroup extends BaseObjectAccessGroup {
  async hasMember(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.globalRole) return false;
      
      return user.globalRole === this.id;
    } catch (error) {
      console.error('Error checking role membership:', error);
      return false;
    }
  }
}

// Implementation for hall members access group
class HallMembersAccessGroup extends BaseObjectAccessGroup {
  async hasMember(userId: string): Promise<boolean> {
    try {
      // Check if user is associated with the hall
      const user = await storage.getUser(userId);
      if (!user) return false;
      
      // For operators, check if they have permission to manage this hall
      // This is a security-critical check - operators should only access halls they control
      if (user.globalRole === "OPERATOR") {
        // For now, implement a conservative approach: operators need explicit roster membership
        // or should be granted access through other ACL rules
        // TODO: Implement proper operator-hall ownership verification when the relationship is clarified
        console.warn(`Operator ${userId} attempted to access hall ${this.id} - explicit ACL rules required for operator access`);
        return false;
      }
      
      // For players, check roster membership
      const rosters = await storage.getAllHallRosters();
      return rosters.some(roster => 
        roster.hallId === this.id && 
        roster.playerId === userId && 
        roster.isActive
      );
    } catch (error) {
      console.error('Error checking hall membership:', error);
      return false;
    }
  }
}

// Implementation for tournament participants access group
class TournamentParticipantsAccessGroup extends BaseObjectAccessGroup {
  async hasMember(userId: string): Promise<boolean> {
    try {
      // Check if user is registered for the tournament
      const tournaments = await storage.getAllTournaments();
      const tournament = tournaments.find(t => t.id === this.id);
      
      if (!tournament) {
        console.warn(`Tournament ${this.id} not found for participant access check`);
        return false;
      }
      
      // TODO: Implement proper tournament participant tracking
      // This requires a tournament_participants table or similar mechanism
      // For now, return false to maintain security until proper implementation
      console.warn(`Tournament participant access for tournament ${this.id} not fully implemented - requires tournament_participants tracking`);
      return false;
    } catch (error) {
      console.error('Error checking tournament participation:', error);
      return false;
    }
  }
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    case ObjectAccessGroupType.USER_LIST:
      return new UserListAccessGroup(group.type, group.id);
    case ObjectAccessGroupType.EMAIL_DOMAIN:
      return new EmailDomainAccessGroup(group.type, group.id);
    case ObjectAccessGroupType.ROLE_GROUP:
      return new RoleGroupAccessGroup(group.type, group.id);
    case ObjectAccessGroupType.HALL_MEMBERS:
      return new HallMembersAccessGroup(group.type, group.id);
    case ObjectAccessGroupType.TOURNAMENT_PARTICIPANTS:
      return new TournamentParticipantsAccessGroup(group.type, group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// Sets the ACL policy to the object metadata.
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Gets the ACL policy from the object metadata.
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

// Checks if the user can access the object based on Action Ladder rules.
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  // Get the ACL policy for the object
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Public objects are always accessible for read without authentication
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Write access and private files require authentication
  if (!userId) {
    return false;
  }

  // The owner of the object can always access it.
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Check if user has admin privileges (OWNER or STAFF can access most files)
  try {
    const user = await storage.getUser(userId);
    if (user?.globalRole === "OWNER" || user?.globalRole === "STAFF") {
      return true;
    }
  } catch (error) {
    console.error('Error checking admin privileges:', error);
  }

  // Go through the ACL rules to check if the user has the required permission.
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}

// Helper function to create common ACL policies for Action Ladder use cases
export function createStandardAclPolicy(
  ownerId: string,
  visibility: "public" | "private",
  additionalRules?: ObjectAclRule[]
): ObjectAclPolicy {
  return {
    owner: ownerId,
    visibility,
    aclRules: additionalRules || [],
  };
}

// Helper to create role-based access rule
export function createRoleAccessRule(
  role: GlobalRole,
  permission: ObjectPermission = ObjectPermission.READ
): ObjectAclRule {
  return {
    group: {
      type: ObjectAccessGroupType.ROLE_GROUP,
      id: role,
    },
    permission,
  };
}

// Helper to create hall-based access rule
export function createHallAccessRule(
  hallId: string,
  permission: ObjectPermission = ObjectPermission.READ
): ObjectAclRule {
  return {
    group: {
      type: ObjectAccessGroupType.HALL_MEMBERS,
      id: hallId,
    },
    permission,
  };
}