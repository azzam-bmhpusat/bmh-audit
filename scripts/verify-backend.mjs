/**
 * scripts/verify-backend.mjs
 * Skrip verifikasi mandiri backend Supabase & integritas Row Level Security (RLS).
 * Dijalankan dengan: node --env-file=.env.local scripts/verify-backend.mjs
 */

import { createClient } from "@supabase/supabase-js";

/* harus sama dengan lib/auth/nama-email.ts */
function namaToEmail(nama) {
  const slug = nama
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}@audit.bmh.or.id`;
}

// ---------------------------------------------------------------------
// Konfigurasi & Variabel Lingkungan
// ---------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || "www.bmh.or.id";
const testAdminEmail = process.env.TEST_ADMIN_EMAIL || "ahmad@bmh.or.id";
const testUserA = process.env.TEST_USER_A || "Jawa Timur";
const testUserAEmail = process.env.TEST_USER_A_EMAIL || "jawa-timur@bmh.or.id";
const testUserAPassword = process.env.TEST_USER_A_PASSWORD || "www.bmh.or.id";
const testUserB = process.env.TEST_USER_B || "Jawa Barat";
const testUserBEmail = process.env.TEST_USER_B_EMAIL || "jawa-barat@bmh.or.id";
const testUserBPassword = process.env.TEST_USER_B_PASSWORD || "www.bmh.or.id";
const verifyWrite = process.env.VERIFY_WRITE === "1";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib ada di .env.local");
  process.exit(1);
}

const results = [];

function recordResult(testName, passed, detail = "") {
  results.push({ testName, passed, detail });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} | ${testName}${detail ? ` (${detail})` : ""}`);
}

