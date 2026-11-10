"use client";

import * as React from "react";
import { simpanPenilaian } from "@/app/actions/penilaian";
import { ubahBobot } from "@/app/actions/bobot";
import { buildMatrixTree } from "@/lib/matrix";
import type {
  ItemPoin,
  MatrixRowAdmin,
  MatrixTree,
} from "@/types/audit";
import type { SaveStatus } from "./save-indicator";
import { toast } from "sonner";

interface UseMatrixAdminOptions {
  initialTree: MatrixTree<MatrixRowAdmin>;
  periodeId?: number;
  cabangId?: number;
  poinList?: ItemPoin[];
  readOnly?: boolean;
  onSavedSuccess?: () => void;
}

interface SavedAdminValue {
  validasi: Record<string, boolean | null> | boolean | null;
  skor_auditor: number | null;
  catatan: string | null;
  bobot: number;
}

/**
 * Hook pengelola state optimistik, antrean simpan serial per item,
 * dan kalkulasi live matriks untuk mode admin (Auditor SIA).
 */
export function useMatrixAdmin({
  initialTree,
  periodeId,
  cabangId,
  poinList = [],
  readOnly = false,
  onSavedSuccess,
}: UseMatrixAdminOptions) {
  // 1. Ekstrak seluruh poin pertanyaan
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

  // 2. State baris datar MatrixRowAdmin yang dimutasi secara optimistik
  const [flatRows, setFlatRows] = React.useState<MatrixRowAdmin[]>(() => {
    const rows: MatrixRowAdmin[] = [];
    for (const p of initialTree.pilarList) {
      for (const v of p.variabelList) {
        for (const it of v.items) {
          rows.push({
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
            lampiran_links: it.lampiran_links,
            lampiran_link: it.lampiran_link,
            skor_audite: it.skor_audite,
            nilai_skor: it.nilai_skor,
            validasi: it.validasi ?? null,
            skor_auditor: it.skor_auditor ?? null,
            nilai_skor_auditor: it.nilai_skor_auditor ?? null,
            catatan: it.catatan ?? null,
          });
        }
      }
    }
    return rows;
  });

  // 3. Simpan nilai terkonfirmasi dari backend untuk rollback
  const savedValuesRef = React.useRef<Map<number, SavedAdminValue>>(new Map());
  React.useEffect(() => {
    for (const p of initialTree.pilarList) {
      for (const v of p.variabelList) {
        for (const it of v.items) {
          savedValuesRef.current.set(it.nomor, {
            validasi:
              typeof it.validasi === "object" && it.validasi !== null
                ? { ...it.validasi }
                : (it.validasi ?? null),
            skor_auditor: it.skor_auditor ?? null,
            catatan: it.catatan ?? null,
            bobot: it.bobot,
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
    Map<
      number,
      {
        field: "validasi" | "skor_auditor" | "catatan";
        value: unknown;
        urutan?: number;
      }
    >
  >(new Map());

  // 6. Hitung ulang struktur pohon (MatrixTree) secara live
  const currentTree = React.useMemo(() => {
    return buildMatrixTree(flatRows, extractedPoin);
  }, [flatRows, extractedPoin]);

  // Fungsi mutasi baris optimistik
  const updateRowOptimistic = React.useCallback(
    (
      itemNomor: number,
      field: "validasi" | "skor_auditor" | "catatan",
      value: boolean | number | string | Record<string, boolean | null> | null,
      urutan?: number
    ) => {
      setFlatRows((prevRows) =>
        prevRows.map((row) => {
          if (row.nomor !== itemNomor) return row;

          if (field === "validasi") {
            if (urutan) {
              const currentValidasi =
                typeof row.validasi === "object" && row.validasi !== null
                  ? { ...row.validasi }
                  : {};
              currentValidasi[String(urutan)] = value as boolean | null;
              return {
                ...row,
                validasi: currentValidasi,
              };
            }
            return {
              ...row,
              validasi: value as Record<string, boolean | null> | boolean | null,
            };
          } else if (field === "skor_auditor") {
            const skor = value as number | null;
            const nilai = skor !== null ? skor * row.bobot : null;
            return {
              ...row,
              skor_auditor: skor,
              nilai_skor_auditor: nilai,
            };
          } else if (field === "catatan") {
            return {
              ...row,
              catatan: value as string | null,
            };
          }

          return row;
        })
      );
    },
    []
  );

  // 7. Simpan field penilaian (validasi, skor_auditor, catatan)
  const saveField = React.useCallback(
    (
      itemNomor: number,
      field: "validasi" | "skor_auditor" | "catatan",
      value: boolean | number | string | null,
      urutan?: number
    ) => {
      if (readOnly || !periodeId || !cabangId) {
        return;
      }

      // Catat percobaan terakhir untuk retry
      lastAttemptedRef.current.set(itemNomor, { field, value, urutan });

      // 1. Pembaruan optimistik seketika di UI
      updateRowOptimistic(itemNomor, field, value, urutan);

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
          const res = await simpanPenilaian({
            periodeId,
            cabangId,
            itemNomor,
            field,
            value,
            urutan,
          });

          if (!res.ok) {
            throw new Error(res.error || "Gagal menyimpan penilaian");
          }

          // Sukses: perbarui nilai tersimpan
          const prevSaved = savedValuesRef.current.get(itemNomor) || {
            validasi: {},
            skor_auditor: null,
            catatan: null,
            bobot: 1,
          };

          let nextValidasi: Record<string, boolean | null> | boolean | null = prevSaved.validasi;
          if (field === "validasi" && urutan) {
            const currentMap =
              typeof prevSaved.validasi === "object" && prevSaved.validasi !== null
                ? { ...prevSaved.validasi }
                : {};
            currentMap[String(urutan)] = value as boolean | null;
            nextValidasi = currentMap;
          } else if (field === "validasi") {
            nextValidasi = value as boolean | null;
          }

          savedValuesRef.current.set(itemNomor, {
            ...prevSaved,
            [field]: value,
            validasi: nextValidasi,
          });

          // Tampilkan status 'saved'
          setSaveStatuses((prev) => ({
            ...prev,
            [itemNomor]: { status: "saved" },
          }));
          onSavedSuccess?.();

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
            err instanceof Error ? err.message : "Gagal menyimpan penilaian";
          console.error(`[PENILAIAN] Gagal simpan item ${itemNomor}:`, errorMsg);

          // Rollback nilai optimistik ke nilai tersimpan sebelumnya
          const lastConfirmed = savedValuesRef.current.get(itemNomor);
          if (lastConfirmed) {
            if (field === "validasi" && urutan && typeof lastConfirmed.validasi === "object" && lastConfirmed.validasi !== null) {
              updateRowOptimistic(
                itemNomor,
                field,
                lastConfirmed.validasi[String(urutan)] ?? null,
                urutan
              );
            } else if (field !== "validasi") {
              updateRowOptimistic(itemNomor, field, lastConfirmed[field]);
            }
          }

          setSaveStatuses((prev) => ({
            ...prev,
            [itemNomor]: { status: "error", error: errorMsg },
          }));

          toast.error(`Gagal menyimpan penilaian item ${itemNomor}: ${errorMsg}`);
        }
      });

      itemQueuesRef.current.set(itemNomor, nextPromise);
    },
    [readOnly, periodeId, cabangId, updateRowOptimistic]
  );

  // 8. Ubah Bobot item secara global
  const saveBobot = React.useCallback(
    async (itemNomor: number, newBobot: number) => {
      if (readOnly) return;

      const prevBobot = savedValuesRef.current.get(itemNomor)?.bobot ?? 1;

      // Pembaruan optimistik bobot dan kalkulasi ulang nilai skor
      setFlatRows((prevRows) =>
        prevRows.map((row) => {
          if (row.nomor !== itemNomor) return row;
          return {
            ...row,
            bobot: newBobot,
            nilai_skor: row.skor_audite ? row.skor_audite * newBobot : null,
            nilai_skor_auditor: row.skor_auditor ? row.skor_auditor * newBobot : null,
          };
        })
      );

      setSaveStatuses((prev) => ({
        ...prev,
        [itemNomor]: { status: "saving" },
      }));

      try {
        const res = await ubahBobot({ itemNomor, bobot: newBobot });
        if (!res.ok) {
          throw new Error(res.error || "Gagal mengubah bobot");
        }

        const prevSaved = savedValuesRef.current.get(itemNomor) || {
          validasi: null,
          skor_auditor: null,
          catatan: null,
          bobot: 1,
        };
        savedValuesRef.current.set(itemNomor, {
          ...prevSaved,
          bobot: newBobot,
        });

        setSaveStatuses((prev) => ({
          ...prev,
          [itemNomor]: { status: "saved" },
        }));

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

        toast.success(`Bobot item no. ${itemNomor} berhasil diubah menjadi ${newBobot}`);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Gagal mengubah bobot";
        console.error(`[BOBOT] Gagal update bobot item ${itemNomor}:`, errorMsg);

        // Rollback bobot
        setFlatRows((prevRows) =>
          prevRows.map((row) => {
            if (row.nomor !== itemNomor) return row;
            return {
              ...row,
              bobot: prevBobot,
              nilai_skor: row.skor_audite ? row.skor_audite * prevBobot : null,
              nilai_skor_auditor: row.skor_auditor ? row.skor_auditor * prevBobot : null,
            };
          })
        );

        setSaveStatuses((prev) => ({
          ...prev,
          [itemNomor]: { status: "error", error: errorMsg },
        }));

        toast.error(`Gagal mengubah bobot item ${itemNomor}: ${errorMsg}`);
      }
    },
    [readOnly]
  );

  // 9. Retry handler untuk tombol "Coba lagi" pada SaveIndicator
  const retry = React.useCallback(
    (itemNomor: number) => {
      const last = lastAttemptedRef.current.get(itemNomor);
      if (last) {
        saveField(
          itemNomor,
          last.field,
          last.value as boolean | number | string | null,
          last.urutan
        );
      }
    },
    [saveField]
  );

  return {
    tree: currentTree,
    saveStatuses,
    saveField,
    saveBobot,
    retry,
  };
}
