# Design System — Data Audit BMH

Prinsip: **Hanya komponen shadcn/ui yang dipakai ulang, dengan palet utama monokrom netral (hitam, putih, abu-abu).** Warna semantik dibatasi secara ketat hanya sebagai pengecualian fungsional untuk status dan aksi penting.

## 1. Aturan utama

1. Semua elemen antarmuka memakai komponen dari `components/ui/*` (hasil `npx shadcn@latest add ...`).
2. Komponen aplikasi (misalnya `audit-table.tsx`) hanya **menyusun** komponen shadcn. Tidak membuat tombol, input, kartu, atau badge sendiri dari elemen HTML mentah.
3. Warna hanya lewat token shadcn (`bg-primary`, `text-muted-foreground`, `border`, `bg-success`, dst). Dilarang memakai kelas warna Tailwind langsung seperti `bg-blue-500` atau nilai hex di komponen.
4. **Pengecualian Monokrom Terbatas**: Warna semantik (`success`, `destructive`, `warning`) **HANYA** diizinkan untuk aksi tombol spesifik yang tercantum (simpan/konfirmasi, keluar/aksi kritis, coba lagi) dan `Alert` error. Dilarang keras digunakan untuk dekorasi visual, pewarnaan badge skor, atau latar belakang umum halaman.
5. **Hierarki Visual Satu Layar**: Dalam satu tampilan atau modal, **tidak boleh ada lebih dari satu tombol berwarna solid** agar antarmuka tetap tenang, bersih, dan tidak saling berebut perhatian.
6. Styling tambahan hanya utilitas Tailwind untuk tata letak (flex, grid, gap, padding, lebar, overflow) dan teks (ukuran, tebal, rata). Gunakan `cn()` untuk menggabungkan kelas.
7. Tidak mengubah isi file `components/ui/*` untuk kebutuhan satu halaman. Variasi dibuat lewat `variant` dan `size` bawaan.

## 2. Token warna

Warna utama monokrom netral, dengan token semantik ber-chroma rendah (*low chroma*) agar tetap selaras dengan nuansa dokumen audit formal:

```css
:root {
  --primary: oklch(0 0 0);                 /* hitam */
  --primary-foreground: oklch(1 0 0);      /* putih */
  --ring: oklch(0.145 0 0);                /* fokus: hampir hitam */
  --radius: 0.5rem;

  /* Token Semantik (Chroma Rendah) */
  --success: oklch(0.52 0.11 155);
  --success-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.55 0.16 27);
  --destructive-foreground: oklch(0.985 0 0);
  --warning: oklch(0.82 0.11 85);
  --warning-foreground: oklch(0.38 0.07 70);   /* dipakai sebagai warna teks varian soft */
}

.dark {
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --ring: oklch(0.556 0 0);

  /* Token Semantik Mode Gelap */
  --success: oklch(0.62 0.12 155);
  --success-foreground: oklch(0.15 0 0);
  --destructive: oklch(0.68 0.15 25);
  --destructive-foreground: oklch(0.15 0 0);
  --warning: oklch(0.80 0.11 85);
  --warning-foreground: oklch(0.86 0.09 85);
}
```

### Alasan Chroma Rendah (0.07 – 0.16)
Nilai chroma diturunkan secara terukur agar warna semantik tidak menyala mencolok atau menusuk mata di atas latar monokrom putih/gelap, tetapi tetap memenuhi standar kontras WCAG AA (rasio kontras teks ≥ 4.5:1).

