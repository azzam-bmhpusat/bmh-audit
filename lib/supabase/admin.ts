import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Membuat client Supabase dengan hak akses service role untuk operasi administratif di server.
 * Digunakan HANYA di Server Actions setelah otorisasi admin diverifikasi.
 * JANGAN PERNAH mengekspos client atau service role key ini ke client-side browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
