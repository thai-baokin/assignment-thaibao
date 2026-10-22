import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getUserTeamRole, canAddMembers } from "@/lib/permissions";
import { createInAppNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { broadcastRealtime, teamMembersTopic } from "@/lib/realtime-broadcast";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/:id/members - Thêm thành viên vào nhóm bằng email (Owner hoặc Admin)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    // Lấy vai trò của người gọi API
    const actorRole = await getUserTeamRole(session.userId, teamId);
    if (!canAddMembers(actorRole)) {
      return NextResponse.json(
        { error: "Chỉ Trưởng nhóm (Owner) hoặc Quản trị viên (Admin) mới có quyền thêm thành viên." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = "MEMBER" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản người dùng với email này." },
        { status: 404 }
      );
    }

    // Kiểm tra xem user này đã thuộc nhóm chưa
    const isAlreadyMember = team.members.some((m) => m.userId === targetUser.id) || team.ownerId === targetUser.id;
    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "Người dùng này đã là thành viên trong nhóm." },
        { status: 400 }
      );
    }

    // Xác định role: Chỉ Owner mới có quyền chỉ định role ADMIN khi mời
    let assignedRole = "MEMBER";
    if (role.toUpperCase() === "ADMIN" && actorRole === "OWNER") {
      assignedRole = "ADMIN";
    }

    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        role: assignedRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Tạo thông báo in-app cho người dùng được mời vào nhóm
    await createInAppNotification({
      userId: targetUser.id,
      type: "ADDED_TO_TEAM",
      title: "Tham gia nhóm mới",
      message: `Bạn đã được thêm vào nhóm "${team.name}" với vai trò ${assignedRole === "ADMIN" ? "Quản trị viên (Admin)" : "Thành viên (Member)"}.`,
      relatedId: teamId,
    });

    await logActivity({
      teamId,
      userId: session.userId,
      action: "MEMBER_ADDED",
      detail: `đã thêm ${targetUser.name || targetUser.email} vào nhóm với vai trò ${assignedRole}`,
    });

    await broadcastRealtime(teamMembersTopic(teamId), "member-updated", {
      teamId,
      action: "added",
      member: newMember,
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi thêm thành viên." }, { status: 500 });
  }
}

