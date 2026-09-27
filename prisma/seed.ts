import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample data to Supabase...");

  // Tạo user mẫu
  const user = await prisma.user.upsert({
    where: { email: "admin@taskpulse.io" },
    update: {},
    create: {
      email: "admin@taskpulse.io",
      name: "Nguyễn Văn Admin",
      password: "hashed_sample_password",
    },
  });

  // Tạo task mẫu
  const task1 = await prisma.task.create({
    data: {
      title: "Thiết lập dự án Next.js & kết nối Prisma Supabase",
      description: "Hoàn thiện cấu trúc thư mục, định nghĩa schema Prisma và chạy migration thành công.",
      status: "DONE",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // +3 days
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Xây dựng giao diện CRUD Task công khai",
      description: "Phát triển form tạo task, bảng danh sách, modal chỉnh sửa và nút xóa không cần reload.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Deploy ứng dụng lên Vercel và cấu hình biến môi trường",
      description: "Đẩy code lên GitHub và cấu hình DATABASE_URL trên Vercel Dashboard.",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    },
  });

  console.log("Seeding hoàn tất:", { user: user.email, taskCount: 3 });
}

main()
  .catch((e) => {
    console.error("Lỗi khi seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
