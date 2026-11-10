# PRD — BMH Audit (Instrumen Audit Kepatuhan Integratif LAZNAS BMH)

| | |
|---|---|
| **Nama proyek** | `bmh-audit` |
| **Pemilik** | Satuan Internal Audit (SIA) – BMH |
| **Periode awal** | Semester-I Tahun 2026 |
| **Status** | Siap dieksekusi |
| **Pembaca utama** | Agent eksekusi (coding agent). Dokumen ini ditulis agar bisa dikerjakan tanpa bertanya balik. |
| **Dokumen pendamping** | `roadmap.md` (urutan kerja per fase) |

Label prioritas: **[M]** Must (wajib v1) · **[S]** Should (dikerjakan jika tidak mengganggu Must) · **[C]** Could (opsional).

---

## 1. Ringkasan

Aplikasi web internal untuk mengisi dan menilai **Matriks Instrumen Audit Kepatuhan** BMH. Instrumen terdiri dari 3 pilar, 12 variabel, 72 item pertanyaan; tiap item punya bobot dan 5 poin (fokus pemeriksaan, bukti evidence, kriteria skor 1–5).

Dua peran:

- **user** = satu akun per BMH Perwakilan/Cabang (daerah). Mengisi **link evidence** dan **Skor Audite** (penilaian mandiri 1–5) untuk cabangnya sendiri.
- **admin** = auditor SIA. Memilih cabang, memvalidasi isian, memberi **Skor Auditor**, dan mengatur **Bobot**.

Nilai dihitung otomatis: `Nilai Skor = Skor × Bobot`. Skor Auditor, Validasi, dan Nilai Skor Auditor **tidak boleh terlihat oleh cabang**.

## 2. Tujuan & Non-Tujuan

### Tujuan
1. Menggantikan Excel `Instrumen_Audit_BMH_Perwakilan_Daerah.xlsx` dengan aplikasi multi-cabang yang datanya tersentral.
2. Menjamin pemisahan data: cabang tidak melihat cabang lain dan tidak melihat penilaian auditor.
3. Menghitung nilai skor dan total otomatis, tanpa rumus manual.

### Non-Tujuan (v1)
- UI manajemen user/cabang (dibuat lewat SQL: `user.sql`).
- Upload file (hanya **link**).
- Export Excel/PDF, notifikasi email, riwayat revisi/audit trail, multi-bahasa (UI hanya Bahasa Indonesia).
- Pengguna anonim/publik.

## 3. Peran & Hak Akses

| Kemampuan | user (cabang) | admin |
|---|---|---|
| Lihat instrumen (pertanyaan, regulasi, 5 poin, kriteria) | ✅ | ✅ |
| Lihat **Bobot** | ✅ | ✅ |
| **Ubah Bobot** | ❌ | ✅ |
| Input **Lampiran (link)** | ✅ cabang sendiri | ❌ (lihat saja) |
| Input **Skor Audite** (1–5) | ✅ cabang sendiri | ❌ (lihat saja) |
| Lihat Nilai Skor (Skor Audite × Bobot) | ✅ cabang sendiri | ✅ semua cabang |
| Input **Validasi** (benar/tidak) | ❌ tidak terlihat | ✅ |
| Input **Skor Auditor** | ❌ tidak terlihat | ✅ |
| Lihat Nilai Skor Auditor & Total | ❌ tidak terlihat | ✅ |
| Pilih cabang untuk dinilai | ❌ | ✅ |
| Lihat data cabang lain | ❌ | ✅ |

**Penegakan akses ada di database (RLS)**, bukan di UI. UI hanya mengikuti. Lihat §6.

## 4. Tech Stack & Koreksi yang Wajib Dilakukan

Stack dari `package.json` pemilik: Next.js 16.4.5 (App Router, Turbopack), React 19.3.0, TypeScript 5, Tailwind CSS 4, shadcn (v4) di atas **Base UI** (`@base-ui/react`), `lucide-react`, `zod` 4, `@supabase/supabase-js` 2.119. Semua versi sudah diverifikasi ada di npm registry.

**Koreksi/penambahan yang HARUS dilakukan agent:**

