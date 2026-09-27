import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks - Lấy toàn bộ danh sách tasks (sắp xếp mới nhất lên đầu)
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tasks:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách công việc. Vui lòng kiểm tra kết nối database." },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Tạo task mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

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