| Token | Nilai Light Mode | Pemakaian |
|---|---|---|
| `primary` / `primary-foreground` | `oklch(0 0 0)` / `oklch(1 0 0)` | Tombol navigasi utama (Masuk), Badge default |
| `secondary` | `oklch(0.97 0 0)` | Tombol dan badge sekunder |
| `muted` / `muted-foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | Latar baris judul grup, teks pendukung, placeholder |
| `border` / `input` | `oklch(0.922 0 0)` | Garis tabel, kartu, kolom isian |
| `success` / `success-foreground` | `oklch(0.52 0.11 155)` / `oklch(0.985 0 0)` | Tombol Simpan permanen & konfirmasi berhasil |
| `destructive` | `oklch(0.55 0.16 27)` | Tombol Keluar (Logout), DropdownMenuItem destruktif, Alert error |
| `warning` / `warning-foreground` | `oklch(0.82 0.11 85)` / `oklch(0.38 0.07 70)` | Tombol Coba lagi saat kendala simpan otomatis |

## 3. Tipografi

Font utama yang digunakan adalah **Plus Jakarta Sans** (via `next/font/google`), satu keluarga saja tanpa font sekunder. Angka pada tabel memakai `tabular-nums` agar posisi desimal sejajar.

Implementasi pada `app/layout.tsx`:

```tsx
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});
```

Dan sematkan pada tag `<html>`:
```tsx
<html lang="id" className={`${plusJakartaSans.variable} font-sans h-full antialiased`}>
```

| Elemen | Kelas Tailwind |
|---|---|
| Judul halaman | `text-2xl font-semibold tracking-tight` |
| Deskripsi halaman | `text-sm text-muted-foreground` |
| Judul kartu | `text-sm font-medium` |
| Angka kartu | `text-2xl font-semibold` |
| Isi tabel | `text-sm` |
| Header tabel | bawaan `TableHead` |
| Teks pendukung | `text-xs text-muted-foreground` |
| Angka metrik / tabel | `tabular-nums` |

## 4. Jarak dan tata letak

- Skala jarak Tailwind kelipatan 4 px. Pakai `gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`.
- Kontainer halaman: `mx-auto w-full max-w-7xl px-4 py-6 sm:px-6`.
- Jarak antar bagian halaman: `space-y-6`.
- Filter: `flex flex-wrap items-center gap-2`.
- Kartu ringkasan: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`.
- Radius mengikuti `--radius`. Jangan menulis radius sendiri.

## 5. Komponen yang dipakai

Instal dengan: `npx shadcn@latest add table card badge button input select sheet skeleton alert separator tooltip`

| Komponen | Dipakai untuk | Variant |
|---|---|---|
| `Card` | Kartu ringkasan nilai | default |
| `Select` | Filter Perwakilan, Periode, Pilar, Variabel | default |
| `Input` | Pencarian pertanyaan | default |
| `Button` | Aksi navigasi, simpan, keluar, coba lagi, filter | `default`, `outline`, `ghost`, `secondary`, `success`, `destructive`, `warning`, `link` |
| `Table` | Tabel data dan tabel 5 poin di Detail | default |
| `Badge` | Skor, ranah, penanda kriteria terpilih | `default`, `secondary`, `outline` |
| `Sheet` | Panel Detail pertanyaan | sisi `right` |
| `Skeleton` | Loading | default |
| `Alert` | Pesan error atau perhatian | `default`, `destructive` |
| `Separator` | Pemisah di Detail | default |
| `Tooltip` | Teks lengkap untuk pertanyaan yang terpotong | default |

## 6. Pola pemakaian

### Badge skor (hanya hitam, putih, abu-abu)

| Kondisi | Tampilan |
|---|---|
| Skor terisi | `Badge` `default` (hitam) berisi angka 1–5 |
| Skor kosong | Teks "—" dengan `text-muted-foreground` |
| Ranah (`Ps`, `PsPw`) | `Badge` `outline` |
| Kriteria terpilih di Detail | `Badge` `default` bertuliskan "Skor Audite" atau "Skor Auditor" |

Skor **tidak boleh** dibedakan dengan warna merah, kuning, hijau. Perbedaan skor cukup lewat angkanya.

### Tabel

- Dibungkus `div` dengan `overflow-x-auto rounded-md border`.
- Baris judul Pilar: `TableRow` dengan `bg-muted font-semibold`, `TableCell colSpan` penuh.
- Baris judul Variabel: `TableRow` dengan `bg-muted/50 font-medium`.
- Kolom angka (bobot, skor, nilai): `text-right tabular-nums`.
- Baris data hanya memakai efek hover bawaan komponen `Table`.

### Tombol (Button)

Setiap varian tombol memiliki fungsi semantik yang jelas:

1. **Aksi Sukses / Simpan (`variant="success"`)**:
   - Tampilan: **Solid hijau** (`bg-success text-success-foreground hover:bg-success/90`).
   - Pemakaian: Hanya untuk aksi konfirmasi berhasil dan penyimpanan data permanen (misal: "Simpan Password" di dialog, "Simpan" pada catatan auditor, "Submit" formulir).
2. **Aksi Keluar / Destruktif (`variant="destructive"`)**:
   - Tampilan: **Soft/tinted merah** (`border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15`).
   - Pemakaian: Tombol "Keluar" (Logout) pada dialog ganti password wajib, dan item menu "Keluar" pada dropdown profil (`DropdownMenuItem variant="destructive"`). Gaya soft memastikan tombol tidak mencolok secara berlebihan saat berdampingan dengan tombol utama.
