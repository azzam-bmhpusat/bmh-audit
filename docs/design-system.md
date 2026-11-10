# Design System — Data Audit BMH

Prinsip: **hanya komponen shadcn/ui yang dipakai ulang, dengan warna utama (primary) hitam.** Tidak ada komponen UI buatan sendiri dan tidak ada warna tambahan.

## 1. Aturan utama

1. Semua elemen antarmuka memakai komponen dari `components/ui/*` (hasil `npx shadcn@latest add ...`).
2. Komponen aplikasi (misalnya `audit-table.tsx`) hanya **menyusun** komponen shadcn. Tidak membuat tombol, input, kartu, atau badge sendiri dari elemen HTML mentah.
3. Warna hanya lewat token shadcn (`bg-primary`, `text-muted-foreground`, `border`, dst). Dilarang memakai kelas warna Tailwind langsung seperti `bg-blue-500` atau nilai hex di komponen.
4. Styling tambahan hanya utilitas Tailwind untuk tata letak (flex, grid, gap, padding, lebar, overflow) dan teks (ukuran, tebal, rata). Gunakan `cn()` untuk menggabungkan kelas.
5. Tidak mengubah isi file `components/ui/*` untuk kebutuhan satu halaman. Variasi dibuat lewat `variant` dan `size` bawaan.
6. Hanya mode terang (light). Tidak ada dark mode pada v1.

## 2. Token warna

Warna primary hitam, sisanya memakai tema netral bawaan shadcn. Ubah pada `app/globals.css`:

```css
:root {
  --primary: oklch(0 0 0);                 /* hitam */
  --primary-foreground: oklch(1 0 0);      /* putih */
  --ring: oklch(0.145 0 0);                /* fokus: hampir hitam */
  --radius: 0.5rem;
}
```

Token lain (`background`, `foreground`, `card`, `muted`, `muted-foreground`, `border`, `input`, `secondary`, `accent`) tetap bawaan tema **neutral**.

| Token | Pemakaian |
|---|---|
| `primary` / `primary-foreground` | Tombol utama, `Badge` default, elemen terpilih |
| `secondary` | Tombol dan badge sekunder |
| `muted` / `muted-foreground` | Latar baris judul grup, teks pendukung, placeholder |
| `border` / `input` | Garis tabel, kartu, kolom isian |
| `destructive` | **Hanya** untuk `Alert` error |

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
| `Button` | Detail, Reset filter, Coba lagi, header kolom yang bisa diurutkan | `default`, `outline`, `ghost` |
| `Table` | Tabel data dan tabel 5 poin di Detail | default |
| `Badge` | Skor, ranah, penanda kriteria terpilih | `default`, `secondary`, `outline` |
| `Sheet` | Panel Detail pertanyaan | sisi `right` |
| `Skeleton` | Loading | default |
| `Alert` | Pesan error | `destructive` |
| `Separator` | Pemisah di Detail | default |
| `Tooltip` | Teks lengkap untuk pertanyaan yang terpotong | default |

Bila nanti perlu komponen lain, tambahkan dari shadcn terlebih dahulu. Jangan membuat sendiri.

## 6. Pola pemakaian

### Badge skor (hanya hitam, putih, abu-abu)

| Kondisi | Tampilan |
|---|---|
| Skor terisi | `Badge` `default` (hitam) berisi angka 1–5 |
| Skor kosong | Teks "—" dengan `text-muted-foreground` |
| Ranah (`Ps`, `PsPw`) | `Badge` `outline` |
| Kriteria terpilih di Detail | `Badge` `default` bertuliskan "Skor Audite" atau "Skor Auditor" |

Skor tidak dibedakan dengan warna merah, kuning, hijau. Perbedaan skor cukup lewat angkanya.

### Tabel

- Dibungkus `div` dengan `overflow-x-auto rounded-md border`.
- Baris judul Pilar: `TableRow` dengan `bg-muted font-semibold`, `TableCell colSpan` penuh.
- Baris judul Variabel: `TableRow` dengan `bg-muted/50 font-medium`.
- Kolom angka (bobot, skor, nilai): `text-right tabular-nums`.
- Baris data hanya memakai efek hover bawaan komponen `Table`.

### Tombol

- Aksi utama: `Button` default (hitam).
- Aksi pendukung (Detail, Reset filter): `variant="outline"`.
- Tombol di header kolom: `variant="ghost"`.
- Ukuran: `size="sm"` di dalam tabel dan filter.

### State

| State | Komponen |
|---|---|
| Loading | `Skeleton` dengan tinggi dan lebar mendekati elemen asli |
| Kosong | Teks `text-sm text-muted-foreground` di tengah, plus `Button` outline "Reset filter" |
| Error | `Alert variant="destructive"` dengan judul dan satu kalimat pesan |

## 7. Aksesibilitas

- Setiap `Select` dan `Input` punya label (boleh `sr-only`).
- Cincin fokus bawaan shadcn tidak dihapus.
- Kontras hitam di atas putih sudah memenuhi WCAG AA. Teks `muted-foreground` tidak dipakai untuk informasi penting.
- Tombol berisi ikon saja wajib punya `aria-label`.
- Link evidence berisi teks yang jelas ("Buka evidence 1"), bukan URL mentah.

## 8. Daftar periksa sebelum merge

- [ ] Tidak ada kelas warna Tailwind langsung atau nilai hex di komponen aplikasi.
- [ ] Tidak ada elemen `<button>`, `<input>`, `<select>`, `<table>` mentah di luar `components/ui`.
- [ ] Hanya `Alert` error yang memakai `destructive`.
- [ ] Semua teks antarmuka berbahasa Indonesia.
- [ ] Tampilan dicek pada lebar 360 px dan 1280 px.
