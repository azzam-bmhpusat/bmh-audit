import { describe, it, expect } from "vitest";
import {
  parseRawPerwakilanRows,
  normalizeHeaderKey,
  SAMPLE_TEMPLATE_ROWS,
  TEMPLATE_COLUMNS,
} from "./csv-perwakilan-import";
import type { Cabang } from "@/types/audit";

const mockExistingCabangList: Cabang[] = [
  { id: 1, kode: "JTM", nama: "Jawa Timur" },
  { id: 2, kode: "JBR", nama: "Jawa Barat" },
];

describe("csv-perwakilan-import", () => {
  describe("template constants", () => {
    it("memiliki kolom template yang sesuai", () => {
      expect(TEMPLATE_COLUMNS).toEqual(["nama", "kode"]);
    });

    it("memiliki sample data yang valid", () => {
      expect(SAMPLE_TEMPLATE_ROWS.length).toBeGreaterThan(0);
      expect(SAMPLE_TEMPLATE_ROWS[0].nama).toBe("Jawa Timur");
      expect(SAMPLE_TEMPLATE_ROWS[0].kode).toBe("JTM");
    });
  });

  describe("normalizeHeaderKey", () => {
    it("mengenali variasi nama header", () => {
      expect(normalizeHeaderKey("nama")).toBe("nama");
      expect(normalizeHeaderKey("Nama Perwakilan")).toBe("nama");
      expect(normalizeHeaderKey("nama_cabang")).toBe("nama");
      expect(normalizeHeaderKey("Perwakilan")).toBe("nama");
      expect(normalizeHeaderKey("Branch")).toBe("nama");
    });

    it("mengenali variasi kode header", () => {
      expect(normalizeHeaderKey("kode")).toBe("kode");
      expect(normalizeHeaderKey("Kode Perwakilan")).toBe("kode");
      expect(normalizeHeaderKey("kode_cabang")).toBe("kode");
      expect(normalizeHeaderKey("Singkatan")).toBe("kode");
      expect(normalizeHeaderKey("Branch Code")).toBe("kode");
    });

    it("mengembalikan null untuk header yang tidak dikenal", () => {
      expect(normalizeHeaderKey("alamat")).toBeNull();
      expect(normalizeHeaderKey("no_telepon")).toBeNull();
    });
  });

  describe("parseRawPerwakilanRows", () => {
    it("berhasil mem-parsing baris valid", () => {
      const raw = [
        {
          nama: "Kalimantan Timur",
          kode: "KTM",
        },
        {
          nama: "Sumatera Utara",
          kode: "",
        },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(true);
      expect(result[0].nama).toBe("Kalimantan Timur");
      expect(result[0].kode).toBe("KTM");
      expect(result[0].errors).toHaveLength(0);

      expect(result[1].isValid).toBe(true);
      expect(result[1].nama).toBe("Sumatera Utara");
      expect(result[1].kode).toBeNull();
      expect(result[1].errors).toHaveLength(0);
    });

    it("menangani alias header dengan benar", () => {
      const raw = [
        {
          "Nama Perwakilan": "Bali",
          "Singkatan": "bli",
        },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(true);
      expect(result[0].nama).toBe("Bali");
      expect(result[0].kode).toBe("BLI");
    });

    it("mendeteksi error jika nama kosong atau kurang dari 2 karakter", () => {
      const raw = [
        {
          nama: "",
          kode: "ABC",
        },
        {
          nama: "A",
          kode: "DEF",
        },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(false);
      expect(result[0].errors[0]).toContain("wajib diisi");
      expect(result[1].isValid).toBe(false);
      expect(result[1].errors[0]).toContain("minimal 2 karakter");
    });

    it("mendeteksi error jika kode melebihi 10 karakter", () => {
      const raw = [
        {
          nama: "Papua Barat",
          kode: "KODELEBIH10CHAR",
        },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(false);
      expect(result[0].errors[0]).toContain("maksimal 10 karakter");
    });

    it("mendeteksi duplikasi nama dan kode terhadap data database yang sudah ada", () => {
      const raw = [
        {
          nama: "jawa timur", // sudah ada di mockExistingCabangList (case-insensitive)
          kode: "NEW1",
        },
        {
          nama: "Cabang Baru",
          kode: "jbr", // kode JBR sudah ada di mockExistingCabangList
        },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(2);
      expect(result[0].isValid).toBe(false);
      expect(result[0].errors[0]).toContain("sudah terdaftar di sistem");
      expect(result[1].isValid).toBe(false);
      expect(result[1].errors[0]).toContain("sudah digunakan oleh cabang lain");
    });

    it("mendeteksi duplikasi nama dan kode ganda di dalam file itu sendiri", () => {
      const raw = [
        {
          nama: "Sulawesi Selatan",
          kode: "SLS",
        },
        {
          nama: "Sulawesi Selatan", // duplikat nama dalam file
          kode: "SL2",
        },
        {
          nama: "Sulawesi Tengah",
          kode: "sls", // duplikat kode dalam file
        },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(3);
      expect(result[0].isValid).toBe(true);

      expect(result[1].isValid).toBe(false);
      expect(result[1].errors[0]).toContain("Nama perwakilan ganda di dalam file");

      expect(result[2].isValid).toBe(false);
      expect(result[2].errors[0]).toContain("Kode perwakilan ganda di dalam file");
    });

    it("mengabaikan baris kosong", () => {
      const raw = [
        { nama: "", kode: "" },
        { nama: "   ", kode: "   " },
      ];

      const result = parseRawPerwakilanRows(raw, mockExistingCabangList);
      expect(result).toHaveLength(0);
    });
  });
});