3. **Aksi Peringatan / Coba Ulang (`variant="warning"`)**:
   - Tampilan: **Soft/tinted kuning** (`border border-warning/40 bg-warning/15 text-warning-foreground hover:bg-warning/25`).
   - Pemakaian: Tombol "Coba lagi" pada indikator gagal simpan otomatis (`SaveIndicator`), memberikan sinyal peringatan tanpa merusak ketenangan halaman.
4. **Aksi Utama Netral (`variant="default"`)**:
   - Tampilan: **Solid hitam** (`bg-primary text-primary-foreground`).
   - Pemakaian: Tombol "Masuk" pada halaman login atau beranda.
5. **Aksi Sekunder & Kontrol (`variant="outline"` / `variant="ghost"`)**:
   - Tampilan: Netral tanpa warna semantik.
   - Pemakaian: Tombol "Batal", "Cetak", pengalih tampilan (Tabel/Kartu), buka/tutup variabel.

> [!IMPORTANT]
> **Aturan Komposisi Tombol:**
> Satu layar atau modal hanya boleh memiliki **maksimal 1 tombol solid** (misalnya tombol "Simpan Password"). Tombol pendamping seperti "Keluar" atau "Batal" harus memakai gaya soft/tinted (`destructive`) atau `outline`.

### State

| State | Komponen |
|---|---|
| Loading | `Skeleton` dengan tinggi dan lebar mendekati elemen asli |
| Kosong | Teks `text-sm text-muted-foreground` di tengah, plus `Button` outline "Reset filter" |
| Error | `Alert variant="destructive"` dengan judul dan satu kalimat pesan |

### Shell Aplikasi & Sidebar Responsif

- **Struktur Shell**: Dibungkus pada route group `app/(app)/layout.tsx` memuat `SidebarProvider`, `AppSidebar`, `SidebarInset`, dan `AppHeader`. Layout tidak dirender ulang saat berpindah halaman (*persistent shell*).
- **Preservasi State**: Status terbuka/tertutup sidebar dibaca dari cookie `sidebar_state` pada server layout untuk `defaultOpen`, mencegah *hydration mismatch*.
- **Drawer Mobile**: Di layar mobile (< 768 px), sidebar berubah menjadi drawer Sheet melalui `SidebarTrigger`. Drawer otomatis ditutup setelah menu diklik (`setOpenMobile(false)`).
- **Soft Navigation**: Semua tautan internal menggunakan komponen `Link` dari `next/link` via prop `render={<Link href="..." />}` tanpa reload dokumen browser penuh.
- **Header**: Sisi kanan HANYA memuat dropdown profil pengguna (nama, role badge, ganti password, keluar `destructive`). Sisi kiri memuat `SidebarTrigger`, pemisah vertikal, dan judul aplikasi.
- **Dashboard per Role**: Menampilkan kartu ringkasan metrik (`Card`), indikator capaian (`Progress`), dan tabel daftar yang butuh perhatian (`Table`). Proteksi role diwajibkan di tingkat server (`proxy.ts` dan `page.tsx`).

## 7. Aksesibilitas

- Setiap `Select` dan `Input` punya label (boleh `sr-only`).
- Cincin fokus bawaan shadcn tidak dihapus (`focus-visible:ring-...`).
- **Verifikasi Kontras Rasio (WCAG AA ≥ 4.5:1)**:
  - `success` solid (Light): 5.00:1 (Teks putih di atas hijau L=0.52).
  - `destructive` soft (Light): 4.56:1 (Teks merah L=0.55 di atas latar tint 10%).
  - `warning` soft (Light): 9.38:1 (Teks gelap L=0.38 di atas latar tint 15%).
  - `success` solid (Dark): 5.71:1 (Teks gelap di atas hijau L=0.62).
  - `destructive` soft (Dark): 5.81:1 (Teks merah L=0.68 di atas latar tint 10%).
  - `warning` soft (Dark): 10.02:1 (Teks terang L=0.86 di atas latar tint 15%).
- Tombol berisi ikon saja wajib punya `aria-label`.
- Link evidence berisi teks yang jelas ("Buka evidence 1"), bukan URL mentah.

## 8. Daftar periksa sebelum merge

- [ ] Tidak ada kelas warna Tailwind langsung atau nilai hex di komponen aplikasi.
- [ ] Tidak ada elemen `<button>`, `<input>`, `<select>`, `<table>` mentah di luar `components/ui`.
- [ ] Warna semantik (`success`, `destructive`, `warning`) hanya digunakan untuk aksi yang telah ditentukan secara eksplisit.
- [ ] Tidak ada lebih dari satu tombol solid berwarna dalam satu layar/modal.
- [ ] Semua teks antarmuka berbahasa Indonesia.
- [ ] Tampilan dicek pada lebar 360 px dan 1280 px.
