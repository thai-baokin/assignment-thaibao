import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/tasks/[id] - Cập nhật task theo ID
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // Kiểm tra task có tồn tại không
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          include: { members: true },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần cập nhật." },
        { status: 404 }
      );
    }

    // Nếu task thuộc về một Team, bắt buộc phải đăng nhập và là thành viên hoặc Owner của team đó
    if (existingTask.team) {
      if (!session) {
        return NextResponse.json({ error: "Vui lòng đăng nhập để cập nhật task." }, { status: 401 });
      }

      const isMember = existingTask.team.members.some((m) => m.userId === session.userId);
      const isOwner = existingTask.team.ownerId === session.userId;

      if (!isMember && !isOwner) {
        return NextResponse.json(
          { error: "Bạn không có quyền chỉnh sửa công việc trong nhóm này." },
          { status: 403 }
        );
      }

      // Nếu có cập nhật assigneeId, kiểm tra assignee có thuộc team không
      if (assigneeId) {
        const isAssigneeValid =
          existingTask.team.members.some((m) => m.userId === assigneeId) ||
          existingTask.team.ownerId === assigneeId;
        if (!isAssigneeValid) {
          return NextResponse.json(
            { error: "Người được phân công không thuộc nhóm này." },
            { status: 400 }
          );
        }
      }
    } else if (existingTask.creatorId) {
      // Task cá nhân: Chỉ người tạo mới được sửa
      if (!session || session.userId !== existingTask.creatorId) {
        return NextResponse.json(
          { error: "Bạn không có quyền chỉnh sửa công việc cá nhân của người khác." },
          { status: 403 }
        );
      }
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
        ...(assigneeId !== undefined && {
          assigneeId: assigneeId || null,
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
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
// Yêu cầu: "Only the task creator, the assignee, or the team Owner can delete a task."
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần xóa." },
        { status: 404 }
      );
    }

    // Nếu task gắn với team, kiểm tra quyền: Chỉ creator, assignee hoặc team Owner mới được xóa
    if (existingTask.teamId && existingTask.team) {
      if (!session) {
        return NextResponse.json({ error: "Vui lòng đăng nhập để xóa task." }, { status: 401 });
      }

      const isCreator = existingTask.creatorId === session.userId;
      const isAssignee = existingTask.assigneeId === session.userId;
      const isOwner = existingTask.team.ownerId === session.userId;

      if (!isCreator && !isAssignee && !isOwner) {
        return NextResponse.json(
          { error: "Bạn không có quyền xóa công việc này. Chỉ người tạo, người được phân công hoặc Trưởng nhóm mới có thể xóa." },
          { status: 403 }
        );
      }
    } else if (existingTask.creatorId) {
      // Task cá nhân: Chỉ người tạo mới được xóa
      if (!session || session.userId !== existingTask.creatorId) {
        return NextResponse.json(
          { error: "Bạn không có quyền xóa công việc cá nhân của người khác." },
          { status: 403 }
        );
      }
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
