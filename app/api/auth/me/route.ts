import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { user: null },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { user },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng hiện tại:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
