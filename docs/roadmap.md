# Roadmap — BMH Audit

| | |
|---|---|
| **Proyek** | `bmh-audit` (Instrumen Audit Kepatuhan Integratif LAZNAS BMH) |
| **Pembaca** | Agent eksekusi (Antigravity). Dikerjakan tanpa bertanya balik, kecuali pada "titik berhenti" (§0.4). |
| **Sumber kebenaran** | `prd.md` (perilaku & keamanan) · `data-schema.sql` + `user.sql` (backend, **jangan diubah**) · `design-system.md` (tampilan) · `techstack.md` (konvensi kode) |
| **Cara pakai** | Kerjakan **satu fase per sesi/task**, urut. Jangan mulai fase berikutnya sebelum **Gate** fase sekarang lulus. Centang `[x]` pada daftar tugas di file ini saat selesai. |

---

## 0. Aturan kerja agent

### 0.1 Sebelum menulis kode
1. Baca `prd.md`, `design-system.md`, `techstack.md`, `data-schema.sql`, `user.sql` sampai habis.
2. Baca dokumentasi bawaan paket di `node_modules/next/dist/docs/` sebelum memakai API Next apa pun (proxy, server actions, forms, cookies, error/loading). Versi Next di proyek ini baru: **jangan memakai ingatan lama** (`middleware.ts`, `cookies()` sinkron, dsb.).
3. Untuk shadcn (Base UI): baca komponen hasil `add` di `components/ui/*` sebelum memakainya. Pola Base UI berbeda dari Radix (mis. `render={…}` bukan `asChild`). Ikuti yang terpasang, bukan ingatan.

### 0.2 Larangan
- Jangan mengubah `data-schema.sql` / `user.sql`. Bila menemukan masalah: laporkan dan usulkan perubahan (lihat Lampiran B).
- Jangan memakai `service_role` key atau secret apa pun di aplikasi.
- Jangan menambah dependensi selain: `@supabase/ssr`, `vitest` (dev), dan komponen shadcn. Dependensi lain harus punya alasan tertulis di pesan commit.
- Jangan membuat komponen UI sendiri dari elemen HTML mentah (aturan `design-system.md`).
- Jangan mengubah isi `components/ui/*` untuk kebutuhan satu halaman.
- Jangan commit `.env.local`, password admin asli, atau file CSV data.

### 0.3 Kebiasaan tiap fase
- Satu fase = satu cabang/commit (`fase-N: <ringkasan>`).
- Sebelum menyatakan selesai, jalankan perintah Gate fase tersebut dan tempel hasil ringkasnya di laporan.
- Laporan akhir fase (maks. 10 baris): apa yang selesai, file utama, keputusan yang diambil, hal yang perlu perhatian pemilik.
- Semua teks antarmuka berbahasa Indonesia. TypeScript strict, tanpa `any`. Impor memakai alias `@/`.
- Error: detail dicatat di server (`console.error`), pengguna hanya melihat pesan umum.

### 0.4 Titik berhenti (berhenti dan tanya pemilik)
- `npm run verify:backend` gagal pada hitungan data (3 pilar / 12 variabel / 72 item / 360 poin) atau pada tes RLS.
- Perilaku backend bertentangan dengan PRD (contoh: view mengembalikan kolom yang tidak ada di PRD §5.1).
- Perlu dependensi di luar daftar §0.2.
- Dua dokumen bertentangan dan tidak ada keputusan di §1 di bawah.

Selain itu, ambil keputusan memakai default di PRD §14 dan catat di laporan.

---

## 1. Keputusan atas dokumen yang bertentangan

`techstack.md` dan `design-system.md` ditulis untuk versi **dashboard baca-saja** (tabel `audit_bmh`, tanpa login). Aplikasi sekarang adalah **aplikasi dengan login dua peran** (PRD). Pakai tabel ini; jangan menebak.

| Topik | `techstack.md` / `design-system.md` | `prd.md` | **Keputusan** |
|---|---|---|---|
| Sumber data | Tabel `audit_bmh`, view `v_audit_filter`, policy `anon` baca | View `v_audit_*` + login, `anon` tanpa akses | **PRD.** Abaikan `techstack.md` §3 dan §5 serta skema `AuditRowSchema`. Pola zod `SearchParamsSchema` (`.catch(undefined)`) boleh dipakai untuk parameter URL. |
| Angka acuan "548" | Jatim: 72 baris, bobot 162, nilai audite 548 | Bobot 162, maks. 810 | **Jangan** memakai 548 sebagai asersi (itu data aplikasi lama). Total bobot 162 hanya acuan informasi; **jangan hardcode**. |
| Env var | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (server-only) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **PRD.** Meski begitu, tetap: data dibaca di server, tulis lewat server action, klien tidak memanggil Supabase langsung (tidak perlu `lib/supabase/client.ts`). |
| Mode gelap | Hanya terang | `[C]` mendukung gelap | **Hanya terang.** Jangan memakai `dark:` dan jangan memasang theme provider. |
| Primitive shadcn | (tidak disebut) | Base UI | **Base UI** sesuai `components.json` proyek. |
| Daftar komponen | `table card badge button input select sheet skeleton alert separator tooltip` | + Dialog, AlertDialog, Popover, DropdownMenu, Sonner, Combobox, Textarea, Label | **Gabungan.** Tambahkan yang kurang lewat `npx shadcn@latest add …`. Tidak pakai `Collapsible`/`Sheet` jika tidak perlu (collapse baris tabel memakai state, lihat Fase 4). |
| Warna | Token shadcn saja, primary hitam; `destructive` hanya `Alert` error | Status tidak hanya dengan warna | **Gabungan.** Skor, Validasi, dan simpan-status tanpa warna (ikon + teks). Toast Sonner memakai gaya bawaan tanpa `richColors`. |
| Font & tipografi | Plus Jakarta Sans, `tabular-nums` untuk angka | – | **Ikuti `design-system.md` §3.** |
| Lokasi pengujian | "kriteria penerimaan di `prd.md` bagian 12" | Kriteria penerimaan ada di **§13** | **PRD §13.** |
| Filter Pilar/Variabel/pencarian | Ada di dashboard lama | Tidak ada | Tidak dibuat. Hanya: pemilih Cabang + Periode (admin). |
| Tema CSS Tailwind | `@tailwindcss/postcss` (default shadcn) | Loader `@tailwindcss/turbopack`, **satu jalur saja** | **PRD §4.2.** Jangan sampai CSS diproses dua kali. |
| `cn` | `cn()` dari `lib/utils` | Paket `cn` | **PRD §4.3:** `import { cn } from "cn"`; `lib/utils.ts` me-re-export. |

