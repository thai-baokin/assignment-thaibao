import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample data for Assignment 2 to Supabase...");

  const defaultPassword = await bcrypt.hash("password123", 10);

  // 1. Tạo user Trưởng nhóm (Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@taskpulse.io" },
    update: {
      password: defaultPassword,
    },
    create: {
      email: "admin@taskpulse.io",
      name: "Nguyễn Văn Admin",
      password: defaultPassword,
    },
  });

  // 2. Tạo user Thành viên (Member)
  const memberUser = await prisma.user.upsert({
    where: { email: "member@taskpulse.io" },
    update: {
      password: defaultPassword,
    },
    create: {
      email: "member@taskpulse.io",
      name: "Trần Thị Member",
      password: defaultPassword,
    },
  });

  // 3. Tạo Nhóm mẫu
  let team = await prisma.team.findFirst({
    where: {
      name: "Đội Phát Triển TaskPulse (Assignment 2)",
    },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "Đội Phát Triển TaskPulse (Assignment 2)",
        description: "Không gian làm việc và quản lý công việc dự án cho các thành viên nhóm.",
        ownerId: adminUser.id,
      },
    });
  }

  // 4. Thêm thành viên vào nhóm mẫu
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: adminUser.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      teamId: team.id,
      userId: adminUser.id,
      role: "OWNER",
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: memberUser.id,
      },
    },
    update: { role: "MEMBER" },
    create: {
      teamId: team.id,
      userId: memberUser.id,
      role: "MEMBER",
    },
  });

  // 5. Tạo các task mẫu trong nhóm
  const existingTasks = await prisma.task.count({
    where: { teamId: team.id },
  });

  if (existingTasks === 0) {
    await prisma.task.create({
      data: {
        title: "Thiết lập xác thực JWT & Cookie",
        description: "Xây dựng hệ thống đăng nhập, đăng ký và middleware bảo vệ các route cho Assignment 2.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        teamId: team.id,
        creatorId: adminUser.id,
        assigneeId: adminUser.id,
      },
    });

    await prisma.task.create({
      data: {
        title: "Xây dựng Bảng Kanban & Bộ lọc nâng cao",
        description: "Giao diện quản lý task theo cột trạng thái To Do, In Progress, Done kèm chuyển trạng thái nhanh.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        teamId: team.id,
        creatorId: adminUser.id,
        assigneeId: memberUser.id,
      },
    });

    await prisma.task.create({
      data: {
        title: "Kiểm thử phân quyền RBAC cho Team",
        description: "Kiểm tra quyền hạn: chỉ Owner mới xóa nhóm, mời thành viên; người tạo/assignee/owner được quyền xóa task.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        teamId: team.id,
        creatorId: memberUser.id,
        assigneeId: adminUser.id,
      },
    });
  }

  console.log("Seeding hoàn tất thành công!");
  console.log("Tài khoản kiểm thử:");
  console.log("1. Admin: admin@taskpulse.io / password123 (Vai trò: Owner)");
  console.log("2. Member: member@taskpulse.io / password123 (Vai trò: Member)");
}

main()
  .catch((e) => {
    console.error("Lỗi khi seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
