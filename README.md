# BMH Audit

Aplikasi web audit kepatuhan internal untuk Satuan Internal Audit (SIA) LAZNAS Baitul Maal Hidayatullah (BMH). Menggantikan lembar kerja Excel manual dengan sistem digital tersentral, multi-cabang, dan perhitungan skor otomatis.

---

## Fitur Utama

- **Master Instrumen Audit** — 3 Pilar, 12 Variabel, 72 Item Pertanyaan, 360 Poin pemeriksaan.
- **Dua Peran Pengguna**:
  - **Audite Cabang** — mengisi skor mandiri (1–5) dan melampirkan link evidence. Data antar cabang terisolasi penuh.
  - **Auditor SIA** — memvalidasi bukti, memberikan skor auditor, mengedit bobot, dan mencatat catatan audit.
- **Tampilan Responsif** — Tabel matriks (desktop) dan kartu interaktif (mobile/tablet) dengan toggle manual.
- **Dashboard Ringkasan Nasional** — agregat progres dan capaian seluruh cabang.
- **Cetak Dokumen** — CSS cetak bersih untuk PDF/laporan.
- **Perhitungan Otomatis** — Nilai Skor = Skor × Bobot, lalu dihitung persentase capaian terhadap skor maksimum ideal.
- **Keamanan** — Row Level Security (RLS) di PostgreSQL, otorisasi server-side, sanitasi tautan lampiran.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| UI | Tailwind CSS v4, shadcn/ui, Lucide React |
| Backend & DB | Supabase (PostgreSQL, Auth, RLS) |
| Validasi | Zod v4 |
| Testing | Vitest, Playwright |

---

## Memulai

### 1. Variabel Lingkungan

Salin `.env.example` menjadi `.env.local` dan isi konfigurasi Supabase:

```bash
cp .env.example .env.local
```

> **Catatan**: Jangan commit file `.env.local` ke repositori.

### 2. Setup Database

Jalankan skrip migrasi berikut di **Supabase SQL Editor** secara berurutan:

1. Eksekusi [`supabase/migration/data-schema.sql`](supabase/migration/data-schema.sql) untuk membuat skema dan RLS.
2. Impor CSV master data di Table Editor (berurutan):
   - `1_audit_pilar.csv` → tabel `audit_pilar`
   - `2_audit_variabel.csv` → tabel `audit_variabel`
   - `3_audit_item.csv` → tabel `audit_item`
   - `4_audit_item_poin.csv` → tabel `audit_item_poin`
3. Buka [`supabase/migration/user.sql`](supabase/migration/user.sql), sesuaikan data akun awal sesuai kebutuhan, lalu eksekusi.

### 3. Jalankan Aplikasi

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Build Produksi

```bash
npm run build
npm start
```

---

## Perintah

| Perintah | Deskripsi |
|---|---|
| `npm run lint` | ESLint — kerapian kode dan error sintaksis |
| `npm run build` | Kompilasi produksi + validasi tipe TypeScript |
| `npm test` | Tes unit Vitest (rumus skor, format, skema, dll.) |
| `npm run test:e2e` | Tes end-to-end Playwright |
| `npm run check:design` | Pemindaian pelanggaran aturan desain |
| `npm run verify:backend` | Verifikasi integritas backend Supabase dan master instrumen |

---

## Lisensi

Instrumen Audit Kepatuhan Integratif © Satuan Internal Audit (SIA) LAZNAS Baitul Maal Hidayatullah (BMH). Seluruh hak cipta dilindungi undang-undang.
