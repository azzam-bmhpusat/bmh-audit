"use client";

import * as React from "react";
import { simpanJawaban } from "@/app/actions/jawaban";
import { buildMatrixTree } from "@/lib/matrix";
import type {
  ItemPoin,
  MatrixRowAdmin,
  MatrixRowCabang,
  MatrixTree,
} from "@/types/audit";
import type { SaveStatus } from "./save-indicator";
import { toast } from "sonner";

interface UseMatrixJawabanOptions {
  initialTree: MatrixTree<MatrixRowCabang | MatrixRowAdmin>;
  periodeId?: number;
  poinList?: ItemPoin[];
  readOnly?: boolean;
}

interface SavedValue {
  skor_audite: number | null;
  lampiran_link: string | null;
}

/**
 * Hook pengelola state optimistik, antrean simpan serial per item,
 * dan mekanisme rollback saat terjadi kegagalan jaringan atau penolakan RLS.
 */
export function useMatrixJawaban({
  initialTree,
  periodeId,
  poinList = [],
  readOnly = false,
}: UseMatrixJawabanOptions) {
  // 1. Ekstrak seluruh poin dan baris awal dari initialTree
  const extractedPoin = React.useMemo(() => {
    if (poinList.length > 0) return poinList;
    const list: ItemPoin[] = [];
    for (const p of initialTree.pilarList) {
      for (const v of p.variabelList) {
        for (const it of v.items) {
          if (it.poin) {
            list.push(...it.poin);
          }
        }
      }
    }
    return list;
  }, [initialTree, poinList]);

  // 2. Baris datar yang terus dimutasi secara optimistik
  const [flatRows, setFlatRows] = React.useState<
    (MatrixRowCabang | MatrixRowAdmin)[]
  >(() => {
    const rows: (MatrixRowCabang | MatrixRowAdmin)[] = [];
    for (const p of initialTree.pilarList) {
      for (const v of p.variabelList) {
        for (const it of v.items) {
          const row: MatrixRowCabang | MatrixRowAdmin = {
            periode_id: it.periode_id,
            cabang_id: it.cabang_id,
            pilar_kode: it.pilar_kode,
            pilar_nama: it.pilar_nama,
            variabel_kode: it.variabel_kode,
            variabel_nama: it.variabel_nama,
            nomor: it.nomor,
            pertanyaan: it.pertanyaan,
            regulasi_utama: it.regulasi_utama,
            regulasi_tambahan: it.regulasi_tambahan,
            ranah: it.ranah,
            bobot: it.bobot,
            lampiran_link: it.lampiran_link,
            skor_audite: it.skor_audite,
            nilai_skor: it.nilai_skor,
            ...("validasi" in it
              ? {
                  validasi: (it as MatrixRowAdmin).validasi,
                  skor_auditor: (it as MatrixRowAdmin).skor_auditor,
                  nilai_skor_auditor: (it as MatrixRowAdmin).nilai_skor_auditor,
                  catatan: (it as MatrixRowAdmin).catatan,
                }
              : {}),
          };
          rows.push(row);
        }
      }
    }
    return rows;
  });

  // 3. Simpan nilai terkonfirmasi dari backend untuk rollback
  const savedValuesRef = React.useRef<Map<number, SavedValue>>(new Map());
  React.useEffect(() => {
    for (const p of initialTree.pilarList) {
      for (const v of p.variabelList) {
        for (const it of v.items) {
          savedValuesRef.current.set(it.nomor, {
            skor_audite: it.skor_audite ?? null,
            lampiran_link: it.lampiran_link ?? null,
          });
        }
      }
    }
  }, [initialTree]);

  // 4. Status simpan per item ('idle' | 'saving' | 'saved' | 'error')
  const [saveStatuses, setSaveStatuses] = React.useState<
    Record<number, { status: SaveStatus; error?: string }>
  >({});

  // 5. Antrean Promise serial per item & timer auto-hide 'saved'
  const itemQueuesRef = React.useRef<Map<number, Promise<void>>>(new Map());
  const saveTimersRef = React.useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastAttemptedRef = React.useRef<
    Map<number, { field: "skor_audite" | "lampiran_link"; value: unknown }>
  >(new Map());

  // 6. Hitung ulang struktur pohon (MatrixTree) setiap kali baris berubah
  const currentTree = React.useMemo(() => {
    return buildMatrixTree(flatRows, extractedPoin);
  }, [flatRows, extractedPoin]);

  // Fungsi pembantu mutasi baris optimistik
  const updateRowOptimistic = React.useCallback(
    (
      itemNomor: number,
      field: "skor_audite" | "lampiran_link",
      value: number | string | null
    ) => {
      setFlatRows((prevRows) =>
        prevRows.map((row) => {
          if (row.nomor !== itemNomor) return row;

          if (field === "skor_audite") {
            const skor = value as number | null;
            const nilai = skor !== null ? skor * row.bobot : null;
            return {
              ...row,
              skor_audite: skor,
              nilai_skor: nilai,
            };
          } else if (field === "lampiran_link") {
            return {
              ...row,
              lampiran_link: value as string | null,
            };
          }

          return row;
        })
      );
    },
    []
  );

  // 7. Fungsi utama penyimpanan isian (optimistic + serial queue)
  const saveField = React.useCallback(
    (
      itemNomor: number,
      field: "skor_audite" | "lampiran_link",
      value: number | string | null
    ) => {
      if (readOnly || !periodeId) {
        return;
      }

      // Catat percobaan terakhir untuk retry
      lastAttemptedRef.current.set(itemNomor, { field, value });

      // 1. Pembaruan optimistik langsung di UI
      updateRowOptimistic(itemNomor, field, value);

      // 2. Set status simpan menjadi 'saving'
      setSaveStatuses((prev) => ({
        ...prev,
        [itemNomor]: { status: "saving" },
      }));

      // 3. Masukkan ke antrean serial per item
      const prevPromise =
        itemQueuesRef.current.get(itemNomor) || Promise.resolve();

      const nextPromise = prevPromise.then(async () => {
        try {
          const res = await simpanJawaban({
            periodeId,
            itemNomor,
            field,
            value,
          });

          if (!res.ok) {
            throw new Error(res.error || "Gagal menyimpan isian");
          }

          // Sukses: perbarui nilai tersimpan
          const prevSaved = savedValuesRef.current.get(itemNomor) || {
            skor_audite: null,
            lampiran_link: null,
          };
          savedValuesRef.current.set(itemNomor, {
            ...prevSaved,
            [field]: value,
          });

          // Tampilkan status 'saved'
          setSaveStatuses((prev) => ({
            ...prev,
            [itemNomor]: { status: "saved" },
          }));

          // Hapus timer lama dan jadwalkan 2s kembali ke 'idle'
          const existingTimer = saveTimersRef.current.get(itemNomor);
          if (existingTimer) clearTimeout(existingTimer);

          const timer = setTimeout(() => {
            setSaveStatuses((prev) => {
              if (prev[itemNomor]?.status === "saved") {
                const next = { ...prev };
                delete next[itemNomor];
                return next;
              }
              return prev;
            });
          }, 2000);
          saveTimersRef.current.set(itemNomor, timer);
        } catch (err: unknown) {
          const errorMsg =
            err instanceof Error ? err.message : "Gagal menyimpan isian";
          console.error(`[JAWABAN] Gagal simpan item ${itemNomor}:`, errorMsg);

          // Rollback nilai optimistik ke nilai tersimpan sebelumnya
          const lastConfirmed = savedValuesRef.current.get(itemNomor);
          if (lastConfirmed) {
            updateRowOptimistic(itemNomor, field, lastConfirmed[field]);
          }

          // Set status error
          setSaveStatuses((prev) => ({
            ...prev,
            [itemNomor]: { status: "error", error: errorMsg },
          }));

          toast.error(`Gagal menyimpan item ${itemNomor}: ${errorMsg}`);
        }
      });

      itemQueuesRef.current.set(itemNomor, nextPromise);
    },
    [readOnly, periodeId, updateRowOptimistic]
  );

  // 8. Coba lagi item yang gagal simpan
  const retry = React.useCallback(
    (itemNomor: number) => {
      const last = lastAttemptedRef.current.get(itemNomor);
      if (last) {
        saveField(
          itemNomor,
          last.field,
          last.value as number | string | null
        );
      }
    },
    [saveField]
  );

  return {
    tree: currentTree,
    saveStatuses,
    saveField,
    retry,
  };
}
