# Tech Stack — Data Audit BMH

| Lapisan | Teknologi | Fungsi |
|---|---|---|
| Framework | **Next.js** (App Router, TypeScript) | Routing, Server Components, rendering |
| UI | **shadcn/ui** + **Tailwind CSS** | Komponen antarmuka dan styling |
| Data | **Supabase** (PostgreSQL + PostgREST) | Penyimpanan dan akses data audit |
| Validasi | **Zod** | Validasi parameter URL dan data dari Supabase |

Proyek Next.js sudah ada. Gunakan versi terbaru yang terpasang di proyek, dan ikuti dokumentasi resmi masing-masing sesuai versinya.

## 1. Instalasi

```bash
# shadcn/ui (akan menyiapkan Tailwind, utils cn(), components.json)
npx shadcn@latest init

# komponen yang dipakai (lihat design-system.md)
npx shadcn@latest add table card badge button input select sheet skeleton alert separator tooltip

# Supabase client dan Zod
npm install @supabase/supabase-js zod
```

Bila pada tabel nanti dipakai pengurutan kolom yang lebih kompleks, pola Data Table shadcn memakai `@tanstack/react-table` (`npm install @tanstack/react-table`). Untuk v1 yang hanya mengurutkan beberapa kolom, pengurutan sederhana dengan `useState` sudah cukup.

## 2. Variabel lingkungan

`.env.local` (jangan di-commit): 

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-public-key>
```

Data hanya diambil di server (Server Component), jadi variabel tidak diberi awalan `NEXT_PUBLIC_`. Jangan pernah memakai `service_role` key di aplikasi ini.

## 3. Supabase

### 3.1 Data

1. Jalankan `audit_bmh_schema.sql` di SQL Editor.
2. Import `audit_bmh.csv` ke tabel `audit_bmh` (Table Editor → Import data from CSV).

### 3.2 View untuk opsi filter

```sql
create view v_audit_filter with (security_invoker = true) as
select distinct perwakilan_kode, perwakilan, periode
from audit_bmh;
```

### 3.3 Keamanan (tanpa login → hanya baca)

```sql
alter table audit_bmh enable row level security;

create policy "anon boleh baca audit_bmh"
  on audit_bmh for select
  to anon
  using (true);
-- Jangan buat policy insert/update/delete untuk anon.
```

`v_audit_filter` memakai `security_invoker`, jadi mengikuti policy tabel `audit_bmh`.

> Dengan policy ini, siapa pun yang memegang anon key dapat membaca seluruh isi `audit_bmh`. Pastikan data memang boleh terbuka. Jika tidak, tambahkan login (Supabase Auth) sebelum dipublikasikan.

### 3.4 Client server

`lib/supabase/server.ts`

```ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServer() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
```

## 4. Zod

`lib/schemas/audit.ts` (kerangka)

```ts
import { z } from "zod";

const skor = z.number().int().min(1).max(5).nullable();
const teks = z.string().nullable();

export const AuditRowSchema = z.object({
  perwakilan_kode: z.string(),
  perwakilan: z.string(),
  periode: z.string(),
  pilar_kode: z.string(),
  pilar: z.string(),
  variabel_kode: z.string(),
  variabel: z.string(),
  no: z.number().int(),
  pertanyaan: z.string(),
  regulasi_utama: teks,
  acuan_tambahan: teks,
  ranah: z.enum(["Ps", "PsPw"]),
  bobot: z.number(),
  fokus_1: teks, fokus_2: teks, fokus_3: teks, fokus_4: teks, fokus_5: teks,
  bukti_1: teks, bukti_2: teks, bukti_3: teks, bukti_4: teks, bukti_5: teks,
  link_1: teks, link_2: teks, link_3: teks, link_4: teks, link_5: teks,
  kriteria_1: teks, kriteria_2: teks, kriteria_3: teks, kriteria_4: teks, kriteria_5: teks,
  skor_audite: skor,
  skor_auditor: skor,
  nilai_audite: z.number().nullable(),
  nilai_auditor: z.number().nullable(),
  nilai_maks: z.number(),
});
export type AuditRow = z.infer<typeof AuditRowSchema>;

export const FilterOptionSchema = z.object({
  perwakilan_kode: z.string(),
  perwakilan: z.string(),
  periode: z.string(),
});

// Nilai tidak valid diabaikan (undefined), bukan error.
const opt = z.string().trim().min(1).max(100).optional().catch(undefined);
export const SearchParamsSchema = z.object({
  perwakilan: opt,
  periode: opt,
  pilar: opt,
  variabel: opt,
  q: opt,
});
```

Catatan: kolom `numeric` dari PostgREST dikirim sebagai angka JSON, jadi `z.number()` sesuai. Jika ternyata datang sebagai string, gunakan `z.coerce.number()`.

## 5. Pola pengambilan data

`lib/queries/audit.ts` (kerangka)

```ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuditRowSchema, FilterOptionSchema } from "@/lib/schemas/audit";
import { z } from "zod";

export async function getFilterOptions() {
  const { data, error } = await createSupabaseServer()
    .from("v_audit_filter").select("*");
  if (error) throw error;
  return z.array(FilterOptionSchema).parse(data);
}

export async function getAuditRows(perwakilan: string, periode: string) {
  const { data, error } = await createSupabaseServer()
    .from("audit_bmh").select("*")
    .eq("perwakilan_kode", perwakilan).eq("periode", periode)
    .order("pilar_kode").order("variabel_kode").order("no");
  if (error) throw error;
  return z.array(AuditRowSchema).parse(data);
}
```

- `page.tsx` (Server Component) membaca `searchParams`, memvalidasi dengan `SearchParamsSchema`, menentukan perwakilan dan periode default, lalu memanggil dua fungsi di atas.
- Komponen filter (Client Component) mengubah URL dengan `useRouter` dan `useSearchParams`. Perubahan Perwakilan atau Periode memicu pengambilan data ulang di server. Filter Pilar, Variabel, dan pencarian dikerjakan di sisi klien pada data yang sudah dimuat.
- Urutan pilar dan variabel memakai `pilar_kode` dan `variabel_kode` teks. Jika urutan `V-10` muncul sebelum `V-2`, urutkan di util `audit-utils.ts` berdasarkan angka pada kode, bukan teksnya.

## 6. Konvensi

| Hal | Aturan |
|---|---|
| Bahasa kode | TypeScript strict, tanpa `any` |
| Impor | Alias `@/` |
| Komponen | Server Component secara default. `"use client"` hanya untuk filter, tabel interaktif, dan sheet |
| Styling | Hanya komponen shadcn dan token (lihat `design-system.md`) |
| Validasi | Semua data dari luar (URL, Supabase) melewati Zod |
| Error | Detail error dicatat di server, pengguna hanya melihat pesan umum |
| Teks UI | Bahasa Indonesia |

## 7. Pengecekan

```bash
npm run lint
npm run build
```

Pengujian manual mengikuti kriteria penerimaan di `prd.md` bagian 12. Angka acuan: Jatim Semester-I 2026 → 72 baris, total bobot 162, total nilai audite 548.
