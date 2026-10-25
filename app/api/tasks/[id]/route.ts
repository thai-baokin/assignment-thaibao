import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getUserTeamRole, canDeleteTask, canManageTask } from "@/lib/permissions";
import { createInAppNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { broadcastRealtime, teamTasksTopic } from "@/lib/realtime-broadcast";

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

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json(
        { error: "Tiêu đề công việc không được để trống." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json({ error: "Mô tả công việc không hợp lệ." }, { status: 400 });
    }

    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Trạng thái công việc không hợp lệ." }, { status: 400 });
    }

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Độ ưu tiên công việc không hợp lệ." }, { status: 400 });
    }

    if (
      dueDate !== undefined &&
      dueDate !== null &&
      dueDate !== "" &&
      Number.isNaN(new Date(dueDate).getTime())
    ) {
      return NextResponse.json({ error: "Hạn chót không hợp lệ." }, { status: 400 });
    }

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

    // Nếu task thuộc về một Team
    if (existingTask.team) {
      if (!session) {
        return NextResponse.json({ error: "Vui lòng đăng nhập để cập nhật task." }, { status: 401 });
      }

      const teamRole = await getUserTeamRole(session.userId, existingTask.team.id);
      if (!teamRole) {
        return NextResponse.json(
          { error: "Bạn không phải thành viên của nhóm này." },
          { status: 403 }
        );
      }

      const isCreator = existingTask.creatorId === session.userId;
      const isAssignee = existingTask.assigneeId === session.userId;

      // Kiểm tra quyền chỉnh sửa theo RBAC (Owner/Admin sửa mọi task; Member sửa task của mình)
      if (!canManageTask(teamRole, isCreator, isAssignee)) {
        return NextResponse.json(
          { error: "Thành viên chỉ có quyền chỉnh sửa công việc do mình tạo hoặc được phân công." },
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

    // Nếu thay đổi người được phân công sang người mới khác người sửa, gửi notification
    if (
      assigneeId &&
      assigneeId !== existingTask.assigneeId &&
      session &&
      assigneeId !== session.userId &&
      existingTask.team
    ) {
      await createInAppNotification({
        userId: assigneeId,
        type: "ASSIGNED_TASK",
        title: "Bạn được phân công công việc mới",
        message: `${session.name} đã phân công công việc "${updatedTask.title}" cho bạn trong nhóm "${existingTask.team.name}".`,
        relatedId: `${existingTask.team.id}?taskId=${updatedTask.id}`,
      });
    }

    if (existingTask.teamId && session) {
      await logActivity({
        teamId: existingTask.teamId,
        userId: session.userId,
        action: "TASK_UPDATED",
        detail: `đã cập nhật công việc "${updatedTask.title}"`,
      });

      await broadcastRealtime(teamTasksTopic(existingTask.teamId), "task-updated", updatedTask);
    }

    return NextResponse.json(updatedTask, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật task:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật công việc. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Xóa task theo ID
// Yêu cầu Assignment 3 & 4:
// - Owner & Admin: Có quyền xóa bất kỳ task nào trong nhóm
// - Member: Chỉ có quyền xóa task do mình tạo hoặc được phân công
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

    // Nếu task gắn với team, kiểm tra quyền RBAC
    if (existingTask.teamId && existingTask.team) {
      if (!session) {
        return NextResponse.json({ error: "Vui lòng đăng nhập để xóa task." }, { status: 401 });
      }

      const teamRole = await getUserTeamRole(session.userId, existingTask.team.id);
      if (!teamRole) {
        return NextResponse.json(
          { error: "Bạn không có quyền truy cập nhóm này." },
          { status: 403 }
        );
      }

      const isCreator = existingTask.creatorId === session.userId;
      const isAssignee = existingTask.assigneeId === session.userId;

      if (!canDeleteTask(teamRole, isCreator, isAssignee)) {
        return NextResponse.json(
          {
            error:
              "Bạn không có quyền xóa công việc này. Chỉ Trưởng nhóm (Owner), Quản trị viên (Admin) hoặc người tạo/được phân công mới có thể xóa.",
          },
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

    if (existingTask.teamId && session) {
      await logActivity({
        teamId: existingTask.teamId,
        userId: session.userId,
        action: "TASK_DELETED",
        detail: `đã xóa công việc "${existingTask.title}"`,
      });
    }

    await prisma.task.delete({
      where: { id },
    });

    if (existingTask.teamId) {
      await broadcastRealtime(teamTasksTopic(existingTask.teamId), "task-deleted", { id });
    }

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