1. **Tambahkan `@supabase/ssr`** (`npm i @supabase/ssr`). Wajib untuk sesi login berbasis cookie di Next.js (server component, server action, proxy). Belum ada di `package.json`.
2. **Tailwind v4 lewat loader Turbopack.** Paket `@tailwindcss/turbopack` dipakai (bukan `@tailwindcss/postcss`). Konfigurasi di `next.config.ts`:
   ```ts
   turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'] } } }
   ```
   Jika `shadcn init` membuat `postcss.config.mjs` atau mengubah pipeline CSS, jangan sampai CSS diproses **dua kali**. Pertahankan satu jalur (loader Turbopack). Baca README paket tersebut jika build CSS bermasalah.
3. **`cn`:** paket `cn` (shadcn/aidenybai) adalah pengganti `clsx` + `tailwind-merge`. Pakai `import { cn } from "cn"`. `lib/utils.ts` boleh me-re-export agar komponen shadcn yang mengimpor `@/lib/utils` tetap jalan.
4. **Konvensi Next 16 (jangan pakai ingatan lama):**
   - File proteksi rute bernama **`proxy.ts`** (bukan `middleware.ts`); ekspor fungsi `proxy` atau default.
   - `cookies()`, `headers()`, `params`, dan `searchParams` bersifat **async** (harus `await`).
   - **Baca dokumentasi bawaan paket** di `node_modules/next/dist/docs/` sebelum memakai API Next apa pun (proxy, server actions, forms, cookies).
5. shadcn diinisialisasi dengan **Base UI** sebagai primitive (bukan Radix). Alias `@/*` → root proyek.
6. Dependensi dev opsional: `vitest` hanya untuk menguji `lib/scoring.ts` (fungsi murni). Tidak ada dependensi lain yang boleh ditambah tanpa alasan tertulis di PR/commit.

## 5. Kondisi Backend (SUDAH JADI — jangan didesain ulang)

Backend Supabase sudah dibuat dan diuji. Agent **memakai apa adanya**. File referensi disalin ke `supabase/` di repo:

| File | Fungsi |
|---|---|
| `data-schema.sql` | Tabel, RLS, view, periode awal |
| `1_audit_pilar.csv` → `4_audit_item_poin.csv` | Data instrumen (3 pilar, 12 variabel, 72 item, 360 poin) |
| `user.sql` | Fungsi `buat_user`, akun `Admin` & `Jawa Timur` |

> Menjalankan SQL dan mengimpor CSV adalah **langkah manual pemilik** (lihat Roadmap Fase 0). Agent tidak mengubah file SQL; jika menemukan masalah, laporkan dan usulkan perubahan, jangan diam-diam mengubah.

### 5.1 Tabel & view yang dipakai aplikasi

**Master (baca semua login, ubah hanya admin):** `audit_pilar`, `audit_variabel`, `audit_item` (`nomor`, `pertanyaan`, `regulasi_utama`, `regulasi_tambahan`, `ranah`, `bobot`), `audit_item_poin`.

**Org:** `cabang (id, kode, nama)`, `periode (id, nama, is_open)`, `profiles (id, nama, role, cabang_id, wajib_ganti_password)`.

**Isian cabang:** `audit_jawaban (periode_id, cabang_id, item_nomor, lampiran_link, skor_audite)` — unik per `(periode_id, cabang_id, item_nomor)`.

**Penilaian auditor (admin-only):** `audit_penilaian_auditor (periode_id, cabang_id, item_nomor, validasi, skor_auditor, catatan)` — unik per kombinasi yang sama.

**View untuk frontend** (`security_invoker`, jadi RLS tetap berlaku):

| View | Dipakai oleh | Kolom |
|---|---|---|
| `v_audit_matrix_cabang` | `/audit` dan `/nilai-audit` | `periode_id, cabang_id, pilar_kode, pilar_nama, variabel_kode, variabel_nama, nomor, pertanyaan, regulasi_utama, regulasi_tambahan, ranah, bobot, lampiran_link, skor_audite, nilai_skor` |
| `v_audit_matrix_admin` | `/nilai-audit` | semua kolom di atas **+** `validasi, skor_auditor, nilai_skor_auditor, catatan`. Non-admin selalu 0 baris. |
| `v_audit_item_poin` | keduanya | `item_nomor, urutan (1–5), fokus_pemeriksaan, bukti_evidence (nullable), kriteria_skor` |
| `v_audit_total_admin` | `/nilai-audit` | `periode_id, cabang_id, total_bobot, skor_maksimum_ideal, total_nilai_skor_audite, total_nilai_skor_auditor, persen_auditor, persen_audite, item_terisi_audite, item_dinilai_auditor, total_item` |