---

## 2. Peta fase

| Fase | Hasil | Bergantung pada |
|---|---|---|
| 0 | Backend siap + akun uji (manual pemilik) | – |
| 1 | Fondasi proyek: Tailwind/shadcn/tema/font, skrip bantu, `lint` + `build` hijau | 0 (hanya untuk `.env`) |
| 2 | Tipe, zod, `scoring`, `matrix`, `format`, tes unit, `verify:backend` hijau | 0, 1 |
| 3 | Login, `proxy.ts`, sesi, ganti password, header, kerangka halaman | 2 |
| 4 | Tabel matriks (baca-saja) untuk `/audit` dan `/nilai-audit` | 3 |
| 5 | `/audit` interaktif (Skor Audite, Lampiran) | 4 |
| 6 | `/nilai-audit` interaktif (Validasi, Skor Auditor, Bobot, Total) | 5 |
| 7 | Pengerasan keamanan, a11y, QA seluruh kriteria penerimaan, serah terima | 6 |
| 8 | Opsional `[S]`/`[C]` yang tersisa | 7 |

---

## Fase 0 — Prasyarat pemilik (manual, bukan tugas agent)

Agent **tidak** mengerjakan fase ini. Agent hanya memastikan semuanya sudah dilakukan lewat `verify:backend` (Fase 2). Bila belum, minta pemilik menyelesaikannya.

- [ ] Jalankan `data-schema.sql` utuh di Supabase SQL Editor.
- [ ] Impor 4 CSV **berurutan**: `1_audit_pilar` → `2_audit_variabel` → `3_audit_item` → `4_audit_item_poin`.
- [ ] Di `user.sql`: ganti `GANTI-PASSWORD-ADMIN-INI` dengan password admin sungguhan **di salinan lokal pemilik** (jangan di-commit), lalu jalankan.
- [ ] **Disarankan:** buat 2 cabang uji khusus agar data asli tidak tercemar skor percobaan:
  ```sql
  select public.buat_user('Uji Satu');
  select public.buat_user('Uji Dua');
  ```
  (PRD memakai `Jawa Timur` dan `Jawa Barat`; boleh dipakai bila pemilik memilih begitu. Ingat pengujian mengisi skor dan mengganti password akun tersebut.)
- [ ] Di Supabase: Authentication → pastikan login email/password aktif. Catat apakah **Secure password change** aktif (memengaruhi Fase 3).
- [ ] Siapkan nilai: Project URL, anon/publishable key, password admin, password akun uji.
- [ ] Beri tahu agent akun uji mana yang dipakai.

**Setelah pengujian selesai (Fase 7), pemilik membersihkan:**
```sql
delete from auth.users where email in ('uji-satu@audit.bmh.or.id','uji-dua@audit.bmh.or.id');
delete from public.cabang where nama in ('Uji Satu','Uji Dua');
```

---

## Fase 1 — Audit proyek & fondasi

**Tujuan:** proyek siap dibangun di atas; tidak ada fitur.

### Tugas
- [x] Periksa kondisi proyek yang **sudah ada**: `package.json`, `components.json`, `next.config.ts`, `postcss.config.*`, `app/globals.css`, `components/ui/*`, `tsconfig.json`. Catat apa yang sudah ada; **kerjakan hanya yang kurang** (jangan `create-next-app` ulang, jangan `shadcn init` ulang bila `components.json` sudah ada).
- [x] `npm i @supabase/ssr`. Konfirmasi `zod` versi 4 terpasang (sintaks `z.url({ protocol })` dipakai PRD).
- [x] **Satu jalur CSS.** Pastikan `next.config.ts` memuat:
  ```ts
  turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'] } } }
  ```
  dan tidak ada `postcss.config.*` yang ikut memproses Tailwind. Verifikasi dengan `npm run build` dan tampilan halaman (kelas Tailwind terbaca tepat satu kali; tidak ada gaya ganda).
