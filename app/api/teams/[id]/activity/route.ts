import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id/activity - Lịch sử hoạt động của nhóm (thành viên nhóm)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: session.userId },
          select: { id: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    const isMember = team.members.length > 0;
    const isOwner = team.ownerId === session.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "Bạn không có quyền xem hoạt động của nhóm này." },
        { status: 403 }
      );
    }

    const activities = await prisma.activityLog.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(activities, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy hoạt động nhóm:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