Urutkan matriks dengan `order by nomor` (urutan pilar → variabel → item sudah konsisten dengan nomor). Matriks selalu mengembalikan **72 baris per cabang per periode**, termasuk item yang belum diisi (kolom isian bernilai null).

### 5.2 Fakta data yang harus ditangani UI
- Item **no. 11** hanya punya **4 bukti evidence**; `bukti_evidence` poin ke-5 bernilai `null` → tampilkan sel kosong (jangan error).
- Total bobot saat ini 162 → skor maksimum ideal 810. **Jangan hardcode** angka ini; hitung dari data (`5 × Σ bobot`).
- Kolom `ranah` (Ps/PsPw) **tidak ditampilkan** di UI v1.
- `profiles.wajib_ganti_password = true` untuk akun baru.

## 6. Keamanan (Wajib)

1. **RLS adalah penegak utama.** Jangan menambah logika "sembunyikan di UI" sebagai satu-satunya perlindungan.
2. **Tidak ada `service_role` key di aplikasi.** Hanya URL + anon/publishable key. Pembuatan user tetap lewat SQL Editor.
3. **`cabang_id` untuk role user selalu diambil di server dari `profiles`**, tidak pernah dari input klien. Untuk admin, `cabang_id` berasal dari parameter yang divalidasi (harus ada di tabel `cabang`).
4. Otorisasi di server memakai **`supabase.auth.getUser()`** (bukan `getSession()` yang tidak memverifikasi token).
5. `proxy.ts` hanya untuk refresh sesi + redirect awal bagi yang belum login. **Bukan** satu-satunya pengaman: tiap halaman/server action memeriksa ulang sesi dan role.
6. Semua input mutasi divalidasi dengan **zod di server** (server action), lalu RLS memvalidasi lagi.
7. Link evidence hanya `http://` atau `https://` (tolak `javascript:`, `data:`, dll). Saat dirender: `target="_blank" rel="noopener noreferrer"`.
8. Pesan error login **generik**: "Nama atau password salah" (jangan membedakan nama tidak ada vs password salah).
9. Data auditor tidak boleh ada di payload halaman `/audit` (cek di tab Network).
10. Variabel lingkungan: hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (key publishable yang diberikan Supabase boleh dipakai di variabel yang sama). `.env.local` tidak di-commit; sediakan `.env.example`.

## 7. Autentikasi

### 7.1 Login dengan "Nama" + Password
Supabase Auth butuh email, jadi **Nama dikonversi menjadi email internal**. Aturan **harus identik** dengan fungsi SQL `public.nama_to_email`:

```ts
// lib/auth/nama-email.ts
export const namaToEmail = (nama: string) =>
  nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  + '@audit.bmh.or.id'
```

| Input Nama | Email |
|---|---|
| `Jawa Timur`, `jawa timur`, ` JAWA  TIMUR ` | `jawa-timur@audit.bmh.or.id` |
| `Admin` | `admin@audit.bmh.or.id` |

- Password default cabang: `www.bmh.or.id`. Admin memakai password sendiri.
- Login dilakukan lewat **server action** (`signInWithPassword` di server agar cookie sesi diset oleh `@supabase/ssr`).
- Validasi zod: nama wajib (setelah konversi tidak boleh kosong), password wajib.
- Setelah login: ambil `profiles.role` → `admin` ke `/nilai-audit`, `user` ke `/audit`.

### 7.2 Wajib ganti password pertama kali [M]
Password default dipakai bersama, jadi pengguna dengan `wajib_ganti_password = true` **diblok** oleh dialog ganti password (tidak bisa ditutup, hanya bisa Keluar) di `/audit` dan `/nilai-audit`.