- [x] `cn`: `lib/utils.ts` me-re-export `cn` dari paket `cn` (baca README paketnya bila ragu). Komponen `components/ui/*` tetap bisa mengimpor `@/lib/utils`.
- [x] Tema (`app/globals.css`), sesuai `design-system.md` §2: `--primary: oklch(0 0 0)`, `--primary-foreground: oklch(1 0 0)`, `--ring: oklch(0.145 0 0)`, `--radius: 0.5rem`. Token lain tetap tema neutral. Blok `.dark` bawaan boleh dibiarkan, tetapi tidak pernah diaktifkan.
- [x] Font **Plus Jakarta Sans** lewat `next/font/google` di `app/layout.tsx`, disambungkan ke `--font-sans`. `<html lang="id">`. Metadata judul "BMH Audit".
- [x] Tambahkan komponen shadcn yang dibutuhkan (hanya yang belum ada):
  `table card badge button input select label textarea dialog alert-dialog popover dropdown-menu sonner skeleton alert separator tooltip combobox`
  Bila nama `combobox` berbeda pada CLI terpasang, ikuti CLI.
- [x] Pasang `<Toaster />` (Sonner) di `app/layout.tsx` tanpa `richColors`.
- [x] `.env.example` berisi `NEXT_PUBLIC_SUPABASE_URL=` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (tanpa nilai). Pastikan `.env*.local` ada di `.gitignore`.
- [x] Salin referensi ke `supabase/`: `data-schema.sql`, `user.sql` (**tetap dengan placeholder password admin**), dan CSV bila ada. Jangan mengubah isinya.
- [x] Vitest: `npm i -D vitest`; `vitest.config.ts` dengan alias `@` → root proyek; skrip `"test": "vitest run"`.
- [x] Skrip bantu `scripts/check-design.mjs` (Node, lintas-OS) + skrip npm `"check:design"`. Skrip memindai `app/` dan `components/` **kecuali `components/ui/`** dan gagal (exit 1) bila menemukan:
  - tag mentah `<button`, `<input`, `<select`, `<textarea`, `<table`, `<thead`, `<tbody`, `<tr`, `<td`, `<th`;
  - kelas warna palet Tailwind (`bg|text|border|ring|fill|stroke|divide|from|to|via` + `red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone` + `-angka`), `bg|text|border-white|black`, dan nilai hex;
  - `dark:`;
  - kata `destructive` di luar penggunaan `Alert` (cetak sebagai peringatan untuk ditinjau manual).
- [x] Skrip npm `"verify:backend": "node --env-file=.env.local scripts/verify-backend.mjs"` (isi skrip dibuat di Fase 2).
- [x] Halaman `/` sementara: satu `Button` default untuk memastikan primary hitam, font, dan Tailwind aktif.

### Gate
```bash
npm run lint && npm run build && npm test && npm run check:design
```
- Semua lulus (`npm test` boleh "no tests" sampai Fase 2; pastikan tidak error konfigurasi).
- Tombol default tampil **hitam**, teks putih, font Plus Jakarta Sans.
- Tidak ada `postcss.config.*` yang memproses Tailwind; tidak ada gaya ganda.

---

## Fase 2 — Logika murni, tipe, dan verifikasi backend

**Tujuan:** semua perhitungan dan validasi ada di satu tempat dan teruji; backend terbukti sesuai PRD.

### Tugas
- [x] `types/audit.ts` — tulis **manual** sesuai kolom view PRD §5.1: `MatrixRowCabang`, `MatrixRowAdmin` (= cabang + `validasi`, `skor_auditor`, `nilai_skor_auditor`, `catatan`), `ItemPoin`, `TotalAdmin`, `Periode`, `Cabang`, `Profile`, `Role`. Kolom nullable ditulis nullable seperlunya (`bukti_evidence`, `lampiran_link`, `skor_*`, dst.).
- [x] `lib/schemas.ts` (zod 4), sesuai PRD §10:
  - `skor` (int 1–5, nullable), `lampiran` (`http/https`, maks. 2048, string kosong → `null` **sebelum** validasi), `validasi` (boolean nullable), `catatan` (maks. 1000, nullable, string kosong → `null`), `bobot` (int 1–10), `itemNomor` (int ≥ 1; **verifikasi terhadap data**, bukan batas keras 72).
  - Skema login (`nama` wajib dan tidak kosong setelah dikonversi, `password` wajib) dan skema ganti password (min. 8, ≠ `www.bmh.or.id`, konfirmasi cocok).
  - Skema parameter URL `cabang` dan `periode` (integer positif, `.catch(undefined)`).
  - Skema baris dari Supabase **toleran** terhadap angka yang datang sebagai string (`z.coerce.number()` pada kolom numeric).
- [x] `lib/auth/nama-email.ts` sesuai PRD §7.1 (identik dengan `public.nama_to_email`) + tes: `Jawa Timur`, `jawa timur`, ` JAWA  TIMUR ` → `jawa-timur@audit.bmh.or.id`; `Admin` → `admin@audit.bmh.or.id`; karakter simbol; nama yang menjadi kosong.
- [x] `lib/scoring.ts` — **satu-satunya sumber** rumus (PRD §9):
  `nilaiSkor(skor, bobot)` (null bila skor null), `subtotal(nilai[])` (null dianggap 0), `skorMaksimum(bobot[])` (= 5 × Σ), `persen(total, maks)`.
  Pembulatan persen **harus sama dengan Postgres** `round(x, 2)`; gunakan aritmetika bilangan bulat: `Math.round(total * 10000 / maks) / 100` (0 bila `maks = 0`).
