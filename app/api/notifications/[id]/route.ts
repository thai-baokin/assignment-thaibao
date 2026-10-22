import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/notifications/[id] - Đánh dấu một thông báo đã đọc
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
    }

    if (notification.userId !== session.userId) {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi đánh dấu thông báo:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
