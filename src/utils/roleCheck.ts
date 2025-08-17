// src/utils/roleCheck.ts

type User = {
  Role?: string;
  UserType?: string;
  // Add other properties you need
};

const COMMUNITY_LEADER_ROLES = ["CommunityLeader", "SystemAdmin"];

export const hasCommunityLeaderAccess = (role?: string): boolean => {
  if (!role) return false;
  return COMMUNITY_LEADER_ROLES.includes(role);
};

export const hasModerationPrivileges = (user: User | null): boolean => {
  if (!user) return false;
  return (
    user.Role === "SystemAdmin" ||
    user.Role === "CommunityLeader" ||
    user.UserType === "Admin"
  );
};