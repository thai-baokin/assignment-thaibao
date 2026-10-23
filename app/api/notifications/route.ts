import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/notifications - Lấy thông báo của người dùng hiện tại
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: session.userId, read: false },
      }),
    ]);

    // Bổ sung targetUrl động để khi click chuyển thẳng đến đúng nhóm và task
    const plainIds = notifications
      .map((n) => n.relatedId)
      .filter((id): id is string => Boolean(id && !id.includes("?") && !id.startsWith("/")));

    const taskMap = new Map<string, { id: string; teamId: string | null }>();
    if (plainIds.length > 0) {
      const matchedTasks = await prisma.task.findMany({
        where: { id: { in: plainIds } },
        select: { id: true, teamId: true },
      });
      matchedTasks.forEach((t) => taskMap.set(t.id, t));
    }

    const enrichedNotifications = notifications.map((n) => {
      let targetUrl = "/teams";
      if (n.relatedId) {
        if (n.relatedId.startsWith("/teams")) {
          targetUrl = n.relatedId;
        } else if (n.relatedId.includes("?")) {
          targetUrl = `/teams/${n.relatedId}`;
        } else if (taskMap.has(n.relatedId)) {
          const t = taskMap.get(n.relatedId)!;
          targetUrl = t.teamId ? `/teams/${t.teamId}?taskId=${t.id}` : "/teams";
        } else {
          targetUrl = `/teams/${n.relatedId}`;
        }
      }
      return {
        ...n,
        targetUrl,
      };
    });

    return NextResponse.json({ notifications: enrichedNotifications, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// PUT /api/notifications - Đánh dấu tất cả đã đọc
export async function PUT() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: "Đã đánh dấu tất cả đã đọc." }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi đánh dấu thông báo:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
