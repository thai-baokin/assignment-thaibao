import prisma from "@/lib/prisma";
import { broadcastRealtime, notificationsTopic } from "@/lib/realtime-broadcast";

export type NotificationType = "ASSIGNED_TASK" | "ADDED_TO_TEAM" | "TEAM_UPDATE";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}

/**
 * Tạo thông báo trong database và gửi broadcast realtime qua Supabase Realtime REST API.
 * Dùng REST API thay vì WebSocket để hoạt động ổn định trên môi trường serverless (Vercel).
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

    await broadcastRealtime(notificationsTopic(userId), "new-notification", notification);

    return notification;
  } catch (error) {
    console.error("Lỗi khi tạo notification:", error);
    return null;
  }
}
