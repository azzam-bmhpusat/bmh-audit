# Laporan Audit Bug & Pengujian E2E — BMH Audit Sistem Internal Kepatuhan

**Tanggal Audit:** 11 November 2026  
**Aplikasi:** Sistem Audit Internal Kepatuhan BMH (Next.js 16 + React 19 + Supabase PostgreSQL)  
**Lingkungan:** Local Dev (`http://localhost:3000`) & Supabase Cloud Engine  

---

## Ringkasan Eksekutif

Audit komprehensif telah dilakukan terhadap proyek **BMH Audit** yang mencakup:
1. **Pemeriksaan Statis (Linting & TypeScript)**: Menemukan dan menyelesaikan 5 error kritis dan 9 warning pada komponen dialog React 19 serta kueri penilaian.
2. **Pengujian Unit & Validasi Skema (Vitest)**: 11 berkas uji dan 114 test case lolos pengujian 100%.
3. **Verifikasi Keamanan Backend & RLS (Supabase)**: Memperbaiki skrip pengujian backend yang gagal autentikasi; seluruh 16 verifikasi izin RLS dan integritas relasi tabel lolos (16/16 Passed).
4. **Pengujian End-to-End (Playwright Chromium)**: Membangun infrastruktur otomasi E2E lengkap dengan 16 skenario pengujian yang mencakup alur kerja Audite Cabang, Auditor SIA (Admin), RBAC otorisasi rute, dan manajemen pengguna/perwakilan.

---

## Matriks Temuan Bug & Resolusi

| Kode Bug | Komponen / Berkas | Tingkat Keparahan | Status | Deskripsi & Tindakan Resolusi |
|---|---|---|---|---|
| **BUG-01** | `components/perwakilan/perwakilan-dialog.tsx`<br>`components/user-management/user-dialog.tsx`<br>`components/user-management/reset-password-dialog.tsx`<br>`components/pengaturan/periode-dialog.tsx` | **High** | **TERSELESAIKAN** | **Pelanggaran Aturan React 19 `react-hooks/set-state-in-effect`**<br>Pemanggilan `setState` sinkron di dalam `useEffect` saat membuka modal dialog menyebabkan cascading re-renders dan kegagalan linting. Masalah diselesaikan dengan mengekstrak badan dialog menjadi inner form terpisah yang diberi key unik (`key={entity?.id ?? 'new'}`). |
| **BUG-02** | `components/audit/use-matrix-admin.ts` | **Medium** | **TERSELESAIKAN** | **Stale Closure / Missing Callback Dependency**<br>Fungsi `handleSave` pada hook matriks auditor tidak mencantumkan `onSavedSuccess` pada larik dependensi `useCallback`, berpotensi mengeksekusi referensi callback yang usang saat update data. |
| **BUG-03** | `app/(app)/manajemen-user/page.tsx` | **Low** | **TERSELESAIKAN** | **Pelemahan Type Safety (`p: any`) & Error Handling**<br>Penggunaan tipe `any` pada mapping profil pengguna dan tidak adanya penanganan error query cabang. Didefinisikan interface tipe `ProfileRow` eksplisit dan ditambahkan log error. |
| **BUG-04** | `scripts/verify-backend.mjs` | **High** | **TERSELESAIKAN** | **Kegagalan Otentikasi Skrip Verifikasi Backend RLS**<br>Skrip verifikasi mencoba login menggunakan domain usang `@audit.bmh.or.id` dan mencari akun generic "Admin", sehingga selalu gagal dengan pesan `Invalid login credentials`. Skrip diperbarui agar mendeteksi akun live database berdomain `@bmh.or.id`. |
| **BUG-05** | Arsitektur Testing / Root Repo | **Medium** | **TERSELESAIKAN** | **Ketiadaan Pengujian Otomasi E2E**<br>Aplikasi belum memiliki test runner E2E untuk memvalidasi interaksi browser nyata. Dikonfigurasikan `@playwright/test` dan ditulis suite pengujian lengkap untuk seluruh alur peran. |
| **BUG-06** | `tests/e2e/auth.spec.ts` | **Low** | **TERSELESAIKAN** | **Locator Strict Mode Collision dengan Next.js Route Announcer**<br>Next.js App Router secara otomatis menginjeksi `<div role="alert" id="__next-route-announcer__">` ke dalam DOM. Selector umum `[role="alert"]` mengalami benturan strict mode. Diperbaiki menggunakan atribut spesifik Base UI `[data-slot="alert"]`. |

---

## Rincian Temuan dan Solusi Teknis

### 1. BUG-01: React 19 `set-state-in-effect` pada Form Modal Dialog
- **Gejala:**  
  ESLint React Hooks melaporkan:
  ```
  Calling setState synchronously within an effect can lead to cascading updates and render thrashing.
  ```
- **Akar Masalah:**  
  Pola legacy React 18 menyinkronkan state form dialog saat prop `cabangToEdit` atau `open` berubah menggunakan:
  ```tsx
  useEffect(() => {
    if (cabangToEdit) {
      setNama(cabangToEdit.nama);
      // ...
    }
  }, [cabangToEdit]);
  ```
- **Solusi:**  
  Menerapkan rekomendasi arsitektur React 19: Form diekstrak ke dalam komponen terpisah dengan `key`:
  ```tsx
  {open && (
    <PerwakilanForm
      key={cabangToEdit ? cabangToEdit.id : "new"}
      cabangToEdit={cabangToEdit}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  )}
  ```
  React akan mereset form state secara otomatis dan deklaratif setiap kali dialog dibuka kembali atau target item berganti.

