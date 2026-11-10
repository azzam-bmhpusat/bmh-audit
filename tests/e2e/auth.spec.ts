import { test, expect } from "@playwright/test";

test.describe("Autentikasi & Otorisasi Rute (E2E)", () => {
  test("1. Akses rute terproteksi tanpa login dialihkan ke /login", async ({ page }) => {
    // Coba akses langsung rute audit
    await page.goto("/audit");
    await expect(page).toHaveURL(/\/login/);

    // Coba akses langsung rute admin
    await page.goto("/admin/penilaian");
    await expect(page).toHaveURL(/\/login/);

    // Coba akses langsung ringkasan
    await page.goto("/ringkasan");
    await expect(page).toHaveURL(/\/login/);

    // Coba akses langsung manajemen user
    await page.goto("/manajemen-user");
    await expect(page).toHaveURL(/\/login/);
  });

  test("2. Login gagal menampilkan pesan kesalahan dengan kredensial salah", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "tidak-ada@bmh.or.id");
    await page.fill('input[name="password"]', "passwordsalah123");
    await page.click('button[type="submit"]');

    // Harap alert error muncul
    const alert = page.locator('[data-slot="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText(/Email atau password salah/i);
  });

  test("3. Login berhasil sebagai Audite Cabang (Aceh) dan diarahkan ke /dashboard/user", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "aceh@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');

    // Redirect ke dashboard user
    await expect(page).toHaveURL(/\/dashboard\/user/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/Dashboard (Audite )?Cabang/i);
    await expect(page.locator("body")).toContainText(/Aceh/i);
  });

  test("4. User Cabang ditolak mengakses area Auditor Admin", async ({ page }) => {
    // Login sebagai user cabang
    await page.goto("/login");
    await page.fill('input[name="email"]', "aceh@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/user/);

    // Coba paksa akses rute admin
    await page.goto("/admin/penilaian");
    // Proxy harus mengarahkan kembali ke dashboard user
    await expect(page).toHaveURL(/\/dashboard\/user/, { timeout: 8000 });

    await page.goto("/ringkasan");
    await expect(page).toHaveURL(/\/dashboard\/user/, { timeout: 8000 });

    await page.goto("/manajemen-user");
    await expect(page).toHaveURL(/\/dashboard\/user/, { timeout: 8000 });
  });

  test("5. Login berhasil sebagai Auditor SIA (Admin) dan diarahkan ke /dashboard/admin", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "ahmad@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');

    // Redirect ke dashboard admin
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText(/Dashboard Auditor/i);
  });

  test("6. Tombol logout menghapus sesi dan kembali ke /login", async ({ page }) => {
    // Login dulu
    await page.goto("/login");
    await page.fill('input[name="email"]', "ahmad@bmh.or.id");
    await page.fill('input[name="password"]', "www.bmh.or.id");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/admin/);

    // Buka dropdown user di header
    const userTrigger = page.locator('header button:has(svg.lucide-chevron-down)');
    await userTrigger.click();

    // Klik menu item Keluar
    const logoutItem = page.locator('[role="menuitem"]:has-text("Keluar")');
    await expect(logoutItem).toBeVisible({ timeout: 5000 });
    await logoutItem.click();

    // Verifikasi sesi terhapus dan kembali ke landing page / atau /login
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
  });
});
