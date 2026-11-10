import { test, expect } from "@playwright/test";

test.describe("Alur Kerja Auditor SIA BMH (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Login sebagai Admin SIA
    await page.goto("/login");
    await page.fill('input[name="email"]', "ahmad@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test("1. Dashboard Admin menampilkan agregasi nasional dan daftar cabang", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Dashboard Auditor/i);

    // Verifikasi metrik nasional
    await expect(page.locator("body")).toContainText(/Total Perwakilan/i);
    await expect(page.locator("body")).toContainText(/Rata-rata Capaian Nasional/i);

    // Verifikasi daftar cabang tampil
    await expect(page.locator("body")).toContainText(/Jawa Timur/i);
    await expect(page.locator("body")).toContainText(/Aceh/i);
  });

  test("2. Navigasi ke Daftar Penilaian (/admin/penilaian) dan pilih cabang untuk direview", async ({ page }) => {
    await page.goto("/admin/penilaian");
    await expect(page).toHaveURL(/\/admin\/penilaian/);

    await expect(page.locator("h1")).toContainText(/Review Penilaian Kepatuhan/i);

    // Pastikan tombol atau kartu review cabang tersedia
    const reviewLink = page.locator('table a[href*="/admin/penilaian/"]').first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });
    await reviewLink.click();

    // Pastikan halaman detail review per cabang terbuka (beri waktu Server Component selesai memuat)
    await expect(page).toHaveURL(/\/admin\/penilaian\/\d+/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Penilaian Audit:/i })).toBeVisible({ timeout: 15000 });
  });

  test("3. Halaman Ringkasan Nasional (/ringkasan) menampilkan matriks seluruh cabang", async ({ page }) => {
    await page.goto("/ringkasan");
    await expect(page).toHaveURL(/\/ringkasan/);

    await expect(page.locator("h1, h2")).toContainText(/Ringkasan/i);

    // Memeriksa pencarian cabang
    const searchInput = page.locator('input[placeholder*="Cari"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("Aceh");
      await expect(page.locator("body")).toContainText(/Aceh/i);
    }
  });

  test("4. Halaman Nilai Audit (/nilai-audit) dan fungsionalitas Export Excel", async ({ page }) => {
    // Buka nilai audit dengan cabang 1 (Jawa Timur)
    await page.goto("/nilai-audit?cabang=1&periode=1");
    await expect(page).toHaveURL(/\/nilai-audit/);

    await expect(page.locator("body")).toContainText(/TABEL MATRIKS INSTRUMEN AUDIT/i);

    // Periksa tombol Export Excel
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Excel")').first();
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
  });
});