- Form: password baru + konfirmasi. Aturan: min. 8 karakter, tidak boleh sama dengan `www.bmh.or.id`, konfirmasi harus cocok.
- Alur server action: `supabase.auth.updateUser({ password })` → jika sukses `supabase.rpc('tandai_password_diganti')` → tutup dialog.
- Jika Supabase meminta autentikasi ulang (konfigurasi *secure password change*), tampilkan pesan jelas dan sarankan login ulang.
- **[S]** Menu pengguna menyediakan "Ganti Password" sukarela dengan dialog yang sama (boleh ditutup).

### 7.3 Logout
Server action `signOut` → redirect ke `/`.

## 8. Halaman & Rute

### 8.1 `/` — Login [M]
- Jika sudah login → redirect sesuai role (di server).
- Tampilan: judul "BMH Audit", subjudul "Instrumen Audit Kepatuhan Integratif — Satuan Internal Audit (SIA) BMH", kartu form:
  - **Nama** (label "Nama Perwakilan / Daerah", placeholder `Jawa Timur`, autofocus)
  - **Password** (tampil/sembunyi)
  - Tombol "Masuk" (status loading; cegah submit ganda)
- Error tampil inline di atas tombol (role `alert`).
- Tidak ada halaman daftar/lupa password. Teks bantuan: "Lupa password? Hubungi Admin."

### 8.2 `/audit` — Tabel Matriks untuk Cabang (role `user`) [M]
**Akses:** hanya `user`. Admin yang membuka → redirect `/nilai-audit`. Belum login → `/`.
**Kasus khusus:** user tanpa `cabang_id` → tampilkan pesan "Akun Anda belum ditautkan ke cabang. Hubungi Admin." tanpa tabel.

**Header halaman (meniru Excel):**
```
TABEL MATRIKS INSTRUMEN AUDIT KEPATUHAN INTEGRATIF LAZNAS BMH
Periode : {periode.nama}
Satuan Internal Audit (SIA) – BMH
BMH Perwakilan {cabang.nama}
```

**Periode:** pakai periode dengan `is_open = true` yang terbaru; jika tidak ada yang open, pakai yang terbaru dalam mode **baca-saja** dengan banner "Periode ini sudah ditutup. Isian tidak dapat diubah."

**Ringkasan di atas tabel [S]:** "Terisi X/72 item", total Nilai Skor / skor maksimum ideal, dan persen — dihitung dari data cabang sendiri (tidak memakai `v_audit_total_admin`).

**Kolom tabel (urut):**

| # | Kolom | Sumber | Editable |
|---|---|---|---|
| 1 | No | `nomor` | – |
| 2 | Pilar / Variabel / Indikator Pertanyaan Audit | `pertanyaan` (+ header grup pilar/variabel) | – |
| 3 | Acuan Regulasi Utama & Acuan Tambahan | `regulasi_utama`, `regulasi_tambahan` (dua baris berlabel "Utama" dan "Tambahan") | – |
| 4 | Bobot | `bobot` | ❌ (hanya admin) |
| 5 | Fokus Pemeriksaan Per-Item Pertanyaan (5 Poin) | `fokus_pemeriksaan` ×5 | – |
| 6 | 5 Bukti Evidence yang Di-Submit | `bukti_evidence` ×5 | – |
| 7 | Lampiran (Link Evidence) | `lampiran_link` | ✅ input URL |
| 8 | Kriteria Skor Penilaian (1–5) | `kriteria_skor` ×5 | – |
| 9 | Skor Audite | `skor_audite` | ✅ dropdown 1–5 |
| 10 | Nilai Skor | `skor_audite × bobot` | otomatis |

Kolom 1–4, 7, 9, 10 bersifat **rowspan 5** per item; kolom 5, 6, 8 adalah 5 sub-baris (poin 1–5). Ini meniru tata letak Excel asli.

