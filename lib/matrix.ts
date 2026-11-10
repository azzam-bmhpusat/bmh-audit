/**
 * lib/matrix.ts
 * Logika murni pembentukan struktur pohon matriks audit BMH:
 * Pilar -> Variabel -> Item (dengan sub-baris 5 poin).
 * Menghitung subtotal bobot, nilai skor, dan progres isian secara dinamis dari data.
 */

import type {
  ItemPoin,
  ItemWithPoin,
  MatrixRowAdmin,
  MatrixRowCabang,
  MatrixTree,
  PilarGroup,
  VariabelGroup,
} from "@/types/audit";
import { nilaiSkor, persen, skorMaksimum, subtotal } from "./scoring";

function isMatrixRowAdmin(row: MatrixRowCabang): row is MatrixRowAdmin {
  return "validasi" in row || "skor_auditor" in row || "nilai_skor_auditor" in row;
}

/**
 * Mengelompokkan baris datar matriks dan daftar poin menjadi struktur pohon.
 */
export function buildMatrixTree<T extends MatrixRowCabang = MatrixRowCabang>(
  rows: T[],
  poinList: ItemPoin[]
): MatrixTree<T> {
  // 1. Buat lookup Map untuk poin per item_nomor, terurut berdasarkan urutan (1..5)
  const poinMap = new Map<number, ItemPoin[]>();
  for (const poin of poinList) {
    const list = poinMap.get(poin.item_nomor) ?? [];
    list.push(poin);
    poinMap.set(poin.item_nomor, list);
  }

  // Pastikan poin di dalam tiap item terurut berdasarkan urutan
  for (const list of poinMap.values()) {
    list.sort((a, b) => a.urutan - b.urutan);
  }

  // 2. Gabungkan tiap baris matriks dengan daftar poinnya
  const itemsWithPoin: ItemWithPoin<T>[] = rows.map((row) => {
    const itemPoin = poinMap.get(row.nomor) ?? [];
    return {
      ...row,
      poin: itemPoin,
    };
  });

  // 3. Kelompokkan item ke dalam Pilar dan Variabel (mempertahankan urutan kemunculan)
  const pilarMap = new Map<string, { kode: string; nama: string; variabelMap: Map<string, { kode: string; nama: string; items: ItemWithPoin<T>[] }> }>();

  for (const item of itemsWithPoin) {
    if (!pilarMap.has(item.pilar_kode)) {
      pilarMap.set(item.pilar_kode, {
        kode: item.pilar_kode,
        nama: item.pilar_nama,
        variabelMap: new Map(),
      });
    }

    const pilar = pilarMap.get(item.pilar_kode)!;
    if (!pilar.variabelMap.has(item.variabel_kode)) {
      pilar.variabelMap.set(item.variabel_kode, {
        kode: item.variabel_kode,
        nama: item.variabel_nama,
        items: [],
      });
    }

    pilar.variabelMap.get(item.variabel_kode)!.items.push(item);
  }

  let totalBobotAll = 0;
  let totalNilaiSkorAll = 0;
  let totalNilaiSkorAuditorAll: number | null = null;
  let itemTerisiAll = 0;
  let totalItemAll = 0;

  const pilarList: PilarGroup<T>[] = [];

  for (const pilarEntry of pilarMap.values()) {
    const variabelList: VariabelGroup<T>[] = [];
    let pilarBobot = 0;
    let pilarNilaiSkor = 0;
    let pilarNilaiSkorAuditor: number | null = null;

    for (const varEntry of pilarEntry.variabelMap.values()) {
      // Hitung subtotal dan progres variabel dari data dinamis
      const varBobot = subtotal(varEntry.items.map((i) => i.bobot));
      const varNilaiSkor = subtotal(
        varEntry.items.map((i) => i.nilai_skor ?? nilaiSkor(i.skor_audite, i.bobot))
      );

      // Hitung nilai auditor bila ada setidaknya satu baris mode admin
      let varNilaiSkorAuditor: number | null = null;
      const hasAuditorData = varEntry.items.some(
        (i) => isMatrixRowAdmin(i) && (i.skor_auditor !== undefined || i.nilai_skor_auditor !== undefined)
      );

      if (hasAuditorData) {
        varNilaiSkorAuditor = subtotal(
          varEntry.items.map((i) => {
            if (isMatrixRowAdmin(i)) {
              return i.nilai_skor_auditor ?? nilaiSkor(i.skor_auditor, i.bobot);
            }
            return null;
          })
        );
      }

      const varItemTerisi = varEntry.items.filter(
        (i) => i.skor_audite !== null && i.skor_audite !== undefined
      ).length;
      const varTotalItem = varEntry.items.length;

      variabelList.push({
        kode: varEntry.kode,
        nama: varEntry.nama,
        items: varEntry.items,
        totalBobot: varBobot,
        totalNilaiSkor: varNilaiSkor,
        totalNilaiSkorAuditor: varNilaiSkorAuditor,
        itemTerisi: varItemTerisi,
        totalItem: varTotalItem,
      });

      pilarBobot += varBobot;
      pilarNilaiSkor += varNilaiSkor;
      if (varNilaiSkorAuditor !== null) {
        pilarNilaiSkorAuditor = (pilarNilaiSkorAuditor ?? 0) + varNilaiSkorAuditor;
      }
    }

    pilarList.push({
      kode: pilarEntry.kode,
      nama: pilarEntry.nama,
      variabelList,
      totalBobot: pilarBobot,
      totalNilaiSkor: pilarNilaiSkor,
      totalNilaiSkorAuditor: pilarNilaiSkorAuditor,
    });

    totalBobotAll += pilarBobot;
    totalNilaiSkorAll += pilarNilaiSkor;
    if (pilarNilaiSkorAuditor !== null) {
      totalNilaiSkorAuditorAll = (totalNilaiSkorAuditorAll ?? 0) + pilarNilaiSkorAuditor;
    }
  }

  // Hitung jumlah item total dan terisi keseluruhan
  for (const p of pilarList) {
    for (const v of p.variabelList) {
      itemTerisiAll += v.itemTerisi;
      totalItemAll += v.totalItem;
    }
  }

  const skorMaksimumIdeal = skorMaksimum([totalBobotAll]);
  const persenAudite = persen(totalNilaiSkorAll, skorMaksimumIdeal);
  const persenAuditor =
    totalNilaiSkorAuditorAll !== null
      ? persen(totalNilaiSkorAuditorAll, skorMaksimumIdeal)
      : null;

  return {
    pilarList,
    totalBobot: totalBobotAll,
    totalNilaiSkor: totalNilaiSkorAll,
    totalNilaiSkorAuditor: totalNilaiSkorAuditorAll,
    itemTerisi: itemTerisiAll,
    totalItem: totalItemAll,
    skorMaksimumIdeal,
    persenAudite,
    persenAuditor,
  };
}