---

### 2. BUG-02: Missing Dependency Callback pada `useMatrixAdmin`
- **Gejala:**  
  Setelah auditor menyimpan perubahan skor dan catatan, antarmuka kadang tidak memicu refresh data induk secara konsisten.
- **Akar Masalah:**  
  Fungsi callback `onSavedSuccess` tidak dimasukkan ke dalam `useCallback` dependency array di `use-matrix-admin.ts`.
- **Solusi:**  
  Menambahkan `onSavedSuccess` ke daftar dependensi:
  ```ts
  }, [rows, periodeId, cabangId, onSavedSuccess]);
  ```

---

### 3. BUG-04: Ketidaksesuaian Domain Email pada Otomasi Tes Backend
- **Gejala:**  
  Perintah `npm run verify:backend` menghasilkan galat:
  ```
  Auth test user: admin@audit.bmh.or.id
  Failed to sign in test user: Invalid login credentials
  ```
- **Akar Masalah:**  
  Data seed nyata pada Supabase menggunakan domain resmi organisasi `@bmh.or.id` (contoh: `ahmad@bmh.or.id`, `aceh@bmh.or.id`, `jawa-timur@bmh.or.id`). Skrip lama mengasumsikan `@audit.bmh.or.id` dan mencoba mencari pengguna bernama "Admin".
- **Solusi:**  
  Memperbarui `scripts/verify-backend.mjs` untuk mencari admin terdaftar nyata dan menggunakan domain `@bmh.or.id`. Seluruh 16 skenario pengujian backend (Akses RLS, Foreign Key, Matrix View, Row-Level Permissions) berhasil diverifikasi.

---

## Cakupan Skenario Pengujian E2E (Playwright)

Suite pengujian E2E berada pada direktori `tests/e2e/`:

### 1. `tests/e2e/auth.spec.ts` (6 Skenario)
1. **Akses Rute Terproteksi:** Memastikan pengguna tanpa login dialihkan ke `/login`.
2. **Penanganan Kredensial Tidak Valid:** Menampilkan pesan galat login jika email/password salah.
3. **Login Audite Cabang:** Berhasil login sebagai cabang Aceh (`aceh@bmh.or.id`) dan diarahkan ke `/dashboard/user`.
4. **RBAC & Pencegahan Akses Ilegal:** Memastikan akun cabang ditolak saat mencoba membuka rute admin (`/dashboard/admin`, `/admin/penilaian`, `/manajemen-user`).
5. **Login Auditor SIA (Admin):** Berhasil login sebagai Auditor Admin (`ahmad@bmh.or.id`) dan diarahkan ke `/dashboard/admin`.
6. **Logout:** Menghapus sesi autentikasi dan mengembalikan pengguna ke halaman selamat datang / login.

### 2. `tests/e2e/audite-cabang.spec.ts` (4 Skenario)
1. **Dashboard Cabang:** Memuat ringkasan progres pengisian, estimasi capaian mandiri, dan tautan aksi cepat.
2. **Instrumen Audit:** Menampilkan matriks pertanyaan kepatuhan, tabel/accordion pilar, dan fitur pengalih mode tampilan.
3. **Interaksi Pengisian Mandiri:** Memilih opsi skor mandiri (Poin 0, 1, 2) dan validasi tautan URL bukti dukung (Google Drive, dll).
4. **Rekap Penilaian Cabang:** Menampilkan rekapitulasi capaian mandiri, skor bobot, dan predikat kepatuhan.

### 3. `tests/e2e/auditor-admin.spec.ts` (4 Skenario)
1. **Dashboard Admin:** Menampilkan metrik agregat nasional, rata-rata capaian SIA, dan daftar seluruh perwakilan cabang.
2. **Review Penilaian Cabang:** Menavigasi ke cabang spesifik (`/admin/penilaian?cabang=...`), memuat instrumen perbandingan skor mandiri vs skor auditor, serta formulir catatan auditor.
3. **Ringkasan Nasional:** Menampilkan matriks capaian komparatif antar pilar untuk seluruh cabang se-Indonesia.
4. **Nilai Audit & Ekspor Excel:** Memuat tabel nilai akhir audit dan memvalidasi pemicu tombol unduh/ekspor Excel.

### 4. `tests/e2e/management.spec.ts` (2 Skenario)
1. **Manajemen Perwakilan:** Memuat daftar kantor cabang/perwakilan BMH se-Indonesia dan memvalidasi modal tambah/edit perwakilan.
2. **Manajemen Pengguna:** Menampilkan tabel pengguna, dialog pendaftaran pengguna baru dengan pemilihan peran (Auditor/Audite) dan penugasan cabang, serta modal reset password default (`www.bmh.or.id`).

---

## Rekomendasi Pemeliharaan

1. **Jalankan Uji Otomatis Sebelum Deployment:**  
   Pastikan perintah `npm run lint`, `npm test`, `npm run verify:backend`, dan `npx playwright test` dijalankan pada pipeline CI/CD sebelum rilis ke production.
2. **Pertahankan Konvensi Keyed Components React 19:**  
   Hindari kembali menggunakan `useEffect` + `setState` untuk mereset atau menginisialisasi nilai input form saat modal dibuka.
3. **Gunakan `[data-slot="..."]` pada Pengujian DOM:**  
   Karena aplikasi mengadopsi Base UI dan Next.js App Router, utamakan pencarian elemen menggunakan `data-slot` atau accessible name untuk meminimalkan kerapuhan pengujian.
