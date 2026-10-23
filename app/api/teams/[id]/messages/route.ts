import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime, teamChatTopic } from "@/lib/realtime-broadcast";

export const dynamic = "force-dynamic";

const MAX_ATTACHMENT_LENGTH = 4_600_000;

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
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(messages.reverse(), { status: 200 });
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
    const content = typeof body.content === "string" ? body.content : "";
    const expectedUserId =
      typeof body.expectedUserId === "string" ? body.expectedUserId : "";
    const attachmentUrl =
      typeof body.attachmentUrl === "string" ? body.attachmentUrl : "";
    const attachmentName =
      typeof body.attachmentName === "string" ? body.attachmentName.slice(0, 255) : "";
    const attachmentType =
      typeof body.attachmentType === "string" ? body.attachmentType.slice(0, 120) : "";

    const hasAttachment = attachmentUrl.length > 0;

    if (expectedUserId && expectedUserId !== session.userId) {
      return NextResponse.json(
        {
          error:
            "Phiên đăng nhập đã thay đổi. Tin nhắn chưa được gửi, vui lòng kiểm tra tài khoản hiện tại.",
          code: "SESSION_MISMATCH",
        },
        { status: 409 }
      );
    }

    if (content.trim().length === 0 && !hasAttachment) {
      return NextResponse.json(
        { error: "Nội dung tin nhắn hoặc tệp đính kèm không được để trống." },
        { status: 400 }
      );
    }

    if (hasAttachment) {
      if (!attachmentUrl.startsWith("data:")) {
        return NextResponse.json({ error: "Tệp đính kèm không hợp lệ." }, { status: 400 });
      }
      if (attachmentUrl.length > MAX_ATTACHMENT_LENGTH) {
        return NextResponse.json(
          { error: "Tệp đính kèm quá lớn. Vui lòng chọn tệp nhỏ hơn 3.2MB." },
          { status: 413 }
        );
      }
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
        attachmentUrl: hasAttachment ? attachmentUrl : null,
        attachmentName: hasAttachment ? attachmentName || "Tệp đính kèm" : null,
        attachmentType: hasAttachment ? attachmentType || "application/octet-stream" : null,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Nếu file đính kèm lớn (vượt giới hạn 180KB của Supabase Realtime broadcast REST API),
    // gửi sự kiện new-message-large để client khác lập tức fetch tin nhắn từ DB mà không bị lỗi 413!
    if (message.attachmentUrl && message.attachmentUrl.length > 180_000) {
      await broadcastRealtime(teamChatTopic(teamId), "new-message-large", {
        id: message.id,
        teamId,
        senderId: message.senderId,
      });
    } else {
      await broadcastRealtime(teamChatTopic(teamId), "new-message", message);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
