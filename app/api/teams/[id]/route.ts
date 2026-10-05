import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id - Lấy chi tiết team bao gồm thành viên và danh sách tasks
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    // Kiểm tra xem user có phải thành viên hoặc owner không
    const isMember = team.members.some((m) => m.userId === session.userId);
    const isOwner = team.ownerId === session.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập nhóm này." },
        { status: 403 }
      );
    }

    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết team:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi lấy chi tiết nhóm." }, { status: 500 });
  }
}

// PUT /api/teams/:id - Cập nhật thông tin team (Chỉ Owner)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    if (team.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Chỉ Trưởng nhóm (Owner) mới có quyền cập nhật thông tin nhóm." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Tên nhóm không được để trống." }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        description: description !== undefined ? description?.trim() || null : team.description,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedTeam, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi cập nhật team:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi cập nhật nhóm." }, { status: 500 });
  }
}

// DELETE /api/teams/:id - Xóa team (Chỉ Owner)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    if (team.ownerId !== session.userId) {
      return NextResponse.json(
        { error: "Chỉ Trưởng nhóm (Owner) mới có quyền xóa nhóm." },
        { status: 403 }
      );
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ message: "Đã xóa nhóm thành công." }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi xóa team:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi xóa nhóm." }, { status: 500 });
  }
}
