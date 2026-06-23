import { supabase } from "../supabase";
import { TeamMessage, SocialProfile } from "../../types/social";
import { PROFILE_CARD_COLS } from "../../types/social";

async function fetchProfiles(userIds: string[]): Promise<Record<string, SocialProfile>> {
  if (!userIds.length) return {};
  // Include legacy profile_pic (base64) so avatars show for users who haven't
  // migrated to avatar_url Storage yet. Limited to distinct chat senders, so cost is small.
  const { data } = await supabase
    .from("profiles")
    .select(`${PROFILE_CARD_COLS},profile_pic`)
    .in("id", userIds);
  return Object.fromEntries(((data ?? []) as SocialProfile[]).map((p) => [p.id, p]));
}

export async function listMessages(teamId: string, limit = 60): Promise<TeamMessage[]> {
  const { data, error } = await supabase
    .from("team_messages")
    .select("id, team_id, user_id, content, reply_to_id, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  const messages = data as TeamMessage[];
  const msgIds = messages.map((m) => m.id);
  const senderIds = [...new Set(messages.map((m) => m.user_id))];
  const replyIds = messages.map((m) => m.reply_to_id).filter(Boolean) as string[];

  // Fire all independent fetches in parallel — profiles, reactions, reply snippets
  const [profileMap, reactionsRaw, repliesRaw] = await Promise.all([
    fetchProfiles(senderIds),
    msgIds.length
      ? supabase.from("team_message_reactions").select("message_id, user_id, emoji").in("message_id", msgIds)
      : Promise.resolve({ data: [] }),
    replyIds.length
      ? supabase.from("team_messages").select("id, content, user_id").in("id", replyIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build reactions map
  const reactionsMap: Record<string, { emoji: string; user_ids: string[] }[]> = {};
  for (const r of (reactionsRaw.data ?? []) as any[]) {
    if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
    const existing = reactionsMap[r.message_id].find((x) => x.emoji === r.emoji);
    if (existing) existing.user_ids.push(r.user_id);
    else reactionsMap[r.message_id].push({ emoji: r.emoji, user_ids: [r.user_id] });
  }

  // Build reply map — re-use already-fetched profiles where possible
  const replyMap: Record<string, { content: string; sender_name: string }> = {};
  if (repliesRaw.data?.length) {
    const unseenIds = [...new Set((repliesRaw.data as any[]).map((r) => r.user_id))].filter(
      (id) => !profileMap[id],
    );
    const extraProfiles = unseenIds.length ? await fetchProfiles(unseenIds) : {};
    const allProfiles = { ...profileMap, ...extraProfiles };
    for (const r of repliesRaw.data as any[]) {
      replyMap[r.id] = { content: r.content, sender_name: allProfiles[r.user_id]?.name ?? "Unknown" };
    }
  }

  return messages.map((m) => ({
    ...m,
    sender: profileMap[m.user_id],
    reply_to: m.reply_to_id && replyMap[m.reply_to_id]
      ? { id: m.reply_to_id, ...replyMap[m.reply_to_id] }
      : null,
    reactions: reactionsMap[m.id] ?? [],
  }));
}

export async function sendMessage(
  teamId: string,
  userId: string,
  content: string,
  replyToId?: string,
): Promise<TeamMessage | null> {
  const { data, error } = await supabase
    .from("team_messages")
    .insert({ team_id: teamId, user_id: userId, content: content.trim(), reply_to_id: replyToId ?? null })
    .select("id, team_id, user_id, content, reply_to_id, created_at")
    .single();
  if (error || !data) return null;
  const profileMap = await fetchProfiles([userId]);
  return { ...(data as TeamMessage), sender: profileMap[userId], reactions: [] };
}

export async function deleteMessage(messageId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("team_messages").delete().eq("id", messageId);
  return { error: error?.message ?? null };
}

/**
 * Messenger-style reaction: one reaction per user per message.
 * - Click the emoji you already have → removes it.
 * - Click a different emoji → swaps your reaction to it.
 * - No reaction yet → adds it.
 */
export async function setReaction(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("team_message_reactions")
    .select("emoji")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.emoji === emoji) {
    // Same emoji → toggle off
    await supabase
      .from("team_message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
  } else {
    // New or different emoji → upsert (replaces previous due to (message_id,user_id) PK)
    await supabase
      .from("team_message_reactions")
      .upsert(
        { message_id: messageId, user_id: userId, emoji },
        { onConflict: "message_id,user_id" },
      );
  }
}

export { fetchProfiles };
