const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function broadcastRealtime(
  topic: string,
  event: string,
  payload: unknown
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_URL.startsWith("http")) {
    return false;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL.replace(/\/+$/, "")}/realtime/v1/api/broadcast`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ topic, event, payload }],
        }),
        cache: "no-store",
      }
    );

    return response.ok;
  } catch (error) {
    console.warn("Realtime broadcast failed:", error);
    return false;
  }
}

export const teamChatTopic = (teamId: string) => `team-chat-${teamId}`;
export const teamTasksTopic = (teamId: string) => `team-tasks-${teamId}`;
export const teamMembersTopic = (teamId: string) => `team-members-${teamId}`;
export const notificationsTopic = (userId: string) => `notifications:user-${userId}`;