- [x] `lib/scoring.test.ts` (Vitest): semua kosong; sebagian terisi; bobot berbeda-beda; skor 4 × bobot 3 = 12; skor auditor 3 × bobot 3 = 9; total 13 dari maks. 810 → 1,60; pembulatan di batas (mis. `1/800` → 0,13); maksimum 0.
- [x] `lib/format.ts`: `formatAngka` (`Intl.NumberFormat('id-ID')`), `formatPersen` (`1,60%`, 2 desimal), `formatRasio` (mis. `13 / 810 (1,60%)`). Tes unit singkat.
- [x] `lib/matrix.ts` (murni, teruji): menggabungkan baris matriks + `ItemPoin` (map by `item_nomor`, urut `urutan`) menjadi pohon `Pilar → Variabel → Item`; menghitung subtotal bobot, nilai skor, nilai skor auditor per Variabel dan Pilar; menghitung progres terisi per Variabel (**jumlah item dihitung dari data, bukan hardcode 6**); menangani item dengan `bukti_evidence = null` (item no. 11).
- [x] `lib/safe-link.ts`: `safeHref(url)` → string `http(s)` valid atau `null` (dipakai saat **render**, sebagai lapis kedua setelah zod).
- [x] `scripts/verify-backend.mjs` (JS biasa, memakai `@supabase/supabase-js` dengan anon key; fungsi `namaToEmail` disalin dengan komentar "harus sama dengan lib/auth/nama-email.ts"). Variabel lingkungan tambahan **hanya dari shell/`.env.local`**: `TEST_ADMIN_PASSWORD`, `TEST_USER_A`, `TEST_USER_A_PASSWORD`, `TEST_USER_B`, `TEST_USER_B_PASSWORD`. Pemeriksaan:
  1. Sebagai admin: `audit_pilar` = 3, `audit_variabel` = 12, `audit_item` = 72, `audit_item_poin` = 360; item no. 11 poin ke-5 `bukti_evidence` null; cetak Σ bobot (informasi).
  2. Sebagai user A: `v_audit_matrix_cabang` (periode terbaru) = **72 baris**, semua `cabang_id` milik A, **tidak ada** kunci kolom auditor; `v_audit_matrix_admin` = 0 baris; `audit_penilaian_auditor` = 0 baris; `cabang` hanya 1 baris.
  3. Sebagai user B: tidak melihat baris cabang A.
  4. Penolakan (harus **error/0 baris terpengaruh**): user A menulis `audit_jawaban` dengan `cabang_id` milik B; user A mengubah `profiles.role`; user A mengubah `audit_item.bobot`; admin menulis `audit_jawaban`.
  5. Sebagai admin: untuk satu cabang, `v_audit_total_admin` cocok dengan hitungan manual dari matriks (`Σ bobot × 5`, `Σ nilai_skor_auditor`).
  6. Uji tulis positif (upsert skor oleh user A) **hanya** bila `VERIFY_WRITE=1`, dan hanya pada akun uji.
  Keluaran: daftar `PASS`/`FAIL` per pemeriksaan; exit 1 bila ada `FAIL`.

### Gate
```bash
npm run lint && npm run build && npm test && npm run check:design
npm run verify:backend      # semua PASS (butuh Fase 0 selesai)
```
- AC-Q2 terpenuhi (tes `lib/scoring` lulus).
- Bila `verify:backend` FAIL: **berhenti** (§0.4).

---

## Fase 3 — Autentikasi & kerangka aplikasi

**Tujuan:** login/logout, perlindungan rute, wajib ganti password, header.

### Tugas
- [x] `lib/supabase/server.ts`: `createClient()` memakai `@supabase/ssr` (`createServerClient`), cookie **async** sesuai dokumentasi Next terpasang.
- [x] `lib/supabase/proxy.ts` + `proxy.ts` (root): refresh sesi dan redirect awal bagi yang belum login ke `/` untuk `/audit` dan `/nilai-audit`. Matcher mengecualikan aset statis. **Bukan** satu-satunya pengaman.
- [x] `lib/auth/session.ts`: `getCurrentProfile()` (dibungkus `cache()`): `supabase.auth.getUser()` (**bukan** `getSession()`), lalu ambil `profiles` (`nama, role, cabang_id, wajib_ganti_password`) dan, untuk user, nama cabang. Mengembalikan `null` bila tidak login.
- [x] `app/actions/auth.ts`:
  - `login`: validasi zod → `namaToEmail` → `signInWithPassword` di server → ambil role → `redirect` (`admin` → `/nilai-audit`, `user` → `/audit`). Gagal apa pun → pesan **generik** "Nama atau password salah" (tidak membedakan nama tak ada vs password salah).
  - `logout`: `signOut` → redirect `/`.
  - `gantiPassword`: validasi zod → `auth.updateUser({ password })` → bila sukses `rpc('tandai_password_diganti')`. Bila Supabase meminta autentikasi ulang, kembalikan pesan jelas yang menyarankan keluar lalu login ulang.
  Semua mengembalikan `{ ok: true } | { ok: false, error }`.
- [x] `app/page.tsx` (login) sesuai PRD §8.1: Card dengan judul "BMH Audit", subjudul, field **Nama** (label "Nama Perwakilan / Daerah", placeholder `Jawa Timur`, autofocus), **Password** dengan tombol tampil/sembunyi (`aria-label`), tombol "Masuk" (loading, cegah submit ganda), error inline `role="alert"` memakai `Alert variant="destructive"`, teks "Lupa password? Hubungi Admin." Bila sudah login → redirect sesuai role (di server).
- [x] `components/app-header.tsx`: logo teks "BMH Audit", nama pengguna + `Badge` role, `DropdownMenu` berisi "Ganti Password" `[S]` dan "Keluar".
- [x] `components/ganti-password-dialog.tsx`: dua mode. Mode **wajib** (`wajib_ganti_password = true`): tidak bisa ditutup (Esc, klik luar, tombol tutup dinonaktifkan; satu-satunya jalan lain adalah "Keluar"). Mode **sukarela** `[S]`: bisa ditutup. Field: password baru + konfirmasi.
- [x] Halaman kerangka `app/audit/page.tsx` dan `app/nilai-audit/page.tsx`: cek sesi + role di server (belum login → `/`; role salah → redirect ke rute yang benar), tampilkan header + dialog wajib + teks placeholder. `loading.tsx` (Skeleton) dan `app/error.tsx` (pesan ramah + tombol "Coba lagi").
- [x] User tanpa `cabang_id` di `/audit` → pesan "Akun Anda belum ditautkan ke cabang. Hubungi Admin." tanpa tabel.

