import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Membuat instance client Supabase untuk Server Component dan Server Actions.
 * Menggunakan @supabase/ssr dengan cookies() asinkron (Next.js 16).
 * Hanya menggunakan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component (read-only cookie store).
            // Diabaikan karena pembaruan cookie ditangani oleh proxy.ts.
          }
        },
      },
    }
  );
}
