import { supabase } from "../supabase";

export type ChatTurn = { role: "user" | "model"; text: string };

export async function sendChatMessage(message: string, history: ChatTurn[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { message, history },
  });

  if (error) {
    // supabase-js surfaces non-2xx edge function responses as FunctionsHttpError;
    // the actual {error: "..."} body is on error.context
    const context = (error as { context?: Response }).context;
    if (context?.status === 429) throw new Error("daily_limit");
    throw error;
  }

  return data.reply as string;
}