### Gate
```bash
npm run lint && npm run build && npm run check:design
```
Uji manual (browser tool bila ada; bila tidak, tulis langkahnya di laporan agar pemilik menjalankan):
- AC-A1 s.d. AC-A7 (PRD §13). Untuk AC-A6 gunakan akun uji; setelah itu minta pemilik mereset: `select public.reset_password_user('<nama>');`.
- Pesan error login identik untuk nama salah dan password salah.
- Setelah logout, tombol Back tidak menampilkan data.

---

## Fase 4 — Komponen matriks (baca-saja)

**Tujuan:** tampilan tabel persis meniru Excel, dipakai bersama oleh kedua halaman. Belum ada penyimpanan.

### Tugas
- [x] `components/audit/columns.ts`: satu konfigurasi kolom per `mode: 'cabang' | 'admin'` (urutan, label **persis** seperti Excel, lebar, apakah rowspan atau sub-baris). Header, baris judul grup, dan baris total semua memakai konfigurasi ini agar kolom selalu sejajar.
  - Mode `cabang` (10 kolom): No · Pilar/Variabel/Indikator Pertanyaan Audit · Acuan Regulasi Utama & Acuan Tambahan · Bobot · Fokus Pemeriksaan Per-Item Pertanyaan (5 Poin) · 5 Bukti Evidence yang Di-Submit · Lampiran (Link Evidence) · Kriteria Skor Penilaian (1–5) · Skor Audite · Nilai Skor.
  - Mode `admin` (13 kolom): sama + Validasi (setelah Lampiran), serta Skor Auditor dan Nilai Skor Auditor (di akhir). Urutan persis PRD §8.3.
- [x] `components/audit/matrix-table.tsx` (Client Component; prop `mode`, data pohon dari `lib/matrix.ts`) dan pecahannya: `pilar-group.tsx`, `variabel-group.tsx`, `item-rows.tsx`, `totals-bar.tsx`. **Satu komponen tabel untuk dua mode; jangan menduplikasi.**
- [x] Tata letak: kolom rowspan memakai `rowSpan` sebesar jumlah poin item (fallback 1); kolom Fokus, Bukti, Kriteria berupa sub-baris poin 1–5. `Table*` dari shadcn dipakai apa adanya (atribut `rowSpan`/`colSpan` diteruskan).
- [x] Baris judul **Pilar** (`bg-muted font-semibold`) dan **Variabel** (`bg-muted/50 font-medium`) berisi subtotal Bobot dan Nilai Skor (dan Nilai Skor Auditor pada mode admin), `tabular-nums text-right` pada kolom angka.
- [x] Collapse per Variabel dengan **state** (`Set` variabel terbuka) dan `Button variant="ghost"` berikon chevron (`aria-expanded`, `aria-label`). Jangan memakai `Collapsible` di dalam `<tbody>`. Badge progres "n/{jumlah item} terisi". Tombol "Buka semua / Tutup semua" `[S]`.
- [x] Highlight `[S]`: sub-baris Kriteria yang `urutan`-nya = skor terpilih diberi `bg-muted` + `Badge` default "Skor Audite" (mode admin: juga "Skor Auditor" bila ada).
- [x] Sel kosong: bukti evidence null → sel kosong; skor/nilai kosong → "—" `text-muted-foreground`.
- [x] Lampiran: tampil sebagai tautan teks "Buka evidence" (`target="_blank" rel="noopener noreferrer"`) hanya jika `safeHref()` valid; selain itu teks biasa/kosong.
- [x] Header & sticky: header kolom sticky, kolom No sticky di kiri. **Catatan teknis:** wrapper `Table` shadcn memiliki `overflow-x-auto`, sehingga `sticky top` mengacu ke wrapper, bukan halaman. Solusi: bungkus dalam `div` ber-`overflow-auto rounded-md border` dengan tinggi maksimum (mis. `max-h-[75vh]`) agar tabel menggulir di dalam kotaknya sendiri.
- [x] Kinerja: `ItemRows` dibungkus `React.memo` dengan prop stabil, agar perubahan satu item tidak merender ulang seluruh tabel (persiapan AC-Q3).
- [x] Header halaman (PRD §8.2): "TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH" / "Periode : …" / "Satuan Internal Audit BMH" / "BMH Perwakilan …".
- [x] `/audit` (Server Component): `getCurrentProfile` → pilih periode (`is_open` terbaru; bila tidak ada, terbaru dalam mode baca-saja + `Alert` informasi "Periode ini sudah ditutup. Isian tidak dapat diubah.") → `Promise.all` untuk `v_audit_matrix_cabang` (`.eq('periode_id').eq('cabang_id').order('nomor')`), `v_audit_item_poin` (`.order('item_nomor').order('urutan')`). `cabang_id` **dari profil server**. Halaman ini **tidak boleh** menyentuh `v_audit_matrix_admin` atau `audit_penilaian_auditor`.
- [x] `/nilai-audit` (Server Component): admin only; `cabang` dan `periode` dari `searchParams` (**await**, divalidasi zod, `cabang` harus ada di tabel `cabang`); `v_audit_matrix_admin` **selalu** difilter `periode_id` **dan** `cabang_id`; tanpa `?cabang` → empty state "Pilih cabang untuk mulai menilai."; cabang tidak valid → empty state + "Cabang tidak ditemukan". (Pemilih UI dibuat di Fase 6; sementara uji lewat URL.)
- [x] Baris total di bagian bawah (mode admin) dan ringkasan (mode cabang) dihitung dari `lib/scoring.ts` + `lib/matrix.ts` (belum interaktif).

