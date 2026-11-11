import type { MatrixRowCabang } from "@/types/audit";
import { persen } from "@/lib/scoring";

export interface PilarSummaryItem {
  kode: string;
  nama: string;
  totalBobot: number;
  totalItem: number;
  itemTerisi: number;
  totalNilaiSkor: number;
  skorMaks: number;
  persenSkor: number;
}

export function calculatePilarBreakdown(rows: MatrixRowCabang[]): PilarSummaryItem[] {
  const map = new Map<string, PilarSummaryItem>();

  for (const r of rows) {
    const kode = r.pilar_kode || "LAINNYA";
    const nama = r.pilar_nama || "Pilar Audit";
    const existing = map.get(kode) || {
      kode,
      nama,
      totalBobot: 0,
      totalItem: 0,
      itemTerisi: 0,
      totalNilaiSkor: 0,
      skorMaks: 0,
      persenSkor: 0,
    };

    existing.totalItem += 1;
    existing.totalBobot += r.bobot;
    if (r.skor_audite !== null) {
      existing.itemTerisi += 1;
      const nilai = r.nilai_skor ?? r.skor_audite * r.bobot;
      existing.totalNilaiSkor += nilai;
    }

    map.set(kode, existing);
  }

  const result: PilarSummaryItem[] = [];
  for (const item of map.values()) {
    item.skorMaks = item.totalBobot * 5;
    item.persenSkor = persen(item.totalNilaiSkor, item.skorMaks);
    result.push(item);
  }

  return result;
}
