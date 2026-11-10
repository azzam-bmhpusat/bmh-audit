# BMH Audit — Instrumen Audit Kepatuhan Integratif LAZNAS BMH

Aplikasi web internal untuk Satuan Internal Audit (SIA) Lembaga Amil Zakat Nasional (LAZNAS) Baitul Maal Hidayatullah (BMH). Aplikasi ini menggantikan pengisian lembar kerja Excel manual dengan sistem digital tersentral yang aman, multi-cabang, dan menghitung skor kepatuhan secara otomatis dan terisolasi.

---

## 1. Ringkasan & Fitur Utama

- **Master Instrumen Audit**: Terdiri dari **3 Pilar**, **12 Variabel**, **72 Item Pertanyaan**, dan **360 Poin** fokus pemeriksaan/bukti evidence/kriteria penilaian.
- **Dua Peran Pengguna (Role)**:
  - **Audite Cabang (`user`)**: Mengisi Skor Mandiri (1–5) dan melampirkan link evidence (Google Drive/Cloud) untuk cabangnya sendiri. Data cabang lain dan penilaian auditor terisolasi penuh (tidak terlihat).
  - **Auditor SIA (`admin`)**: Memilih cabang perwakilan, memvalidasi bukti, memberikan Skor Auditor (1–5), mengedit Bobot item pertanyaan secara global, dan mencatat catatan audit.
- **Perhitungan Otomatis**:
  $$\text{Nilai Skor} = \text{Skor} \times \text{Bobot}$$
  $$\text{Skor Maksimum Ideal} = 5 \times \sum \text{Bobot}$$
  $$\text{Capaian Persentase} = \frac{\sum \text{Nilai Skor}}{\text{Skor Maksimum Ideal}} \times 100\%$$
- **Keamanan Ketat (Row Level Security)**:
  - Penegakan isolasi data di tingkat database (PostgreSQL RLS).
  - Menggunakan otorisasi server-side murni dengan `@supabase/ssr` (`getUser()`).
  - Tidak ada paparan kunci rahasia (`service_role`) pada aplikasi klien.
  - Sanitasi tautan lampiran (`http://` dan `https://`) serta sanitasi HTML otomatis.

---

## 2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, Turbopack, React 19, TypeScript strict)
- **Desain & UI**: [Tailwind CSS](https://tailwindcss.com/) v4, [shadcn/ui](https://ui.shadcn.com/) dengan primitive **Base UI** (`@base-ui/react`), [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Supabase Auth, Row Level Security, PostgREST)
- **Validasi Data**: [Zod](https://zod.dev/) v4
- **Pengujian Unit**: [Vitest](https://vitest.dev/)

---

## 3. Prasyarat & Variabel Lingkungan

Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel lingkungan berikut di `.env.local`:

```env
# Koneksi Supabase (Wajib)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>

# Kredensial untuk Pengujian Otomatis (scripts/verify-backend.mjs)
TEST_ADMIN_PASSWORD=www.bmh.or.id
TEST_USER_A="Jawa Timur"
TEST_USER_A_PASSWORD=www.bmh.or.id
TEST_USER_B="Jawa Barat"
TEST_USER_B_PASSWORD=www.bmh.or.id
```

> **Catatan Keamanan**: Jangan pernah melakukan commit file `.env.local` ke dalam repositori git.

---

## 4. Urutan Setup Database (Supabase)

Sebelum menjalankan aplikasi untuk pertama kali, jalankan skrip migrasi berikut di **Supabase > SQL Editor** (role `postgres`):

1. **Jalankan Struktur Skema & RLS**:
   Eksekusi seluruh isi file [`supabase/migration/data-schema.sql`](supabase/migration/data-schema.sql).
2. **Impor Master Data CSV (Wajib Berurutan)**:
   Di dashboard Supabase (Table Editor), lakukan impor CSV secara berurutan:
   - `1_audit_pilar.csv` &rarr; tabel `public.audit_pilar`
   - `2_audit_variabel.csv` &rarr; tabel `public.audit_variabel`
   - `3_audit_item.csv` &rarr; tabel `public.audit_item`
   - `4_audit_item_poin.csv` &rarr; tabel `public.audit_item_poin`
3. **Inisialisasi Pengguna & Akun Awal**:
   Buka file [`supabase/migration/user.sql`](supabase/migration/user.sql), sesuaikan password akun admin pada baris `select public.buat_user('Admin', 'admin', '...');`, lalu eksekusi di SQL Editor.

---

## 5. Cara Menjalankan Aplikasi

Pastikan dependensi telah terpasang:

```bash
npm install
```

### Mode Pengembangan (Development)
```bash
npm run dev
```
Buka browser pada [http://localhost:3000](http://localhost:3000).

### Build Produksi
```bash
npm run build
npm start
```

---

## 6. Daftar Perintah QA & Verifikasi

Proyek ini dilengkapi dengan serangkaian skrip pengujian dan verifikasi kepatuhan:

| Perintah | Deskripsi |
|---|---|
| `npm run lint` | Menjalankan ESLint untuk memastikan kerapian kode dan ketiadaan error sintaksis. |
| `npm run build` | Menjalankan kompilasi produksi Turbopack + validasi tipe TypeScript. |
| `npm test` | Menjalankan 47 tes unit Vitest (rumus skor, format rupiah/persen, pohon matriks, safe link, skema Zod, konversi nama-email). |
| `npm run check:design` | Memindai kode terhadap pelanggaran aturan desain (elemen HTML mentah, palet warna ilegal, dark mode). |
| `npm run verify:backend` | Menguji integritas backend Supabase, hitungan master instrumen (3 pilar, 12 variabel, 72 item, 360 poin), dan aturan RLS. |
| `VERIFY_WRITE=1 npm run verify:backend` | Sama seperti di atas, ditambah uji coba tulis positif (*upsert* jawaban) dan pemulihan otomatis data uji. |

---

## 7. Akun Pengujian & Prosedur Reset

### Kredensial Pengujian Bawaan:
- **Admin SIA**:
  - Nama: `Admin`
  - Email login internal: `admin@audit.bmh.or.id`
  - Password default: `www.bmh.or.id` (atau sesuai konfigurasi lokal)
  - Halaman tujuan: `/nilai-audit`
- **Audite Cabang (Jawa Timur)**:
  - Nama: `Jawa Timur` (dapat diketik `jawa timur` atau `JAWA TIMUR`)
  - Email login internal: `jawa-timur@audit.bmh.or.id`
  - Password default: `www.bmh.or.id`
  - Halaman tujuan: `/audit`

### Prosedur Reset Password User:
Bila password akun uji telah diganti saat pengujian ganti password, jalankan perintah berikut di SQL Editor Supabase untuk mereset kembali ke default:
```sql
select public.reset_password_user('Jawa Timur');
select public.reset_password_user('Admin', 'www.bmh.or.id');
```

### Prosedur Pembersihan Akun Uji Tambahan:
Jika membuat akun uji tambahan (misalnya `Uji Satu` atau `Uji Dua`), bersihkan setelah pengujian selesai dengan:
```sql
delete from auth.users where email in ('uji-satu@audit.bmh.or.id', 'uji-dua@audit.bmh.or.id');
delete from public.cabang where nama in ('Uji Satu', 'Uji Dua');
```

---

## 8. Lisensi & Hak Cipta

Instrumen Audit Kepatuhan Integratif &copy; Satuan Internal Audit (SIA) LAZNAS Baitul Maal Hidayatullah (BMH). Seluruh hak cipta dilindungi undang-undang.