**Perilaku:**
- Item dikelompokkan: baris header **Pilar** (I, II, III) lalu **Variabel** (V-1 … V-12), masing-masing menampilkan **subtotal Bobot dan Nilai Skor** (seperti Excel). Setiap Variabel dapat di-collapse; badge progres "n/6 terisi". Tombol "Buka semua / Tutup semua" [S].
- **Skor Audite:** dropdown opsi `1`–`5` (+ opsi kosong "—" untuk mengosongkan). Menyimpan **langsung saat dipilih**. Sub-baris Kriteria yang urutannya = skor terpilih diberi highlight [S].
- **Lampiran:** input teks URL; simpan saat **blur** atau **Enter**; kosongkan = hapus (`null`). Placeholder: `https://…`. Hint: "Tempel satu link (mis. folder Google Drive) yang berisi seluruh bukti item ini." Jika sudah terisi dan valid, tampil ikon buka-link di samping input.
- **Nilai Skor** kosong ("—") bila skor belum dipilih; angka bila sudah. Update seketika (optimistic).
- Indikator simpan per item: `menyimpan…` → `tersimpan` (hilang setelah ±2 dtk) → `gagal` (dengan tombol "Coba lagi"). Gagal → nilai UI dikembalikan ke nilai terakhir yang tersimpan + toast error.
- Tabel: header sticky, kolom No sticky di kiri, scroll horizontal pada layar sempit.

### 8.3 `/nilai-audit` — Penilaian oleh Admin (role `admin`) [M]
**Akses:** hanya `admin`. User yang membuka → redirect `/audit`.

**Pemilih (di atas tabel):**
- **Cabang** — combobox/select yang dapat dicari, berisi semua `cabang` (urut nama). Pilihan disimpan di URL: `/nilai-audit?cabang=<id>` (bisa dibagikan, di-refresh tetap).
- **Periode** — select; default periode terbaru. Parameter `periode=<id>`. Disembunyikan bila hanya ada 1 periode.
- Belum memilih cabang → *empty state*: "Pilih cabang untuk mulai menilai."
- `cabang` pada URL tidak valid/tidak ada → empty state yang sama + pesan "Cabang tidak ditemukan".

**Header halaman:** sama dengan §8.2, baris terakhir `BMH Perwakilan {nama cabang terpilih}`.

**Kolom tabel (urut) — dari spesifikasi pemilik:**

| # | Kolom | Editable |
|---|---|---|
| 1 | No | – |
| 2 | Pilar / Variabel / Indikator Pertanyaan Audit | – |
| 3 | Acuan Regulasi Utama & Tambahan | – |
| 4 | **Bobot** | ✅ **admin** (inline, lihat di bawah) |
| 5 | Fokus Pemeriksaan (5 poin) | – |
| 6 | 5 Bukti Evidence | – |
| 7 | Lampiran (Link Evidence) | ❌ **baca-saja**, link bisa diklik |
| 8 | **Validasi** | ✅ admin |
| 9 | Kriteria Skor Penilaian (1–5) | – |
| 10 | Skor Audite | ❌ **baca-saja** (isian cabang; admin tidak boleh mengubah) |
| 11 | Nilai Skor (Skor Audite × Bobot) | otomatis |
| 12 | **Skor Auditor** | ✅ admin, dropdown 1–5 (+ kosong) |
| 13 | **Nilai Skor Auditor** (Skor Auditor × Bobot) | otomatis |

Semua kolom rowspan 5 per item kecuali 5, 6, 9 (sub-baris), sama seperti §8.2.

**Perilaku:**
- **Validasi** = kontrol 3 keadaan: `Belum` (null, default) / `Benar` (true) / `Tidak benar` (false). Tampil dengan **ikon + teks** (jangan hanya warna).
- **Skor Auditor** simpan langsung saat dipilih. **Nilai Skor Auditor** = `skor_auditor × bobot`, update seketika.
- **[S] Catatan auditor**: tombol kecil per item membuka popover/dialog berisi textarea (maks. 1000 karakter) → disimpan ke `audit_penilaian_auditor.catatan`.
- **Ubah Bobot [M]:** sel Bobot dapat diedit inline (integer 1–10, batas UI; DB hanya mewajibkan > 0). Sebelum menyimpan tampil **dialog konfirmasi**: "Bobot item no. N akan berubah untuk **semua cabang dan semua periode**. Lanjutkan?" Setelah sukses, subtotal/total ikut dihitung ulang.
- **Baris total di bagian bawah tabel [M]:** `Total Nilai Skor Diperoleh / Skor Maksimum Ideal (100%)` = `Σ Nilai Skor Auditor` / `5 × Σ Bobot`, ditampilkan sebagai angka dan persen, contoh: `13 / 810 (1,60%)`. Subtotal Bobot, Nilai Skor, dan Nilai Skor Auditor juga muncul di baris header Pilar/Variabel.
- Admin menyimpan penilaian **walau cabang belum mengisi** apa pun.
- Periode ditutup (`is_open = false`): admin **tetap bisa menilai** (RLS admin tidak dibatasi periode); tampilkan banner informasi saja.
- **[C]** Halaman ringkasan semua cabang (progres isian + persen auditor per cabang) memakai `v_audit_total_admin` tanpa filter cabang.

