import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

// DELETE /api/teams/:id/members/:userId - Xóa thành viên khỏi nhóm (Owner hoặc thành viên tự rời nhóm)
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

    const isOwner = team.ownerId === session.userId;
    const isSelf = session.userId === targetUserId;

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa thành viên này khỏi nhóm." },
        { status: 403 }
      );
    }

    // Owner không thể tự xóa chính mình bằng API này (phải xóa team hoặc chuyển quyền)
    if (team.ownerId === targetUserId) {
      return NextResponse.json(
        { error: "Trưởng nhóm không thể tự xóa mình khỏi nhóm. Hãy xóa toàn bộ nhóm nếu muốn." },
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

    return NextResponse.json(
      { message: isSelf ? "Bạn đã rời khỏi nhóm." : "Đã xóa thành viên khỏi nhóm thành công." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi xóa thành viên:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi xóa thành viên." }, { status: 500 });
  }
}
