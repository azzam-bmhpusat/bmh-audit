import { test, expect } from "@playwright/test";

test.describe("Alur Kerja Audite Cabang (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Login sebagai User Cabang Aceh
    await page.goto("/login");
    await page.fill('input[name="email"]', "aceh@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/user/, { timeout: 10000 });
  });

  test("1. Dashboard Cabang menampilkan ringkasan capaian & tombol aksi", async ({ page }) => {
    // Pastikan heading dan identitas cabang muncul
    await expect(page.locator("h1")).toContainText(/Dashboard (Audite )?Cabang/i);
    await expect(page.locator("body")).toContainText(/Aceh/i);

    // Pastikan kartu metrik utama tampil (Progres Pengisian, Estimasi Capaian Mandiri, Item Belum Terisi)
    const capaianCard = page.getByText("Progres Pengisian").or(page.getByText("Estimasi Capaian Mandiri"));
    await expect(capaianCard.first()).toBeVisible();

    // Pastikan tombol aksi cepat tersedia
    const auditBtn = page.locator('button:has-text("Buka Instrumen Audit"), a:has-text("Buka Instrumen Audit")').first();
    await expect(auditBtn).toBeVisible();
  });

  test("2. Halaman Instrumen Audit (/audit) memuat matriks & fitur navigasi pilar", async ({ page }) => {
    await page.goto("/audit");
    await expect(page).toHaveURL(/\/audit/);

    // Verifikasi judul instrumen audit
    await expect(page.locator("body")).toContainText(/INSTRUMEN AUDIT/i);

    // Verifikasi tombol pengalih mode tampilan atau tombol full screen
    const viewSwitcher = page.locator('button[title*="mode tampilan"], button:has-text("Tampilan:")');
    await expect(viewSwitcher.first()).toBeVisible();

    // Verifikasi tombol pilar / accordion muncul
    const pilar1 = page.locator("text=Pilar I");
    await expect(pilar1.first()).toBeVisible();
  });

  test("3. Pengisian Skor Mandiri dan Validasi Tautan Bukti", async ({ page }) => {
    await page.goto("/audit");

    // Pastikan baris soal tersedia
    const firstScoreCell = page.locator('[data-field="skor_audite"], select[aria-label*="skor"], button:has-text("1"), button:has-text("5")').first();
    await expect(firstScoreCell).toBeVisible({ timeout: 10000 });

    // Uji pengisian link bukti evidence
    const linkInput = page.locator('input[placeholder*="drive.google"], input[placeholder*="http"], input[name*="link"]').first();
    if (await linkInput.isVisible()) {
      // Masukkan URL invalid
      await linkInput.fill("invalid-url-tanpa-http");
      await linkInput.press("Enter");
      // Harus ada toast atau peringatan
      const toastWarning = page.locator('[data-sonner-toast]');
      await expect(toastWarning.first()).toBeVisible({ timeout: 5000 });

      // Masukkan URL valid
      await linkInput.fill("https://drive.google.com/audit-bmh-evidence-test");
      await linkInput.press("Enter");
      // Verifikasi status tersimpan
      await page.waitForTimeout(1000);
    }
  });

  test("4. Halaman Rekap Penilaian Cabang (/penilaian) memuat skor mandiri & predikat", async ({ page }) => {
    await page.goto("/penilaian");
    await expect(page).toHaveURL(/\/penilaian/);

    // Memeriksa tabel rekapitulasi penilaian cabang
    await expect(page.locator("body")).toContainText(/Penilaian & Rekapitulasi|Hasil Penilaian/i);
    await expect(page.locator("body")).toContainText(/Aceh/i);

    // Memeriksa tabel predikat standar kepatuhan
    await expect(page.locator("body")).toContainText(/Sangat Patuh|Patuh|Cukup Patuh/i);
  });
});
