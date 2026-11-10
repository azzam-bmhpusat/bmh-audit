/**
 * lib/format.ts
 * Utilitas pemformatan angka, persentase, dan rasio dalam konvensi Indonesia (id-ID).
 */

const numberFormatter = new Intl.NumberFormat("id-ID");
const percentFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format angka bulat atau desimal menurut id-ID (mis. 1.000, 810).
 */
export function formatAngka(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) {
    return "—";
  }
  return numberFormatter.format(n);
}

/**
 * Format persentase dengan 2 desimal menurut id-ID (mis. 1,60%).
 */
export function formatPersen(p: number | null | undefined): string {
  if (p === null || p === undefined || isNaN(p)) {
    return "0,00%";
  }
  return `${percentFormatter.format(p)}%`;
}

/**
 * Format rasio nilai diperoleh / nilai maksimum ideal (persen),
 * contoh: "13 / 810 (1,60%)".
 */
export function formatRasio(
  total: number | null | undefined,
  maks: number | null | undefined,
  p?: number | null | undefined
): string {
  const safeTotal = total ?? 0;
  const safeMaks = maks ?? 0;
  const computedPercent =
    p !== undefined && p !== null
      ? p
      : safeMaks > 0
      ? Math.round((safeTotal * 10000) / safeMaks) / 100
      : 0;

  return `${formatAngka(safeTotal)} / ${formatAngka(safeMaks)} (${formatPersen(computedPercent)})`;
}
