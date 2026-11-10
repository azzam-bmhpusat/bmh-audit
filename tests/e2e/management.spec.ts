import { test, expect } from "@playwright/test";

test.describe("Manajemen Perwakilan & Pengguna (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Login sebagai Admin SIA
    await page.goto("/login");
    await page.fill('input[name="email"]', "ahmad@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test("1. Manajemen Perwakilan (/manajemen-perwakilan) memuat daftar cabang & modal dialog", async ({ page }) => {
    await page.goto("/manajemen-perwakilan");
    await expect(page).toHaveURL(/\/manajemen-perwakilan/);

    await expect(page.locator("h1")).toContainText(/Manajemen Perwakilan/i);
    await expect(page.locator("body")).toContainText(/Jawa Timur/i);
    await expect(page.locator("body")).toContainText(/Aceh/i);

    // Buka dialog Tambah Perwakilan
    const tambahBtn = page.locator('button:has-text("Tambah Perwakilan"), button:has-text("Tambah Cabang")');
    await expect(tambahBtn.first()).toBeVisible();
    await tambahBtn.first().click();

    // Verifikasi modal dialog terbuka
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/Tambah Perwakilan/i);

    // Verifikasi field input
    await expect(page.locator("#input-nama-cabang")).toBeVisible();

    // Tutup dialog
    await page.click('button:has-text("Batal")');
    await expect(dialog).toBeHidden();
  });

  test("2. Manajemen Pengguna (/manajemen-user) memuat daftar user, modal tambah, dan modal reset password", async ({ page }) => {
    await page.goto("/manajemen-user");
    await expect(page).toHaveURL(/\/manajemen-user/);

    await expect(page.locator("h1")).toContainText(/Manajemen Pengguna/i);

    // Verifikasi tabel user
    await expect(page.locator("body")).toContainText(/Ahmad Naufal/i);
    await expect(page.locator("body")).toContainText(/Aceh/i);

    // Buka modal Tambah Pengguna Baru
    const tambahUserBtn = page.locator('button:has-text("Tambah Pengguna"), button:has-text("Tambah User")');
    await expect(tambahUserBtn.first()).toBeVisible();
    await tambahUserBtn.first().click();

    // Verifikasi modal dialog tambah terbuka
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/Tambah Pengguna Baru/i);

    // Periksa role input & label
    await expect(dialog.locator('label:has-text("Peran (Role)")')).toBeVisible();
    await expect(dialog.locator('#select-role, [data-slot="select-trigger"]').first()).toBeVisible();

    // Tutup dialog
    await page.click('button:has-text("Batal")');
    await expect(dialog).toBeHidden();

    // Buka modal Reset Password pada salah satu baris pengguna
    const resetPwBtn = page.locator('button[title*="Reset Password"], button[aria-label*="Reset Password"], button:has-text("Reset Password")').first();
    if (await resetPwBtn.isVisible()) {
      await resetPwBtn.click();
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText(/Reset Password/i);
      await expect(dialog).toContainText(/www.bmh.or.id/i);
      await page.click('button:has-text("Batal")');
      await expect(dialog).toBeHidden();
    }
  });
});
