import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Menyegarkan sesi Supabase di tingkat proxy (Next.js 16).
 * Memeriksa apakah token perlu disegarkan dan menyimpan cookie yang diperbarui.
 * Melakukan proteksi awal: belum login saat mengakses /audit atau /nilai-audit -> redirect ke /
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Jangan gunakan getSession() karena tidak memvalidasi keaslian token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Helper untuk membuat redirect response sambil mempertahankan cookie sesi
  const createRedirectResponse = (targetPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  const isProtectedPath =
    pathname.startsWith("/audit") ||
    pathname.startsWith("/nilai-audit") ||
    pathname.startsWith("/dashboard");

  // Jika belum login dan mengakses area terproteksi
  if (!user) {
    if (isProtectedPath) {
      return createRedirectResponse("/login");
    }
    return supabaseResponse;
  }

  // Jika user sudah login, ambil profile & role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Jika user login tapi profil/role tidak ditemukan, jangan redirect ke rute terproteksi (hindari loop)
  if (!role) {
    if (isProtectedPath) {
      return createRedirectResponse("/login");
    }
    return supabaseResponse;
  }

  const roleHome = role === "admin" ? "/nilai-audit" : "/audit";

  // Jika user sudah login dan membuka /login atau /
  if (pathname === "/login" || pathname === "/") {
    return createRedirectResponse(roleHome);
  }

  // Jika user membuka /dashboard
  if (pathname.startsWith("/dashboard")) {
    return createRedirectResponse(roleHome);
  }

  // Pastikan /audit hanya untuk user cabang
  if (pathname.startsWith("/audit") && role !== "user") {
    return createRedirectResponse("/nilai-audit");
  }

  // Pastikan /nilai-audit hanya untuk admin
  if (pathname.startsWith("/nilai-audit") && role !== "admin") {
    return createRedirectResponse("/audit");
  }

  return supabaseResponse;
}
