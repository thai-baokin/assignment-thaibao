import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PUT /api/tasks/[id] - Cập nhật task theo ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    // Kiểm tra task có tồn tại không
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần cập nhật." },
        { status: 404 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi cập nhật task:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật công việc. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Xóa task theo ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần xóa." },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Đã xóa công việc thành công.", id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi xóa task:", error);
    return NextResponse.json(
      { error: "Không thể xóa công việc. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
