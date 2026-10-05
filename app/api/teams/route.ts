import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/teams - Lấy danh sách teams mà người dùng hiện tại thuộc về
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để xem danh sách nhóm." }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách teams:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi lấy danh sách nhóm." }, { status: 500 });
  }
}

// POST /api/teams - Tạo mới một nhóm (người tạo tự động trở thành Owner)
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để tạo nhóm." }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Tên nhóm không được để trống." }, { status: 400 });
    }

    // Tạo team và gán bản ghi TeamMember với role OWNER trong 1 transaction
    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          ownerId: session.userId,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: session.userId,
          role: "OWNER",
        },
      });

      return team;
    });

    // Lấy chi tiết team sau khi tạo kèm thông tin owner & members
    const createdTeam = await prisma.team.findUnique({
      where: { id: newTeam.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo team:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi tạo nhóm." }, { status: 500 });
  }
}
