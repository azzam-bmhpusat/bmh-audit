import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  parseRawUserRows,
  parseBooleanValue,
  SAMPLE_TEMPLATE_ROWS,
  TEMPLATE_COLUMNS,
} from "./csv-user-import";
import type { Cabang } from "@/types/audit";

const mockCabangList: Cabang[] = [
  { id: 1, kode: "JTM", nama: "Jawa Timur" },
  { id: 2, kode: "JBR", nama: "Jawa Barat" },
];

describe("csv-user-import", () => {
  describe("template constants", () => {
    it("memiliki kolom template yang lengkap", () => {
      expect(TEMPLATE_COLUMNS).toEqual([
        "nama",
        "email",
        "role",
        "cabang",
        "password",
        "wajib_ganti_password",
      ]);
    });

    it("memiliki sample data yang valid", () => {
      expect(SAMPLE_TEMPLATE_ROWS.length).toBeGreaterThan(0);
      expect(SAMPLE_TEMPLATE_ROWS[0].nama).toBe("Jawa Timur");
    });
  });

  describe("parseBooleanValue", () => {
    it("mengonversi nilai true dengan benar", () => {
      expect(parseBooleanValue("true")).toBe(true);
      expect(parseBooleanValue("ya")).toBe(true);
      expect(parseBooleanValue("1")).toBe(true);
      expect(parseBooleanValue("yes")).toBe(true);
      expect(parseBooleanValue(true)).toBe(true);
    });

    it("mengonversi nilai false dengan benar", () => {
      expect(parseBooleanValue("false")).toBe(false);
      expect(parseBooleanValue("tidak")).toBe(false);
      expect(parseBooleanValue("0")).toBe(false);
      expect(parseBooleanValue(false)).toBe(false);
    });

    it("mengembalikan default jika nilai kosong", () => {
      expect(parseBooleanValue("")).toBe(true);
      expect(parseBooleanValue(null, false)).toBe(false);
    });
  });

  describe("parseRawUserRows", () => {
    it("berhasil mem-parsing baris valid dengan mapping cabang yang cocok", () => {
      const raw = [
        {
          nama: "Jawa Timur",
          email: "jawa-timur@audit.bmh.or.id",
          role: "user",
          cabang: "Jawa Timur",
          password: "custompassword",
          wajib_ganti_password: "ya",
        },
      ];

      const result = parseRawUserRows(raw, mockCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(true);
      expect(result[0].nama).toBe("Jawa Timur");
      expect(result[0].cabangId).toBe(1);
      expect(result[0].password).toBe("custompassword");
      expect(result[0].wajibGantiPassword).toBe(true);
      expect(result[0].errors).toHaveLength(0);
    });

    it("menghasilkan email otomatis dari nama jika kolom email dikosongkan", () => {
      const raw = [
        {
          nama: "Sulawesi Selatan",
          role: "user",
        },
      ];

      const result = parseRawUserRows(raw, mockCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(true);
      expect(result[0].email).toBe("sulawesi-selatan@audit.bmh.or.id");
      expect(result[0].password).toBe("www.bmh.or.id");
      expect(result[0].warnings[0]).toContain("belum terdaftar");
    });

    it("menangani alias header berbahasa Indonesia", () => {
      const raw = [
        {
          "Nama Pengguna": "Auditor Satu",
          "Email Login": "auditor1@audit.bmh.or.id",
          Peran: "Auditor SIA",
          "Kata Sandi": "password123",
          "Wajib Ganti Password": "tidak",
        },
      ];

      const result = parseRawUserRows(raw, mockCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(true);
      expect(result[0].role).toBe("admin");
      expect(result[0].wajibGantiPassword).toBe(false);
      expect(result[0].cabangId).toBeNull();
    });

    it("menandai baris tidak valid jika data mandatory bermasalah", () => {
      const raw = [
        {
          nama: "A", // terlalu pendek
          email: "email-rusak",
          role: "super-invalid",
          password: "123", // kurang dari 6 karakter
        },
      ];

      const result = parseRawUserRows(raw, mockCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(false);
      expect(result[0].errors).toContain("Nama pengguna minimal 2 karakter.");
      expect(result[0].errors).toContain('Format email "email-rusak" tidak valid.');
      expect(result[0].errors).toContain('Role "super-invalid" tidak valid (gunakan \'admin\' atau \'user\').');
      expect(result[0].errors).toContain("Password minimal 6 karakter.");
    });

    it("mengabaikan baris kosong", () => {
      const raw = [
        { nama: "", email: "", role: "", cabang: "" },
        { nama: "Jawa Barat", role: "user" },
      ];

      const result = parseRawUserRows(raw, mockCabangList);
      expect(result).toHaveLength(1);
      expect(result[0].nama).toBe("Jawa Barat");
    });
  });

  describe("XLSX parsing integration", () => {
    it("dapat membaca file csv/xlsx melalui XLSX", () => {
      const csvData = `nama,email,role,cabang\n"Jawa Timur","jawa-timur@audit.bmh.or.id","user","Jawa Timur"`;
      const workbook = XLSX.read(csvData, { type: "string" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      const parsed = parseRawUserRows(json, mockCabangList);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].nama).toBe("Jawa Timur");
      expect(parsed[0].cabangId).toBe(1);
    });
  });
});
