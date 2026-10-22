import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase-client";

export type NotificationType = "ASSIGNED_TASK" | "ADDED_TO_TEAM";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}

/**
 * Tạo thông báo trong database và gửi broadcast realtime qua Supabase
 */
export async function createInAppNotification({
  userId,
  type,
  title,
  message,
  relatedId,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId: relatedId || null,
        read: false,
      },
    });

    // Phát broadcast realtime tới channel riêng của user (nếu Supabase client được cấu hình)
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const channel = supabase.channel(`notifications:user-${userId}`);
        await channel.send({
          type: "broadcast",
          event: "new-notification",
          payload: notification,
        });
        supabase.removeChannel(channel);
      }
    } catch (err) {
      // Bỏ qua lỗi socket broadcast nếu môi trường chưa bật realtime
      console.warn("Realtime broadcast notification warning:", err);
    }

    return notification;
  } catch (error) {
    console.error("Lỗi khi tạo notification:", error);
    return null;
  }
}
