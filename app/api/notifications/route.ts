import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/notifications - Lấy thông báo của người dùng hiện tại
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
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