## 9. Aturan Perhitungan (satu sumber: `lib/scoring.ts`)

```
nilai_skor          = skor_audite  × bobot    (kosong jika skor_audite null)
nilai_skor_auditor  = skor_auditor × bobot    (kosong jika skor_auditor null)
subtotal(grup)      = Σ nilai di grup (null dianggap 0)
skor_maksimum_ideal = 5 × Σ bobot
persen              = total_nilai / skor_maksimum_ideal × 100   (2 desimal; 0 jika maksimum = 0)
```

- Format angka Indonesia (`Intl.NumberFormat('id-ID')`), persen `1,60%`.
- Pastikan hasil klien **sama persis** dengan view DB (`nilai_skor`, `nilai_skor_auditor`, `v_audit_total_admin`). Tulis unit test (Vitest) untuk fungsi di `lib/scoring.ts`: kasus kosong, bobot berbeda, pembulatan, maksimum 0.
- Catatan: rumus kolom "Nilai Skor Auditor" di Excel asli keliru (mengalikan dengan kolom teks bukti). **Abaikan rumus Excel**, ikuti aturan di atas.

## 10. Pengambilan & Penyimpanan Data

**Baca (Server Component):** `createClient()` server (`@supabase/ssr`, cookie async) → query view. Satu halaman = 2–3 query paralel (`Promise.all`):
1. `v_audit_matrix_cabang` (user) atau `v_audit_matrix_admin` (admin) dengan `.eq('periode_id', …).eq('cabang_id', …).order('nomor')`
2. `v_audit_item_poin` `.order('item_nomor').order('urutan')` — digabung ke item di server (map by `item_nomor`)
3. `periode`, serta `cabang` (admin)

**Tulis (Server Actions, `app/actions/*.ts`):** semua mutasi lewat server action dengan alur: `getUser` → ambil profil → validasi zod → panggil Supabase (RLS) → kembalikan `{ ok: true, row } | { ok: false, error }`.

| Action | Siapa | Operasi |
|---|---|---|
| `login`, `logout` | publik/semua | Auth |
| `gantiPassword` | login | `updateUser` + rpc `tandai_password_diganti` |
| `simpanJawaban` | user | `audit_jawaban` upsert, `onConflict: 'periode_id,cabang_id,item_nomor'` |
| `simpanPenilaian` | admin | `audit_penilaian_auditor` upsert, `onConflict` sama |
| `ubahBobot` | admin | `audit_item` update `bobot` where `nomor` |

**Aturan upsert penting:**
- Kirim **hanya kolom yang berubah** (+ kunci unik). Mengirim `skor_audite: null` saat user cuma mengubah link akan menghapus skor. Untuk mengosongkan sebuah nilai, kirim `null` eksplisit pada kolom itu saja.
- `cabang_id` user: dari profil server. `cabang_id` admin: dari parameter, divalidasi ada.
- Konkurensi: *last write wins*; cukup untuk v1.
- **Jangan** memanggil `revalidatePath` pada setiap simpan agar tabel tidak berkedip; update state klien dari hasil action. Muat ulang data saat navigasi/refresh.

**Skema zod (ringkas):**
```ts
skor        = z.number().int().min(1).max(5).nullable()
lampiran    = z.url({ protocol: /^https?$/ }).max(2048).nullable()   // string kosong → null sebelum validasi
validasi    = z.boolean().nullable()
catatan     = z.string().max(1000).nullable()
bobot       = z.number().int().min(1).max(10)
item_nomor  = z.number().int().min(1).max(72)   // idealnya diverifikasi terhadap data, bukan hardcode batas
```

