import { supabase } from "../supabase";
import type { Feedback, FeedbackCategory, FeedbackStatus } from "../../types";

export interface SubmitFeedbackPayload {
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  category: FeedbackCategory;
  subject?: string | null;
  message: string;
  page_url?: string | null;
}

/** Submit feedback — open to anyone (anon + authenticated) via the public insert policy. */
export async function submitFeedback(
  payload: SubmitFeedbackPayload,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("feedback").insert([payload]);
  if (error) return { error: error.message };
  return { error: null };
}

/** List all feedback — RLS restricts this to admins (is_app_admin). */
export async function listFeedback(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading feedback:", error.message);
    return [];
  }
  return (data as Feedback[]) || [];
}

/** Update a feedback item's status — admin-only via RLS. */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("feedback")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
