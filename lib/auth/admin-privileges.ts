// ==============================================================================
// PROTON 3.0 — HIERARCHICAL ADMIN PRIVILEGES SYSTEM
// ==============================================================================
// 1. president@proton     -> Full Admin Privileges
// 2. branchcaptain@proton -> Full Admin Privileges
// 3. tech@proton          -> Full Admin Privileges
// 4. vicepresident@proton -> Restricted Admin Privileges (Member Approvals Only)
// 5. events@proton         -> Restricted Admin Privileges:
//                           - Can ONLY access Events and Gallery
//                           - NO access to members, invitations, designations, logs
// ==============================================================================

export type AdminRoleType =
  | 'president'
  | 'branch_captain'
  | 'tech_head'
  | 'vice_president'
  | 'events_manager'
  | 'super_admin';

export interface AdminPermissions {
  email: string;
  roleType: AdminRoleType;
  roleLabel: string;
  isFullAdmin: boolean;
  isSuperAdmin: boolean;
  isVicePresident: boolean;
  isEventsManager: boolean;
  canApproveMembers: boolean;
  canRevokeMembers: boolean;
  canDeleteMembers: boolean;
  canEditMembers: boolean;
  canManageEvents: boolean;
  canPublishEvents: boolean;
  canManageGallery: boolean;
  canManageDesignations: boolean;
  canManageInvitations: boolean;
  canViewAuditLogs: boolean;
}

const VALID_ADMIN_DOMAINS = new Set([
  'proton.cyber',
  'protonnmamit.com',
  'proton.nmamit.in',
  'nmamit.in',
  'proton',
]);

function isValidAdminDomain(domain: string): boolean {
  return VALID_ADMIN_DOMAINS.has(domain);
}

/**
 * Resolves permissions and scope based on the administrator's email or identity.
 * Strictly verifies local part and allowed administrative domain boundaries.
 */
export function getAdminPermissions(email?: string | null): AdminPermissions {
  const norm = (email || '').toLowerCase().trim();
  if (!norm || !norm.includes('@')) {
    return {
      email: norm,
      roleType: 'president',
      roleLabel: 'Member',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: false,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: false,
      canPublishEvents: false,
      canManageGallery: false,
      canManageDesignations: false,
      canManageInvitations: false,
      canViewAuditLogs: false,
    };
  }

  const [localPart, domain] = norm.split('@');
  if (!isValidAdminDomain(domain)) {
    return {
      email: norm,
      roleType: 'president',
      roleLabel: 'Member',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: false,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: false,
      canPublishEvents: false,
      canManageGallery: false,
      canManageDesignations: false,
      canManageInvitations: false,
      canViewAuditLogs: false,
    };
  }

  // Super Admin (Admin #0 - Master Root Administrator: admin@proton.cyber)
  const isSuper =
    localPart === 'admin' ||
    localPart === 'proton.admin' ||
    localPart === 'superadmin' ||
    localPart === 'super_admin';

  if (isSuper) {
    return {
      email: norm,
      roleType: 'super_admin',
      roleLabel: 'Super Administrator',
      isFullAdmin: true,
      isSuperAdmin: true,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  // Events & Gallery Manager (Admin #5)
  const isEvents =
    localPart === 'events' ||
    localPart === 'event' ||
    localPart === 'events.manager' ||
    localPart === 'events_manager';

  if (isEvents) {
    return {
      email: norm,
      roleType: 'events_manager',
      roleLabel: 'Events & Gallery Lead',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: true,
      canApproveMembers: false,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: true,
      canPublishEvents: false,
      canManageGallery: true,
      canManageDesignations: false,
      canManageInvitations: false,
      canViewAuditLogs: false,
    };
  }

  // Vice President (Admin #4)
  const isVP =
    localPart === 'vicepresident' ||
    localPart === 'vice_president' ||
    localPart === 'vp';

  if (isVP) {
    return {
      email: norm,
      roleType: 'vice_president',
      roleLabel: 'Vice President',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: true,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: false,
      canPublishEvents: false,
      canManageGallery: false,
      canManageDesignations: false,
      canManageInvitations: true,
      canViewAuditLogs: false,
    };
  }

  // Admin #1: President
  if (localPart === 'president') {
    return {
      email: norm,
      roleType: 'president',
      roleLabel: 'President',
      isFullAdmin: true,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  // Admin #2: Branch Captain
  if (
    localPart === 'branchcaptain' ||
    localPart === 'branch_captain' ||
    localPart === 'captain'
  ) {
    return {
      email: norm,
      roleType: 'branch_captain',
      roleLabel: 'Branch Captain',
      isFullAdmin: true,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  // Admin #3: Technical Division / Tech Team
  if (
    localPart === 'tech' ||
    localPart === 'techteam' ||
    localPart === 'tech_team' ||
    localPart === 'technical'
  ) {
    return {
      email: norm,
      roleType: 'tech_head',
      roleLabel: 'Tech Team',
      isFullAdmin: true,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  // Non-administrator (Normal Member / Unprivileged user)
  return {
    email: norm,
    roleType: 'president',
    roleLabel: 'Member',
    isFullAdmin: false,
    isSuperAdmin: false,
    isVicePresident: false,
    isEventsManager: false,
    canApproveMembers: false,
    canRevokeMembers: false,
    canDeleteMembers: false,
    canEditMembers: false,
    canManageEvents: false,
    canPublishEvents: false,
    canManageGallery: false,
    canManageDesignations: false,
    canManageInvitations: false,
    canViewAuditLogs: false,
  };
}