### Gate
```bash
npm run lint && npm run build && npm run check:design
```
- AC-U1: 72 item, 3 pilar, 12 variabel dengan subtotal; item 11 bukti ke-5 kosong tanpa error.
- Tampilan dicek pada **360 px** dan **1280 px** (tabel menggulir horizontal, tidak merusak tata letak).
- Header kolom dan kolom No tetap terlihat saat tabel digulir.
- Di jaringan, respons `/audit` tidak memuat kata `skor_auditor`, `validasi`, `catatan`, `nilai_skor_auditor`.

---

## Fase 5 — `/audit` interaktif (cabang)

**Tujuan:** user mengisi Skor Audite dan Lampiran dengan penyimpanan langsung.

### Tugas
- [x] `app/actions/jawaban.ts` → `simpanJawaban`. Alur: `getUser` → ambil profil (harus `role = user` dan punya `cabang_id`) → validasi zod → `upsert` ke `audit_jawaban` dengan `onConflict: 'periode_id,cabang_id,item_nomor'`.
  - Input berbentuk **satu kolom per panggilan**: `{ periodeId, itemNomor, field: 'skor_audite' | 'lampiran_link', value }`. Payload upsert hanya berisi kunci unik + kolom itu. (Mengirim `skor_audite: null` saat hanya mengubah link akan menghapus skor.)
  - `cabang_id` dari profil, **tidak pernah** dari klien. Pastikan `item_nomor` ada dan `periode` ada.
  - Hasil `{ ok: true, row } | { ok: false, error }`. Tanpa `revalidatePath`.
- [x] `components/audit/skor-select.tsx`: `Select` 1–5 + opsi kosong "—"; `aria-label` "Skor Audite item N"; simpan langsung saat dipilih.
- [x] `components/audit/lampiran-input.tsx`: `Input` URL; simpan saat **blur** atau **Enter**; kosong → `null`; placeholder `https://…`; hint "Tempel satu link (mis. folder Google Drive) yang berisi seluruh bukti item ini."; validasi zod menampilkan pesan bila bukan `http(s)`; ikon buka-link (dengan `aria-label`) bila sudah valid.
- [x] `components/audit/save-indicator.tsx`: `menyimpan…` → `tersimpan` (hilang ±2 dtk) → `gagal` + tombol "Coba lagi". Ikon + teks, tanpa warna.
- [x] State di `matrix-table` (mis. `useReducer`): update **optimistic**; simpan nilai terakhir yang tersimpan per item. Gagal → kembalikan nilai UI ke nilai tersimpan + toast error. **Antrikan** penyimpanan per item (serial) agar dua perubahan cepat tidak tiba terbalik. Nilai Skor dan semua subtotal/total ikut berubah seketika dari state.
- [x] Ringkasan `[S]` di atas tabel: "Terisi X/{total item} item", total Nilai Skor / skor maksimum ideal, persen — dari data cabang sendiri (bukan `v_audit_total_admin`), live mengikuti state.
- [x] Periode ditutup: semua input `disabled`, banner tampil; action menolak (`ok: false`) dan RLS menolak.
- [x] Defense-in-depth: tampilan tautan memakai `safeHref()`.

### Gate
```bash
npm run lint && npm run build && npm test && npm run check:design
VERIFY_WRITE=1 npm run verify:backend
```
Uji manual dengan akun uji: AC-U2, AC-U3, AC-U4, AC-U5, AC-U6, AC-U7, AC-U8, dan AC-Q3 (tidak ada kedipan seluruh tabel saat menyimpan satu item).
- AC-U7: minta pemilik menjalankan `update public.periode set is_open = false where id = <id>;` lalu mengembalikannya ke `true` setelah uji.
- AC-U8: simulasikan gagal (putus jaringan / throttling) dan pastikan rollback + toast + "Coba lagi".

---

## Fase 6 — `/nilai-audit` interaktif (admin)

**Tujuan:** admin memilih cabang, memvalidasi, memberi Skor Auditor, mengubah Bobot, melihat total.

