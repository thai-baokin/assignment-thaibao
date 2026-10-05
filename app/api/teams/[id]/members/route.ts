import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/:id/members - Thêm thành viên vào nhóm bằng email (Chỉ Owner)
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

    // Chỉ Owner mới được quyền thêm thành viên
    if (team.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Chỉ Trưởng nhóm (Owner) mới có quyền thêm thành viên." },
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
    const isAlreadyMember = team.members.some((m) => m.userId === targetUser.id);
    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "Người dùng này đã là thành viên trong nhóm." },
        { status: 400 }
      );
    }

    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        role: role.toUpperCase() === "OWNER" ? "OWNER" : "MEMBER",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi thêm thành viên." }, { status: 500 });
  }
}
