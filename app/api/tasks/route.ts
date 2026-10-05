import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/tasks - Lấy toàn bộ danh sách tasks (sắp xếp mới nhất lên đầu)
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Lỗi khi lấy danh sách tasks:", error);
    return NextResponse.json(
      { error: `Lỗi kết nối cơ sở dữ liệu: ${errorMsg}` },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Tạo task mới
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    const body = await request.json();
    const { title, description, status, priority, dueDate, teamId, assigneeId } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Tiêu đề công việc (title) là bắt buộc." },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: teamId || null,
        creatorId: session?.userId || null,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo task:", error);
    return NextResponse.json(
      { error: "Không thể tạo công việc. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