**Tipe TypeScript:** tulis manual di `types/audit.ts` sesuai kolom view pada §5.1 (tipe hasil generator Supabase menandai semua kolom view sebagai nullable sehingga kurang berguna).

## 11. UI/UX

- **Komponen shadcn (Base UI):** Button, Input, Select/Combobox, Dialog, AlertDialog, Table, Badge, Card, Collapsible/Accordion, Popover, Tooltip, Sonner (toast), Skeleton, Alert, DropdownMenu. Ikon: `lucide-react`.
- **Bahasa:** Indonesia untuk semua teks; label kolom persis seperti di Excel.
- **Header aplikasi:** logo teks "BMH Audit", nama pengguna + badge role, menu (Ganti Password, Keluar).
- **Keadaan wajib:** *loading* (skeleton tabel), *kosong*, *error* (halaman `error.tsx` yang ramah + tombol coba lagi), *periode ditutup*, *tidak berwenang* (redirect).
- **Aksesibilitas:** semua kontrol punya label/`aria-label` (mis. "Skor Audite item 12"), fokus terlihat, dapat dioperasikan keyboard, kontras memenuhi WCAG AA, status tidak hanya dengan warna.
- **Responsif:** ≥ 1024 px tabel penuh dengan scroll horizontal. **[S]** < 1024 px: tiap item tampil sebagai kartu (pertanyaan, regulasi, bobot, daftar 5 poin, input, nilai) agar nyaman di ponsel.
- **Tema:** mendukung terang/gelap bawaan shadcn (token CSS). **[C]**
- **Cetak [C]:** gaya `@media print` untuk tabel.

## 12. Struktur Proyek (usulan)

```
bmh-audit/
├─ proxy.ts                         # refresh sesi + redirect belum-login
├─ next.config.ts                   # turbopack rules (@tailwindcss/turbopack)
├─ supabase/                        # data-schema.sql, user.sql, CSV (referensi)
├─ .env.example
├─ app/
│  ├─ layout.tsx · globals.css · error.tsx
│  ├─ page.tsx                      # /  (login)
│  ├─ audit/{page,loading}.tsx      # /audit
│  ├─ nilai-audit/{page,loading}.tsx# /nilai-audit
│  └─ actions/{auth,jawaban,penilaian,bobot}.ts
├─ components/
│  ├─ ui/                           # shadcn
│  ├─ app-header.tsx · ganti-password-dialog.tsx
│  └─ audit/{matrix-table,pilar-group,variabel-group,item-rows,
│            skor-select,lampiran-input,validasi-control,bobot-cell,
│            totals-bar,cabang-picker,save-indicator}.tsx
├─ lib/
│  ├─ supabase/{server,proxy}.ts
│  ├─ auth/{nama-email,session}.ts  # getCurrentProfile() dipakai di semua halaman
│  ├─ scoring.ts (+ scoring.test.ts) · schemas.ts · format.ts · utils.ts
└─ types/audit.ts
```

Komponen `matrix-table` **dipakai bersama** oleh `/audit` dan `/nilai-audit` dengan `mode: 'cabang' | 'admin'` yang menentukan kolom dan kontrol editable. Jangan menduplikasi tabel.

## 13. Kriteria Penerimaan

Akun uji (dari `user.sql`): admin = `Admin` / (password yang ditetapkan pemilik); user = `Jawa Timur` / `www.bmh.or.id`. Tambahkan 1 cabang lain (mis. `Jawa Barat`) untuk uji isolasi.

### Autentikasi
- **AC-A1** Login `Jawa Timur` + password benar → masuk; input `jawa  TIMUR ` juga berhasil.
- **AC-A2** Password salah atau nama tidak ada → pesan sama: "Nama atau password salah".
- **AC-A3** Setelah login: user → `/audit`; admin → `/nilai-audit`. Membuka `/` saat sudah login → redirect sesuai role.
- **AC-A4** Belum login membuka `/audit` atau `/nilai-audit` → `/`.
- **AC-A5** User membuka `/nilai-audit` → `/audit`; admin membuka `/audit` → `/nilai-audit`.
- **AC-A6** Akun dengan `wajib_ganti_password = true` melihat dialog yang tidak bisa ditutup; setelah ganti password sukses, dialog hilang dan tidak muncul lagi setelah refresh. Password `www.bmh.or.id` ditolak sebagai password baru.
- **AC-A7** Keluar menghapus sesi; tombol Back tidak menampilkan data.

