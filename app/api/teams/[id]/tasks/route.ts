import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id/tasks - Lấy danh sách tasks của một nhóm
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Xác thực người dùng là thành viên hoặc owner của nhóm
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    const isMember = team.members.some((m) => m.userId === session.userId);
    const isOwner = team.ownerId === session.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập tasks của nhóm này." },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { teamId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy tasks của nhóm:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi lấy danh sách task." }, { status: 500 });
  }
}

// POST /api/teams/:id/tasks - Tạo task mới trong một nhóm
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });
    }

    const isMember = team.members.some((m) => m.userId === session.userId);
    const isOwner = team.ownerId === session.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "Bạn phải là thành viên của nhóm để tạo task." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Tiêu đề công việc không được để trống." }, { status: 400 });
    }

    // Nếu có assigneeId, kiểm tra người nhận có thuộc nhóm không
    if (assigneeId) {
      const isAssigneeInTeam = team.members.some((m) => m.userId === assigneeId) || team.ownerId === assigneeId;
      if (!isAssigneeInTeam) {
        return NextResponse.json(
          { error: "Người được phân công không thuộc nhóm này." },
          { status: 400 }
        );
      }
    }

    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    const taskStatus = validStatuses.includes(status) ? status : "TODO";
    const taskPriority = validPriorities.includes(priority) ? priority : "MEDIUM";
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: taskStatus,
        priority: taskPriority,
        dueDate: parsedDueDate,
        teamId,
        creatorId: session.userId,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo task:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi tạo task." }, { status: 500 });
  }
}
