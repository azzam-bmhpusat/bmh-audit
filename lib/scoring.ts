/**
 * lib/scoring.ts
 * Satu-satunya sumber rumus perhitungan audit BMH (PRD §9).
 * Hasil kalkulasi dijamin identik dengan view database PostgreSQL.
 */

/**
 * Menghitung Nilai Skor item = skor × bobot.
 * Mengembalikan null jika skor belum diisi (null atau undefined).
 */
export function nilaiSkor(
  skor: number | null | undefined,
  bobot: number
): number | null {
  if (skor === null || skor === undefined) {
    return null;
  }
  return skor * bobot;
}

/**
 * Menghitung subtotal dari sekumpulan nilai.
 * Nilai null atau undefined dianggap bernilai 0.
 */
export function subtotal(nilaiList: (number | null | undefined)[]): number {
  return nilaiList.reduce<number>((acc, val) => {
    if (val === null || val === undefined || isNaN(val)) {
      return acc;
    }
    return acc + val;
  }, 0);
}

/**
 * Menghitung skor maksimum ideal = 5 × total bobot.
 */
export function skorMaksimum(bobotList: (number | null | undefined)[]): number {
  return 5 * subtotal(bobotList);
}

/**
 * Menghitung persentase pencapaian nilai terhadap skor maksimum ideal.
 * Pembulatan 2 desimal identik dengan fungsi round(x, 2) di PostgreSQL
 * menggunakan aritmetika bilangan bulat: Math.round((total * 10000) / maks) / 100.
 * Mengembalikan 0 jika maks = 0 atau negatif.
 */
export function persen(total: number, maks: number): number {
  if (!maks || maks <= 0) {
    return 0;
  }
  return Math.round((total * 10000) / maks) / 100;
}