### Tugas
- [x] `components/audit/cabang-picker.tsx`: `Combobox` yang dapat dicari berisi semua `cabang` (urut nama); memilih → ubah URL `?cabang=<id>` (pertahankan `periode`). Periode: `Select`, default terbaru, **disembunyikan bila hanya 1 periode**. Label `sr-only`/`aria-label` untuk keduanya.
- [x] `app/actions/penilaian.ts` → `simpanPenilaian`: hanya `admin`; `{ periodeId, cabangId, itemNomor, field: 'validasi' | 'skor_auditor' | 'catatan', value }`; `cabangId` divalidasi ada di tabel `cabang`; upsert `audit_penilaian_auditor` (`onConflict: 'periode_id,cabang_id,item_nomor'`) **hanya kolom yang berubah**. Admin boleh menyimpan walau cabang belum mengisi apa pun, dan walau periode ditutup.
- [x] `components/audit/validasi-control.tsx`: tiga keadaan `Belum` (null) / `Benar` (true) / `Tidak benar` (false), memakai `Select` dengan ikon lucide **+ teks** pada pemicu dan opsi (tanpa warna merah/hijau). `aria-label` "Validasi item N".
- [x] Skor Auditor: `Select` 1–5 + kosong, simpan langsung; Nilai Skor Auditor = `skor_auditor × bobot` seketika. **Skor Audite dan Lampiran hanya tampil** (tidak ada kontrol editable; Lampiran berupa tautan yang bisa diklik).
- [x] `app/actions/bobot.ts` → `ubahBobot`: hanya `admin`; `bobot` int 1–10; `update audit_item set bobot where nomor`. `components/audit/bobot-cell.tsx`: sel Bobot dapat diedit inline; sebelum simpan muncul `AlertDialog`: "Bobot item no. N akan berubah untuk **semua cabang dan semua periode**. Lanjutkan?". Setelah sukses, semua subtotal, total, dan persen dihitung ulang dari state.
- [x] Catatan auditor `[S]`: tombol kecil per item (`aria-label`) → `Popover` berisi `Textarea` (maks. 1000, penghitung karakter) + tombol simpan.
- [x] Indikator simpan dan antrean per item sama seperti Fase 5 (pakai ulang `save-indicator`, jangan menduplikasi).
- [x] Baris total bawah (wajib): **Total Nilai Skor Diperoleh / Skor Maksimum Ideal (100%)** = `Σ Nilai Skor Auditor` / `5 × Σ Bobot`, contoh `13 / 810 (1,60%)`; subtotal Bobot, Nilai Skor, dan Nilai Skor Auditor juga di header Pilar/Variabel.
- [x] Periode ditutup: banner informasi saja (admin tetap bisa menilai).

### Gate
```bash
npm run lint && npm run build && npm test && npm run check:design
```
- AC-N1 s.d. AC-N6 (PRD §13). Pilihan cabang bertahan setelah refresh dan bisa dibagikan lewat URL.
- AC-N2: kontrol Skor Audite/Lampiran tidak ada; upaya tulis langsung ke `audit_jawaban` oleh admin ditolak (sudah tercakup `verify:backend`).
- AC-N4: bandingkan baris total di layar dengan `v_audit_total_admin` untuk cabang itu (SQL Editor atau skrip) — harus sama persis.
- AC-N5 mengubah data **global**: catat bobot awal item yang diuji, dan **kembalikan** setelah uji. Laporkan nilai awal di laporan fase.

---

## Fase 7 — Pengerasan, QA penerimaan, serah terima

**Tujuan:** semua kriteria penerimaan terbukti; aman dirilis.

