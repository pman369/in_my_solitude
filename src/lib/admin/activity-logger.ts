import { createClient } from "@/lib/supabase/client";

export type ActivityAction = 
  | "book_upload" 
  | "book_edit" 
  | "book_delete" 
  | "book_publish" 
  | "book_hide"
  | "vault_approve" 
  | "vault_decline"
  | "request_fulfill"
  | "request_decline"
  | "donation_accept"
  | "donation_decline";

interface LogParams {
  action: ActivityAction;
  targetId?: string;
  targetType?: "book" | "vault_request" | "book_request" | "donation";
  details?: any;
}

/**
 * Logs an administrative action to the activity_logs table.
 * Note: Requires the activity_logs table to exist in Supabase.
 */
export async function logActivity({ action, targetId, targetType, details }: LogParams) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action,
      target_id: targetId,
      target_type: targetType,
      details: details || {},
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
