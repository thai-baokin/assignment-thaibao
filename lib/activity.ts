import prisma from "@/lib/prisma";

interface LogActivityParams {
  teamId: string;
  userId?: string | null;
  action: string;
  detail: string;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity({
  teamId,
  userId,
  action,
  detail,
  metadata,
}: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        teamId,
        userId: userId || null,
        action,
        detail,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.warn("Không thể ghi activity log:", error);
    return null;
  }
}