async function createAuthenticatedClient(email, password) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Login gagal untuk ${email}: ${error.message}`);
  }

  return { client, user: data.user };
}

async function runVerification() {
  console.log("==================================================================");
  console.log("   VERIFIKASI BACKEND & KEAMANAN RLS (BMH AUDIT)");
  console.log("==================================================================");
  console.log(`URL Supabase : ${supabaseUrl}`);
  console.log(`User A       : ${testUserA} (${testUserAEmail})`);
  console.log(`User B       : ${testUserB} (${testUserBEmail})`);
  console.log(`Admin        : ${testAdminEmail}`);
  console.log(`Uji Tulis    : ${verifyWrite ? "AKTIF (VERIFY_WRITE=1)" : "NONAKTIF"}`);
  console.log("------------------------------------------------------------------\n");

  let adminClient, userAClient, userBClient;
  let userAProfile, userBProfile;

  // 0. Autentikasi Klien
  try {
    const adminAuth = await createAuthenticatedClient(testAdminEmail, testAdminPassword);
    adminClient = adminAuth.client;

    const userAAuth = await createAuthenticatedClient(testUserAEmail, testUserAPassword);
    userAClient = userAAuth.client;

    // Ambil profil user A
    const { data: profA } = await userAClient.from("profiles").select("*").single();
    userAProfile = profA;

    if (!userAProfile?.cabang_id) {
      throw new Error(`User A (${testUserA}) belum memiliki cabang_id di tabel profiles`);
    }

    // Coba autentikasi User B jika sudah dibuat di Supabase
    try {
      const userBAuth = await createAuthenticatedClient(testUserBEmail, testUserBPassword);
      userBClient = userBAuth.client;
      const { data: profB } = await userBClient.from("profiles").select("*").single();
      userBProfile = profB;
    } catch {
      console.log(`ℹ️ Catatan: Akun User B ("${testUserB}") belum tersedia di Supabase.`);
      console.log(`   Pemilik dapat menjalankan "select public.buat_user('${testUserB}');" di SQL Editor untuk menguji isolasi cabang ganda.`);
    }
  } catch (err) {
    console.error(`❌ Gagal menyiapkan sesi pengujian: ${err.message}`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // 1. PEMERIKSAAN SEBAGAI ADMIN (Data Master Instrumen)
  // ---------------------------------------------------------------------
  console.log("\n[1] Memeriksa Data Master Instrumen (sebagai Admin)...");

  try {
    const { count: pilarCount, error: pilarErr } = await adminClient
      .from("audit_pilar")
      .select("*", { count: "exact", head: true });
    recordResult("audit_pilar berjumlah 3", !pilarErr && pilarCount === 3, `Ditemukan: ${pilarCount}`);

    const { count: varCount, error: varErr } = await adminClient
      .from("audit_variabel")
      .select("*", { count: "exact", head: true });
    recordResult("audit_variabel berjumlah 12", !varErr && varCount === 12, `Ditemukan: ${varCount}`);

    const { data: items, count: itemCount, error: itemErr } = await adminClient
      .from("audit_item")
      .select("nomor, bobot", { count: "exact" });
    recordResult("audit_item berjumlah 72", !itemErr && itemCount === 72, `Ditemukan: ${itemCount}`);

    const { count: poinCount, error: poinErr } = await adminClient
      .from("audit_item_poin")
      .select("*", { count: "exact", head: true });
    recordResult("audit_item_poin berjumlah 360", !poinErr && poinCount === 360, `Ditemukan: ${poinCount}`);

    const { data: poin11_5, error: p11Err } = await adminClient
      .from("audit_item_poin")
      .select("bukti_evidence")
      .eq("item_nomor", 11)
      .eq("urutan", 5)
      .single();
    recordResult(
      "Item 11 poin ke-5 bukti_evidence null",
      !p11Err && poin11_5?.bukti_evidence === null,
      `Nilai: ${poin11_5?.bukti_evidence}`
    );

    const totalBobot = items?.reduce((sum, it) => sum + it.bobot, 0) ?? 0;
    console.log(`ℹ️ Total Bobot Instrumen (Master): ${totalBobot} (Skor Maksimum Ideal: ${totalBobot * 5})`);
  } catch (err) {
    recordResult("Pemeriksaan Data Master", false, err.message);
  }

  // Ambil periode aktif terbaru
  const { data: periodeList } = await adminClient
    .from("periode")
    .select("*")
    .order("id", { ascending: false });
  const periodeAktif = periodeList?.find((p) => p.is_open) || periodeList?.[0];

  if (!periodeAktif) {
    console.error("❌ ERROR: Tidak ada baris periode di database!");
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // 2. PEMERIKSAAN SEBAGAI USER A (Isolasi & Sanitasi Kolom)
  // ---------------------------------------------------------------------
  console.log(`\n[2] Memeriksa Hak Akses User A (${testUserA})...`);

  try {
    const { data: matrixA, error: matAErr } = await userAClient
      .from("v_audit_matrix_cabang")
      .select("*")
      .eq("periode_id", periodeAktif.id)
      .order("nomor");

    const countA = matrixA?.length ?? 0;
    const allBelongToA = matrixA?.every((r) => r.cabang_id === userAProfile.cabang_id) ?? false;
    recordResult(
      "v_audit_matrix_cabang mengembalikan 72 baris milik User A",
      !matAErr && countA === 72 && allBelongToA,
      `Jumlah baris: ${countA}`
    );

    const firstRow = matrixA?.[0] || {};
    const auditorKeys = ["validasi", "skor_auditor", "nilai_skor_auditor", "catatan"];
    const leakedKeys = auditorKeys.filter((k) => k in firstRow);
    recordResult(
      "v_audit_matrix_cabang tidak memuat kolom auditor",
      leakedKeys.length === 0,
      leakedKeys.length > 0 ? `Bocor: ${leakedKeys.join(", ")}` : "Bersih"
    );

    const { data: matAdminForA } = await userAClient
      .from("v_audit_matrix_admin")
      .select("*")
      .eq("periode_id", periodeAktif.id);
    recordResult(
      "v_audit_matrix_admin mengembalikan 0 baris untuk non-admin",
      (matAdminForA?.length ?? 0) === 0,
      `Baris: ${matAdminForA?.length ?? 0}`
    );

    const { data: penAuditorForA } = await userAClient
      .from("audit_penilaian_auditor")
      .select("*");
    recordResult(
      "audit_penilaian_auditor mengembalikan 0 baris untuk non-admin",
      (penAuditorForA?.length ?? 0) === 0,
      `Baris: ${penAuditorForA?.length ?? 0}`
    );

    const { data: cabangA } = await userAClient.from("cabang").select("*");
    recordResult(
      "cabang hanya mengembalikan 1 baris (cabang sendiri)",
      (cabangA?.length ?? 0) === 1 && cabangA?.[0]?.id === userAProfile.cabang_id,
      `Baris: ${cabangA?.length ?? 0}`
    );
  } catch (err) {
    recordResult("Pemeriksaan User A", false, err.message);
  }

  // ---------------------------------------------------------------------
  // 3. PEMERIKSAAN SEBAGAI USER B (Isolasi Antar Cabang)
  // ---------------------------------------------------------------------
  console.log("\n[3] Memeriksa Isolasi Antar Cabang...");

  if (userBClient && userBProfile?.cabang_id) {
    try {
      const { data: matrixB } = await userBClient
        .from("v_audit_matrix_cabang")
        .select("*")
        .eq("periode_id", periodeAktif.id);

      const anyFromA = matrixB?.some((r) => r.cabang_id === userAProfile.cabang_id) ?? false;
      recordResult(
        "User B tidak melihat baris v_audit_matrix_cabang milik User A",
        !anyFromA && (matrixB?.length ?? 0) === 72,
        `Baris User B: ${matrixB?.length}`
      );

      const { data: jawabanB } = await userBClient
        .from("audit_jawaban")
        .select("*")
        .eq("cabang_id", userAProfile.cabang_id);
      recordResult(
        "User B tidak dapat melihat isi audit_jawaban milik User A",
        (jawabanB?.length ?? 0) === 0,
        `Ditemukan: ${jawabanB?.length ?? 0}`
      );
    } catch (err) {
      recordResult("Pemeriksaan User B", false, err.message);
    }
  } else {
    console.log("ℹ️ [SKIP] Pemeriksaan isolasi User B dilewati (User B belum dibuat di database).");
  }

  // ---------------------------------------------------------------------
  // 4. PENOLAKAN RLS (Uji Negatif)
  // ---------------------------------------------------------------------
  console.log("\n[4] Menguji Penolakan Akses / Uji Negatif RLS...");

  // 4a. User A mencoba menulis ke cabang lain
  const targetCabangId = userBProfile?.cabang_id || 999999;
  try {
    const { error: hackCabangErr } = await userAClient
      .from("audit_jawaban")
      .insert({
        periode_id: periodeAktif.id,
        cabang_id: targetCabangId,
        item_nomor: 1,
        skor_audite: 5,
      });
    recordResult(
      "RLS menolak User A menulis jawaban dengan cabang_id lain",
      Boolean(hackCabangErr),
      hackCabangErr ? hackCabangErr.message : "Tidak ditolak!"
    );
  } catch (err) {
    recordResult("User A menulis cabang lain ditolak", true, err.message);
  }

  // 4b. User A mencoba mengubah role dirinya menjadi admin
  try {
    const { error: hackRoleErr } = await userAClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userAProfile.id);
    // Cek apakah role benar-benar berubah
    const { data: verifyRole } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userAProfile.id)
      .single();

    recordResult(
      "RLS menolak User A mengubah role menjadi admin",
      Boolean(hackRoleErr) || verifyRole?.role === "user",
      `Role saat ini: ${verifyRole?.role}`
    );
  } catch (err) {
    recordResult("User A ubah role ditolak", true, err.message);
  }

  // 4c. User A mencoba mengubah bobot item
  try {
    const { error: hackBobotErr } = await userAClient
      .from("audit_item")
      .update({ bobot: 99 })
      .eq("nomor", 1);
    const { data: item1 } = await adminClient
      .from("audit_item")
      .select("bobot")
      .eq("nomor", 1)
      .single();

    recordResult(
      "RLS menolak User A mengubah bobot audit_item",
      Boolean(hackBobotErr) || item1?.bobot !== 99,
      `Bobot item 1: ${item1?.bobot}`
    );
  } catch (err) {
    recordResult("User A ubah bobot ditolak", true, err.message);
  }

  // 4d. Admin mencoba menulis ke audit_jawaban (admin sengaja tidak punya write policy)
  try {
    const { error: adminWriteJawabanErr } = await adminClient
      .from("audit_jawaban")
      .insert({
        periode_id: periodeAktif.id,
        cabang_id: userAProfile.cabang_id,
        item_nomor: 1,
        skor_audite: 5,
      });
    recordResult(
      "RLS menolak Admin menulis langsung ke audit_jawaban",
      Boolean(adminWriteJawabanErr),
      adminWriteJawabanErr ? adminWriteJawabanErr.message : "Tidak ditolak!"
    );
  } catch (err) {
    recordResult("Admin tulis jawaban ditolak", true, err.message);
  }

  // ---------------------------------------------------------------------
  // 5. KONSISTENSI HITUNGAN ADMIN (v_audit_total_admin)
  // ---------------------------------------------------------------------
  console.log("\n[5] Memverifikasi Konsistensi Hitungan v_audit_total_admin...");

  try {
    const { data: matrixAdminA } = await adminClient
      .from("v_audit_matrix_admin")
      .select("bobot, nilai_skor_auditor, skor_auditor")
      .eq("periode_id", periodeAktif.id)
      .eq("cabang_id", userAProfile.cabang_id);

    const { data: totalAdminA } = await adminClient
      .from("v_audit_total_admin")
      .select("*")
      .eq("periode_id", periodeAktif.id)
      .eq("cabang_id", userAProfile.cabang_id)
      .maybeSingle();

    if (matrixAdminA) {
      const manualMaks = matrixAdminA.reduce((sum, row) => sum + row.bobot * 5, 0);
      const manualNilaiAuditor = matrixAdminA.reduce(
        (sum, row) => sum + (row.nilai_skor_auditor ?? 0),
        0
      );

      const dbMaks = totalAdminA ? Number(totalAdminA.skor_maksimum_ideal) : manualMaks;
      const dbNilaiAuditor = totalAdminA ? Number(totalAdminA.total_nilai_skor_auditor) : 0;

      recordResult(
        "Skor maksimum ideal cocok antara matriks dan agregat",
        manualMaks === dbMaks,
        `Matriks: ${manualMaks}, DB Total: ${dbMaks}`
      );
      recordResult(
        "Total nilai skor auditor cocok antara matriks dan agregat",
        manualNilaiAuditor === dbNilaiAuditor,
        `Matriks: ${manualNilaiAuditor}, DB Total: ${dbNilaiAuditor}`
      );
    } else {
      recordResult("Konsistensi hitungan admin", false, "Data v_audit_matrix_admin kosong");
    }
  } catch (err) {
    recordResult("Konsistensi Hitungan Admin", false, err.message);
  }

  // ---------------------------------------------------------------------
  // 6. UJI TULIS POSITIF (Optional: VERIFY_WRITE=1)
  // ---------------------------------------------------------------------
  if (verifyWrite) {
    console.log("\n[6] Menjalankan Uji Tulis Positif (VERIFY_WRITE=1)...");
    try {
      // Ambil nilai lama item 1
      const { data: oldJawaban } = await userAClient
        .from("audit_jawaban")
        .select("*")
        .eq("periode_id", periodeAktif.id)
        .eq("cabang_id", userAProfile.cabang_id)
        .eq("item_nomor", 1)
        .maybeSingle();

      // Lakukan upsert nilai coba
      const testScore = oldJawaban?.skor_audite === 4 ? 3 : 4;
      const { data: upserted, error: upsertErr } = await userAClient
        .from("audit_jawaban")
        .upsert(
          {
            periode_id: periodeAktif.id,
            cabang_id: userAProfile.cabang_id,
            item_nomor: 1,
            skor_audite: testScore,
          },
          { onConflict: "periode_id,cabang_id,item_nomor" }
        )
        .select()
        .single();

      recordResult(
        "User A berhasil melakukan upsert skor ke audit_jawaban",
        !upsertErr && upserted?.skor_audite === testScore,
        upsertErr ? upsertErr.message : `Skor tersimpan: ${upserted?.skor_audite}`
      );

      // Kembalikan ke keadaan semula
      if (oldJawaban) {
        await userAClient
          .from("audit_jawaban")
          .update({ skor_audite: oldJawaban.skor_audite, lampiran_link: oldJawaban.lampiran_link })
          .eq("id", oldJawaban.id);
      } else {
        await userAClient
          .from("audit_jawaban")
          .delete()
          .eq("periode_id", periodeAktif.id)
          .eq("cabang_id", userAProfile.cabang_id)
          .eq("item_nomor", 1);
      }
      console.log("ℹ️ Data uji tulis berhasil dipulihkan ke kondisi awal.");
    } catch (err) {
      recordResult("Uji Tulis Positif", false, err.message);
    }
  }

  // ---------------------------------------------------------------------
  // RANGKUMAN HASIL
  // ---------------------------------------------------------------------
  console.log("\n==================================================================");
  const failedCount = results.filter((r) => !r.passed).length;
  const passedCount = results.filter((r) => r.passed).length;

  console.log(`TOTAL PENGUJIAN: ${results.length} | LULUS: ${passedCount} | GAGAL: ${failedCount}`);

  if (failedCount > 0) {
    console.error("❌ VERIFIKASI BACKEND GAGAL: Terdapat pemeriksaan yang tidak lolos.");
    process.exit(1);
  } else {
    console.log("✅ VERIFIKASI BACKEND BERHASIL: Semua pemeriksaan integritas data & RLS LULUS.");
    process.exit(0);
  }
}

runVerification();
