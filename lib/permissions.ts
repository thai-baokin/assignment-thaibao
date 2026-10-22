import prisma from "./prisma";

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

/**
 * Lấy vai trò của người dùng trong một nhóm
 */
export async function getUserTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return null;
  if (team.ownerId === userId) return "OWNER";
  const member = team.members.find((m) => m.userId === userId);
  if (!member) return null;
  const role = (member.role || "MEMBER").toUpperCase();
  if (role === "ADMIN") return "ADMIN";
  if (role === "OWNER") return "OWNER";
  return "MEMBER";
}

/**
 * Owner: Full quyền (quản lý thành viên, đổi role, xóa team, xóa bất kỳ task nào)
 */
export function isOwner(role: TeamRole | null): boolean {
  return role === "OWNER";
}

/**
 * Admin: Quản lý thành viên & tất cả task, nhưng KHÔNG được xóa team
 */
export function isAdmin(role: TeamRole | null): boolean {
  return role === "ADMIN";
}

/**
 * Owner hoặc Admin
 */
export function isOwnerOrAdmin(role: TeamRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Quyền thêm thành viên vào nhóm (Owner và Admin đều có quyền)
 */
export function canAddMembers(role: TeamRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Quyền thay đổi vai trò thành viên (Chỉ Owner mới có quyền đổi vai trò)
 */
export function canChangeMemberRole(role: TeamRole | null): boolean {
  return role === "OWNER";
}

/**
 * Quyền xóa/kick thành viên khỏi nhóm:
 * - Owner: xóa bất kỳ ai trừ chính mình
 * - Admin: chỉ được xóa Member thường (không được xóa Owner hoặc Admin khác)
 * - Member: chỉ được tự rời nhóm
 */
export function canRemoveMember(
  actorRole: TeamRole | null,
  targetRole: TeamRole | null,
  isSelf: boolean
): boolean {
  if (isSelf) return true; // Ai cũng có quyền tự rời nhóm
  if (actorRole === "OWNER") {
    return targetRole !== "OWNER"; // Owner xóa được tất cả mọi người khác
  }
  if (actorRole === "ADMIN") {
    return targetRole === "MEMBER"; // Admin chỉ được xóa Member
  }
  return false;
}

/**
 * Quyền xóa nhóm (Chỉ duy nhất Owner)
 */
export function canDeleteTeam(role: TeamRole | null): boolean {
  return role === "OWNER";
}

/**
 * Quyền chỉnh sửa thông tin nhóm (Tên, mô tả: Owner và Admin)
 */
export function canEditTeam(role: TeamRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Quyền quản lý/chỉnh sửa tất cả task trong nhóm:
 * - Owner & Admin: quản lý tất cả task
 * - Member: quản lý task do mình tạo hoặc được phân công cho mình
 */
export function canManageTask(
  role: TeamRole | null,
  isCreator: boolean,
  isAssignee: boolean
): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  return isCreator || isAssignee;
}

/**
 * Quyền xóa task:
 * - Owner & Admin: có quyền xóa bất kỳ task nào trong nhóm
 * - Member: chỉ được xóa task do mình tạo hoặc được phân công cho mình
 */
export function canDeleteTask(
  role: TeamRole | null,
  isCreator: boolean,
  isAssignee: boolean
): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  return isCreator || isAssignee;
}