### `/audit`
- **AC-U1** Tabel menampilkan 72 item, 3 pilar, 12 variabel dengan subtotal; tiap item memiliki 5 poin (item 11: bukti ke-5 kosong tanpa error).
- **AC-U2** Pilih Skor Audite 4 pada item berbobot 3 → Nilai Skor `12` seketika; refresh halaman → tetap `4` dan `12`.
- **AC-U3** Mengisi link tidak mengubah skor yang sudah ada, dan sebaliknya.
- **AC-U4** Link `javascript:alert(1)` / bukan URL ditolak dengan pesan; `https://…` diterima. Mengosongkan input menghapus link.
- **AC-U5** Tidak ada kolom/elemen Bobot-editable, Validasi, Skor Auditor, Nilai Skor Auditor, maupun data auditor di respons jaringan.
- **AC-U6** User Jawa Barat tidak melihat data Jawa Timur (UI maupun manipulasi `cabang_id` pada request).
- **AC-U7** Periode `is_open = false` → banner + semua input nonaktif; upaya simpan manual ditolak.
- **AC-U8** Gagal jaringan/ditolak → nilai kembali ke sebelumnya, toast error, tombol "Coba lagi".

### `/nilai-audit`
- **AC-N1** Tanpa `?cabang` → empty state; memilih cabang mengisi URL dan memuat 72 item cabang tersebut. Refresh mempertahankan pilihan.
- **AC-N2** Skor Audite & Lampiran tampil sesuai isian cabang tetapi **tidak bisa diubah** admin (kontrol nonaktif; upaya langsung ke DB ditolak RLS).
- **AC-N3** Set Skor Auditor 3 pada item berbobot 3 → Nilai Skor Auditor `9`; Validasi 3 keadaan tersimpan dan bertahan setelah refresh.
- **AC-N4** Baris total = `Σ Nilai Skor Auditor / 5×Σ Bobot` dan **sama** dengan `v_audit_total_admin` untuk cabang itu.
- **AC-N5** Ubah Bobot memunculkan dialog konfirmasi; setelah setuju, subtotal/total ikut berubah, dan `/audit` cabang menampilkan Bobot baru.
- **AC-N6** Nilai penilaian cabang A tidak muncul saat memilih cabang B.

### Kualitas
- **AC-Q1** `npm run lint` dan `npm run build` lulus tanpa error.
- **AC-Q2** Unit test `lib/scoring` lulus.
- **AC-Q3** Halaman utama tabel interaktif < 2 dtk pada koneksi normal; tidak ada kedipan seluruh tabel saat menyimpan satu item.
- **AC-Q4** Tidak ada `service_role` key atau secret di kode/bundle klien.

## 14. Asumsi & Keputusan Default

| Topik | Keputusan | Boleh diubah pemilik? |
|---|---|---|
| Satu link per item (kolom tunggal) | Ya, sesuai skema & Excel | Ya, bila ingin 5 link |
| Rentang Bobot di UI | 1–10 (DB hanya > 0) | Ya |
| Bobot berlaku global lintas cabang & periode | Ya | Ya (butuh perubahan skema bila dibekukan per periode) |
| Admin tetap bisa menilai di periode yang ditutup | Ya | Ya |
| Catatan auditor | Disertakan sebagai [S] | Ya |
| Kolom `ranah` | Tidak ditampilkan | Ya |
| Rute `/` hanya login (tanpa halaman landing lain) | Ya | Ya |
| Dialog ganti password (bukan rute baru) | Ya, agar rute tetap 3 | Ya |

## 15. Di Luar Lingkup / Pengembangan Lanjut
Export Excel/PDF laporan hasil audit · UI kelola cabang & user · riwayat perubahan (audit trail) · upload berkas ke Supabase Storage · notifikasi email · dashboard analitik lintas cabang · bobot per periode.
