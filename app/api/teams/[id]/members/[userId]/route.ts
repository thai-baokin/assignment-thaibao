import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getUserTeamRole, canChangeMemberRole, canRemoveMember } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { broadcastRealtime, teamMembersTopic } from "@/lib/realtime-broadcast";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

// PATCH /api/teams/:id/members/:userId - Thay đổi vai trò thành viên (Chỉ Owner)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId, userId: targetUserId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    // Kiểm tra quyền: Chỉ Owner mới có quyền thay đổi vai trò
    const actorRole = await getUserTeamRole(session.userId, teamId);
    if (!canChangeMemberRole(actorRole)) {
      return NextResponse.json(
        { error: "Chỉ Trưởng nhóm (Owner) mới có quyền thay đổi vai trò thành viên." },
        { status: 403 }
      );
    }

    // Không thể thay đổi vai trò của chính Owner nhóm
    if (team.ownerId === targetUserId) {
      return NextResponse.json(
        { error: "Không thể thay đổi vai trò của Trưởng nhóm (Owner)." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    const normalizedRole = typeof role === "string" ? role.toUpperCase() : "";
    if (normalizedRole !== "ADMIN" && normalizedRole !== "MEMBER") {
      return NextResponse.json(
        { error: "Vai trò không hợp lệ. Chỉ chấp nhận ADMIN hoặc MEMBER." },
        { status: 400 }
      );
    }

    const memberRecord = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Thành viên không tồn tại trong nhóm này." },
        { status: 404 }
      );
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberRecord.id },
      data: { role: normalizedRole },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      teamId,
      userId: session.userId,
      action: "MEMBER_ROLE_CHANGED",
      detail: `đã đổi vai trò của ${updated.user.name || updated.user.email} thành ${normalizedRole}`,
    });

    await broadcastRealtime(teamMembersTopic(teamId), "member-updated", {
      teamId,
      action: "role-changed",
      userId: targetUserId,
      role: normalizedRole,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò thành viên:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi cập nhật vai trò." }, { status: 500 });
  }
}

// DELETE /api/teams/:id/members/:userId - Xóa thành viên khỏi nhóm (Owner, Admin, hoặc tự rời nhóm)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId, userId: targetUserId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    const isSelf = session.userId === targetUserId;

    // Owner không thể tự xóa chính mình bằng API này (phải xóa team)
    if (team.ownerId === targetUserId) {
      return NextResponse.json(
        { error: "Trưởng nhóm không thể tự xóa mình khỏi nhóm. Hãy xóa toàn bộ nhóm nếu muốn giải tán nhóm." },
        { status: 400 }
      );
    }

    const memberRecord = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: "Thành viên không tồn tại trong nhóm này." },
        { status: 404 }
      );
    }

    const actorRole = await getUserTeamRole(session.userId, teamId);
    const targetRole = (memberRecord.role || "MEMBER").toUpperCase() as "OWNER" | "ADMIN" | "MEMBER";

    // Kiểm tra quyền xóa theo RBAC
    if (!canRemoveMember(actorRole, targetRole, isSelf)) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa thành viên này khỏi nhóm." },
        { status: 403 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: memberRecord.id },
    });

    // Bỏ gán (unassign) các task trong team đang gán cho thành viên bị xóa
    await prisma.task.updateMany({
      where: {
        teamId,
        assigneeId: targetUserId,
      },
      data: {
        assigneeId: null,
      },
    });

    await logActivity({
      teamId,
      userId: session.userId,
      action: isSelf ? "MEMBER_LEFT" : "MEMBER_REMOVED",
      detail: isSelf
        ? "đã rời khỏi nhóm"
        : `đã xóa ${memberRecord.user.name || memberRecord.user.email} khỏi nhóm`,
    });

    await broadcastRealtime(teamMembersTopic(teamId), "member-updated", {
      teamId,
      action: "removed",
      userId: targetUserId,
    });

    return NextResponse.json(
      { message: isSelf ? "Bạn đã rời khỏi nhóm." : "Đã xóa thành viên khỏi nhóm thành công." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi xóa thành viên:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi xóa thành viên." }, { status: 500 });
  }
}

