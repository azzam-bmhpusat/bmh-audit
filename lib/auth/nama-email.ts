/**
 * lib/auth/nama-email.ts
 * Konversi nama daerah / cabang menjadi email internal Supabase Auth.
 * ATURAN HARUS IDENTIK 100% dengan fungsi SQL `public.nama_to_email`.
 */

export function namaToEmail(nama: string): string {
  const slug = nama
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}@audit.bmh.or.id`;
}

/**
 * Memeriksa apakah nama menghasilkan slug email yang valid (tidak kosong).
 */
export function isValidNamaCabang(nama: string): boolean {
  if (!nama || typeof nama !== "string") return false;
  const email = namaToEmail(nama);
  return email !== "@audit.bmh.or.id" && !email.startsWith("@");
}
