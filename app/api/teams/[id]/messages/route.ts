import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id/messages - Lấy lịch sử tin nhắn của nhóm
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
        { error: "Bạn không có quyền truy cập nhóm này." },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { teamId },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// POST /api/teams/:id/messages - Gửi tin nhắn trong nhóm
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Nội dung tin nhắn không được để trống." }, { status: 400 });
    }

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
        { error: "Bạn không có quyền gửi tin nhắn trong nhóm này." },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        teamId,
        senderId: session.userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
