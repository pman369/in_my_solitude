/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";

export type ActivityAction = 
  | "book_upload" 
  | "book_edit" 
  | "book_delete" 
  | "book_publish" 
  | "book_hide"
  | "book_uploaded"
  | "book_edited"
  | "book_deleted"
  | "book_published"
  | "book_unpublished"
  | "download_enabled"
  | "download_disabled"
  | "vault_approve" 
  | "vault_decline"
  | "vault_request_approved"
  | "vault_request_declined"
  | "request_fulfill"
  | "request_decline"
  | "request_approved"
  | "request_declined"
  | "donation_accept"
  | "donation_decline"
  | "donation_approved"
  | "donation_declined"
  | "user_role_updated";

interface LogParams {
  action: ActivityAction | string;
  targetId?: string;
  targetType?: "book" | "vault_request" | "book_request" | "donation" | "user" | "book_donation";
  details?: Record<string, unknown>;
}

/**
 * Logs an administrative action to the activity_logs table.
 */
export async function logActivity({ action, targetId, targetType, details }: LogParams) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from("activity_logs") as any).insert({
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
