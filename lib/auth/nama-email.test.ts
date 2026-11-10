import { describe, it, expect } from "vitest";
import { namaToEmail, isValidNamaCabang } from "./nama-email";

describe("namaToEmail", () => {
  it("mengonversi nama cabang standar dengan huruf besar/kecil dan spasi ganda", () => {
    expect(namaToEmail("Jawa Timur")).toBe("jawa-timur@audit.bmh.or.id");
    expect(namaToEmail("jawa timur")).toBe("jawa-timur@audit.bmh.or.id");
    expect(namaToEmail(" JAWA  TIMUR ")).toBe("jawa-timur@audit.bmh.or.id");
  });

  it("mengonversi Admin ke admin@audit.bmh.or.id", () => {
    expect(namaToEmail("Admin")).toBe("admin@audit.bmh.or.id");
    expect(namaToEmail("admin")).toBe("admin@audit.bmh.or.id");
  });

  it("menghapus karakter simbol dan merapikan tanda hubung di awal/akhir", () => {
    expect(namaToEmail("BMH (Perwakilan) #1!")).toBe("bmh-perwakilan-1@audit.bmh.or.id");
    expect(namaToEmail("---Jawa---Barat---")).toBe("jawa-barat@audit.bmh.or.id");
    expect(namaToEmail("D.I. Yogyakarta")).toBe("d-i-yogyakarta@audit.bmh.or.id");
  });

  it("menangani string kosong atau hanya simbol", () => {
    expect(namaToEmail("")).toBe("@audit.bmh.or.id");
    expect(namaToEmail("   ")).toBe("@audit.bmh.or.id");
    expect(namaToEmail("!@#$%^&*()")).toBe("@audit.bmh.or.id");
  });

  it("isValidNamaCabang memvalidasi nama yang dapat dikonversi menjadi akun", () => {
    expect(isValidNamaCabang("Jawa Timur")).toBe(true);
    expect(isValidNamaCabang("Admin")).toBe(true);
    expect(isValidNamaCabang("")).toBe(false);
    expect(isValidNamaCabang("   ")).toBe(false);
    expect(isValidNamaCabang("!@#$%")).toBe(false);
  });
});
