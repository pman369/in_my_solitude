import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendWelcomeEmail, 
  sendVaultRequestReceivedEmail,
  sendVaultRequestApprovedEmail,
  sendVaultRequestDeniedEmail
} from '@/lib/email';
import type { Database } from '@/types/database';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Basic webhook secret verification
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // Supabase webhook payload structure
    const { type, table, record, old_record } = payload;

    // 1. Handle New User Welcome Email
    if (table === 'user_profiles' && type === 'INSERT') {
      const profile = record;
      // Fetch email from auth.users (requires service role)
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      
      if (user?.email && profile.email_notifications) {
        await sendWelcomeEmail(user.email, profile.display_name || 'Reader');
      }
    }

    // 2. Handle Vault Requests
    if (table === 'vault_access_requests') {
      const request = record;
      
      // Fetch user profile and book details for the email context
      const [{ data: profile }, { data: book }] = await Promise.all([
        supabase.from('user_profiles').select('email_notifications').eq('id', request.user_id).single(),
        supabase.from('books').select('title').eq('id', request.book_id).single()
      ]);

      if (profile?.email_notifications && book) {
        // Fetch user's email
        const { data: { user } } = await supabase.auth.admin.getUserById(request.user_id);
        
        if (user?.email) {
          if (type === 'INSERT') {
            await sendVaultRequestReceivedEmail(user.email, book.title);
          } 
          else if (type === 'UPDATE' && old_record.status !== request.status) {
            if (request.status === 'approved') {
              await sendVaultRequestApprovedEmail(user.email, book.title, request.admin_note);
            } else if (request.status === 'denied') {
              await sendVaultRequestDeniedEmail(user.email, book.title, request.admin_note);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