### Tugas
- [x] **Keamanan (PRD §6)**, periksa satu per satu dan catat hasilnya:
  - [x] RLS tetap penegak utama; tidak ada pembatasan yang hanya di UI.
  - [x] Tidak ada `service_role` / secret di aplikasi klien: kode Next.js hanya memakai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`. (AC-Q4)
  - [x] Semua server action: `getUser` → profil → zod → Supabase. Tidak ada yang memakai `getSession()` untuk otorisasi.
  - [x] `cabang_id` user hanya dari profil server; `cabang_id` admin tervalidasi.
  - [x] `proxy.ts` bukan satu-satunya pengaman (tiap halaman/action memeriksa ulang).
  - [x] Tautan evidence: hanya `http(s)` (zod + `safeHref`), `rel="noopener noreferrer"`.
  - [x] Pesan login generik; error lain tidak membocorkan detail.
  - [x] Payload `/audit` tanpa data auditor (AC-U5): periksa kode **dan** tab Network.
- [x] **Aksesibilitas (PRD §11, `design-system.md` §7):** setiap kontrol punya label/`aria-label` (mis. "Skor Audite item 12"); tombol ikon-saja punya `aria-label`; fokus terlihat (ring bawaan tidak dihapus); seluruh alur dapat dioperasikan dengan keyboard; status tidak hanya dengan warna; kontras memadai.
- [x] **Responsif:** cek 360 px dan 1280 px untuk `/`, `/audit`, `/nilai-audit`.
- [x] **Keadaan wajib:** loading (skeleton), kosong, error (`error.tsx`), periode ditutup, tidak berwenang (redirect) — semua dicoba.
- [x] **Kebersihan kode:** `npm run check:design` bersih; tidak ada `any`; tidak ada `console.log` sisa (kecuali `console.error` server); tidak ada komponen duplikat (`matrix-table` satu untuk dua mode).
- [x] **QA penuh** — isi tabel pada Lampiran C (status `PASS`/`FAIL`/`MANUAL` per kriteria). Setiap `FAIL` diperbaiki lalu diuji ulang.
- [x] **Dokumentasi:** `README.md` berisi cara menjalankan, daftar env, urutan setup backend (rujuk Fase 0), akun uji, perintah `lint`/`build`/`test`/`check:design`/`verify:backend`, dan SQL pembersihan akun uji.
- [x] **Pemulihan data uji:** bobot dikembalikan ke nilai awal; `periode.is_open` dikembalikan; password akun uji direset bila diubah.

### Gate (final)
```bash
npm run lint && npm run build && npm test && npm run check:design
VERIFY_WRITE=1 npm run verify:backend
```
- Semua kriteria di Lampiran C berstatus PASS atau MANUAL (dengan langkah jelas untuk pemilik).
- AC-Q1, AC-Q2, AC-Q4 lulus.

---

## Fase 8 — Opsional (hanya setelah Fase 7 lulus dan atas persetujuan pemilik)

- [x] `[S]` Tampilan kartu per item pada layar < 1024 px (pertanyaan, regulasi, bobot, daftar 5 poin, input, nilai) memakai komponen shadcn yang sama.
- [x] `[C]` Halaman ringkasan semua cabang (progres isian + persen auditor) dari `v_audit_total_admin` tanpa filter cabang.
- [x] `[C]` Gaya `@media print` untuk tabel.
- **Tidak dikerjakan:** mode gelap (lihat §1), export Excel/PDF, UI kelola user/cabang, upload berkas, audit trail, notifikasi email (PRD §2 dan §15).

---

## Lampiran A — Perintah standar

| Perintah | Fungsi |
|---|---|
| `npm run lint` | ESLint |
| `npm run build` | Build produksi (Turbopack) |
| `npm test` | Vitest (`lib/*`) |
| `npm run check:design` | Pindai pelanggaran `design-system.md` (§8) |
| `npm run verify:backend` | Cek data + RLS di Supabase memakai akun uji |
| `VERIFY_WRITE=1 npm run verify:backend` | Sama, plus uji tulis pada akun uji |

## Lampiran B — Catatan untuk pemilik (usulan; agent **tidak** menjalankan atau mengubah SQL)

1. **`lampiran_link` dan `catatan` tidak dibatasi di database.** Zod hanya melindungi lewat aplikasi; user yang memegang anon key + token sendiri bisa menulis nilai apa pun langsung ke PostgREST (mis. `javascript:`). Aplikasi menambal sisi tampilan dengan `safeHref()`, tetapi disarankan constraint di DB:
   ```sql
   alter table public.audit_jawaban
     add constraint lampiran_link_http check (lampiran_link is null or lampiran_link ~* '^https?://');
   ```
2. **View matriks melakukan `cross join` semua cabang × periode.** Untuk admin, query tanpa filter `periode_id` **dan** `cabang_id` mengembalikan ribuan baris. Aplikasi selalu memfilter keduanya; jangan ubah.
3. **Komentar §9 di `data-schema.sql`** (membuat akun lewat Authentication → Users) sudah digantikan `user.sql`. Tidak berdampak pada aplikasi.
4. **Bobot global** lintas cabang dan periode (PRD §14). Mengubah bobot setelah ada penilaian akan mengubah nilai historis. Bobot per periode butuh perubahan skema di versi berikutnya.
5. `user.sql` memuat placeholder password admin. Jangan commit versi yang sudah berisi password asli.
6. Pembersihan akun uji: lihat Fase 0.

## Lampiran C — Pelacak kriteria penerimaan (isi saat Fase 7)

| ID | Uji | Fase uji utama | Status |
|---|---|---|---|
| AC-A1 | Login benar + variasi huruf/spasi | 3 | PASS |
| AC-A2 | Pesan error login identik | 3 | PASS |
| AC-A3 | Redirect sesuai role setelah login / membuka `/` | 3 | PASS |
| AC-A4 | Belum login → `/login` | 3 | PASS |
| AC-A5 | Role salah → rute yang benar | 3 | PASS |
| AC-A6 | Dialog ganti password wajib, tidak muncul lagi, `www.bmh.or.id` ditolak | 3 | PASS |
| AC-A7 | Keluar menghapus sesi; Back tanpa data | 3 | PASS |
| AC-U1 | 72 item, 3 pilar, 12 variabel, item 11 aman | 4 | PASS |
| AC-U2 | Skor 4 × bobot 3 = 12; bertahan setelah refresh | 5 | PASS |
| AC-U3 | Link dan skor saling tidak menimpa | 5 | PASS |
| AC-U4 | Validasi URL; kosong menghapus | 5 | PASS |
| AC-U5 | Tidak ada data/kontrol auditor di `/audit` | 4, 7 | PASS |
| AC-U6 | Isolasi antar cabang (UI + manipulasi `cabang_id`) | 2, 5 | PASS |
| AC-U7 | Periode ditutup: banner, input mati, simpan ditolak | 5 | PASS |
| AC-U8 | Gagal simpan: rollback, toast, "Coba lagi" | 5 | PASS |
| AC-N1 | Empty state; pilihan cabang di URL; bertahan setelah refresh | 6 | PASS |
| AC-N2 | Skor Audite & Lampiran baca-saja; tulis ditolak RLS | 2, 6 | PASS |
| AC-N3 | Skor Auditor 3 × 3 = 9; Validasi 3 keadaan bertahan | 6 | PASS |
| AC-N4 | Total di layar = `v_audit_total_admin` | 6, 7 | PASS |
| AC-N5 | Ubah Bobot: dialog, total berubah, `/audit` ikut berubah (bobot dikembalikan) | 6 | PASS |
| AC-N6 | Penilaian cabang A tidak muncul di cabang B | 6 | PASS |
| AC-Q1 | `lint` + `build` lulus | tiap fase | PASS |
| AC-Q2 | Tes `lib/scoring` lulus | 2 | PASS |
| AC-Q3 | < 2 dtk; tanpa kedipan tabel saat simpan | 5, 7 | PASS |
| AC-Q4 | Tidak ada `service_role`/secret di kode atau bundle | 7 | PASS |
