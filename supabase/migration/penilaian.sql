-- =====================================================================
-- AUDIT BMH - PENILAIAN (halaman "Preview Penilaian")
--   * Role USER  : Hasil Penilaian & Rekapitulasi Kepatuhan Lembaga
--   * Role ADMIN : rekap yang sama + blok "Sudah Di Audit" (skor auditor)
--
-- PRASYARAT (sudah dijalankan): data-schema.sql, add-input-colum.sql, user.sql
-- Jalankan file ini di Supabase > SQL Editor. Aman dijalankan berulang.
--
-- SUMBER DATA (tidak ada angka yang diketik manual):
--   Skor Audite            -> audit_jawaban.skor_audite
--   Nilai Skor             -> Skor Audite x Bobot            (v_audit_matrix_cabang)
--   Skor Auditor           -> audit_penilaian_auditor.skor_auditor
--   Nilai Skor Auditor     -> Skor Auditor x Bobot           (v_audit_matrix_admin)
--   Jumlah Butir Terisi    -> COUNT(skor_audite)
--   Skor Maksimum Ideal    -> SUM(Bobot) x 5
--   Nilai Akhir (Skala100) -> Total Nilai Skor / Skor Maksimum Ideal x 100
--   Nilai/Predikat/Status  -> dicari otomatis dari tabel audit_predikat
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. MASTER STANDAR PREDIKAT (tabel "Standar Predikat Hasil Audit Kepatuhan")
--    Rentang tidak ditulis di aplikasi, tetapi di tabel ini. Ubah di sini jika standar berubah.
-- ---------------------------------------------------------------------
create table if not exists public.audit_predikat (
  nilai            char(1)      primary key,               -- A..E
  batas_bawah      numeric(5,2) not null unique,           -- nilai akhir >= batas_bawah
  batas_atas       numeric(5,2) not null,
  predikat         text         not null,
  status_kepatuhan text         not null,
  keterangan       text         not null,                  -- Keterangan & Tindak Lanjut
  wajib_ptk        boolean      not null default false,    -- true = wajib terbitkan PTK
  check (batas_atas >= batas_bawah)
);

insert into public.audit_predikat
  (nilai, batas_bawah, batas_atas, predikat, status_kepatuhan, keterangan, wajib_ptk)
values
  ('A', 90.00, 100.00, 'Sangat Patuh (Excellence / Platinum)',
   'SANGAT PATUH',
   'Seluruh sistem kepatuhan, syariah, dan regulasi terpenuhi dengan bukti transparan & digitalisasi utuh.',
   false),
  ('B', 80.00,  89.99, 'Patuh (Good / Gold)',
   'PATUH (ADA TEMUAN ADMINISTRATIF MINOR)',
   'Sistem kepatuhan berjalan baik, terdapat minor temuan administratif yang dapat diperbaiki dalam 30 hari.',
   false),
  ('C', 70.00,  79.99, 'Cukup Patuh (Compliant / Silver)',
   'CUKUP PATUH (PERLU SUPERVISI)',
   'Memenuhi batas standar regulasi minimal. Memerlukan supervisi pada perbaikan catatan kontrol internal.',
   false),
  ('D', 60.00,  69.99, 'Kurang Patuh (Satisfactory / Bronze)',
   'KURANG PATUH (PERLU PERBAIKAN / PTK)',
   'Ditemukan kelemahan operasional/pencatatan. Wajib menerbitkan Permintaan Tindakan Korektif (PTK) terikat waktu.',
   true),
  ('E',  0.00,  59.99, 'Tidak Patuh (Non-Compliant / Red Alert)',
   'TIDAK PATUH (RISIKO TINGGI)',
   'Memiliki risiko tinggi pada legalitas/syariah/keuangan. Diusulkan koreksi sistemik dan evaluasi struktural.',
   true)
on conflict (nilai) do update set
  batas_bawah      = excluded.batas_bawah,
  batas_atas       = excluded.batas_atas,
  predikat         = excluded.predikat,
  status_kepatuhan = excluded.status_kepatuhan,
  keterangan       = excluded.keterangan,
  wajib_ptk        = excluded.wajib_ptk;

alter table public.audit_predikat enable row level security;

drop policy if exists predikat_select on public.audit_predikat;
create policy predikat_select on public.audit_predikat
  for select to authenticated using (true);

drop policy if exists predikat_admin_write on public.audit_predikat;
create policy predikat_admin_write on public.audit_predikat
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.audit_predikat from anon;
grant select, insert, update, delete on public.audit_predikat to authenticated;

-- Tabel standar untuk ditampilkan di halaman (dengan teks rentang siap pakai)
drop view if exists public.v_audit_predikat cascade;
create view public.v_audit_predikat
with (security_invoker = true) as
select
  nilai,
  predikat,
  status_kepatuhan,
  keterangan,
  wajib_ptk,
  batas_bawah,
  batas_atas,
  case
    when batas_bawah = 0 then
      '< ' || replace(lead(batas_bawah) over (order by batas_bawah)::text, '.', ',') || '%'
    else
      replace(batas_bawah::text, '.', ',') || '% – ' || replace(batas_atas::text, '.', ',') || '%'
  end as rentang_teks
from public.audit_predikat;
-- Pakai: select * from v_audit_predikat order by nilai;

-- ---------------------------------------------------------------------
-- 2. FUNGSI BANTU (menghitung isi kolom jsonb lampiran & validasi)
-- ---------------------------------------------------------------------
-- Jumlah baris bukti yang tautannya terisi: {"1": "https://...", "2": ""} -> 1
create or replace function public.jumlah_bukti(p jsonb)
returns int
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p) = 'object' then
      (select count(*)::int from jsonb_each_text(p) e where btrim(e.value) <> '')
    else 0
  end;
$$;

-- Jumlah baris bukti yang divalidasi auditor: {"1": true, "2": false} -> 1
create or replace function public.jumlah_validasi(p jsonb)
returns int
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p) = 'object' then
      (select count(*)::int from jsonb_each_text(p) e where e.value = 'true')
    else 0
  end;
$$;

grant execute on function public.jumlah_bukti(jsonb), public.jumlah_validasi(jsonb)
  to authenticated;

-- ---------------------------------------------------------------------
-- 3. HALAMAN USER: v_penilaian_cabang
--    Satu baris per (periode, cabang). Karena RLS, user hanya mendapat cabangnya sendiri.
--    TIDAK memuat data auditor sama sekali.
--    Pakai: select * from v_penilaian_cabang where periode_id = :p;
-- ---------------------------------------------------------------------
drop view if exists public.v_penilaian_cabang cascade;
create view public.v_penilaian_cabang
with (security_invoker = true) as
with rekap as (
  select
    m.periode_id,
    m.cabang_id,
    count(*)::int                                   as jumlah_indikator,
    sum(m.bobot)::int                               as total_bobot,
    (sum(m.bobot) * 5)::int                         as skor_maksimum_ideal,
    count(m.skor_audite)::int                       as jumlah_butir_terisi,
    coalesce(sum(m.nilai_skor), 0)::int             as total_nilai_skor,
    (count(*) filter (where public.jumlah_bukti(m.lampiran_links) > 0))::int
                                                    as jumlah_butir_berlampiran
  from public.v_audit_matrix_cabang m
  group by m.periode_id, m.cabang_id
),
hitung as (
  select
    r.*,
    coalesce(round(r.total_nilai_skor * 100.0 / nullif(r.skor_maksimum_ideal, 0), 2), 0)
                                                    as nilai_akhir
  from rekap r
)
select
  h.periode_id,
  h.cabang_id,
  'Baitul Maal Hidayatullah (LAZNAS BMH)'::text     as nama_lembaga,
  case when c.nama ilike 'BMH%' then c.nama else 'BMH ' || c.nama end
                                                    as entitas_audit,
  p.nama                                            as periode_audit,
  h.jumlah_indikator,
  h.total_bobot,
  h.skor_maksimum_ideal,
  h.jumlah_butir_terisi,
  h.jumlah_indikator - h.jumlah_butir_terisi        as jumlah_butir_belum_terisi,
  h.jumlah_butir_terisi || ' / ' || h.jumlah_indikator || ' Butir'
                                                    as jumlah_butir_terisi_teks,
  round(h.jumlah_butir_terisi * 100.0 / nullif(h.jumlah_indikator, 0), 2)
                                                    as persen_kelengkapan,
  h.jumlah_butir_berlampiran,
  h.total_nilai_skor,                               -- Total Nilai Skor Diperoleh
  h.nilai_akhir,                                    -- Nilai Akhir Kepatuhan (Skala 100)
  pr.nilai                                          as nilai_kepatuhan,
  pr.predikat                                       as predikat_kepatuhan,
  pr.status_kepatuhan,
  pr.wajib_ptk,
  pr.keterangan                                     as keterangan_tindak_lanjut
from hitung h
join public.periode p on p.id = h.periode_id
join public.cabang  c on c.id = h.cabang_id
cross join lateral (
  select x.nilai, x.predikat, x.status_kepatuhan, x.keterangan, x.wajib_ptk
  from public.audit_predikat x
  where h.nilai_akhir >= x.batas_bawah
  order by x.batas_bawah desc
  limit 1
) pr;

-- ---------------------------------------------------------------------
-- 4. HALAMAN ADMIN: v_penilaian_admin
--    Satu baris per (periode, cabang). Non-admin selalu mendapat 0 baris
--    (sumbernya v_audit_matrix_admin yang memakai "where is_admin()").
--    Blok 1 (suffix _audite)  : isian cabang  -> Skor Audite x Bobot
--    Blok 2 (suffix _auditor) : "Sudah Di Audit" -> Skor Auditor x Bobot
--    Pakai: select * from v_penilaian_admin where periode_id = :p and cabang_id = :c;
-- ---------------------------------------------------------------------
drop view if exists public.v_penilaian_admin cascade;
create view public.v_penilaian_admin
with (security_invoker = true) as
with rekap as (
  select
    m.periode_id,
    m.cabang_id,
    count(*)::int                                   as jumlah_indikator,
    sum(m.bobot)::int                               as total_bobot,
    (sum(m.bobot) * 5)::int                         as skor_maksimum_ideal,

    -- isian cabang (audite)
    count(m.skor_audite)::int                       as jumlah_butir_terisi,
    coalesce(sum(m.nilai_skor), 0)::int             as total_nilai_skor_audite,
    (count(*) filter (where public.jumlah_bukti(m.lampiran_links) > 0))::int
                                                    as jumlah_butir_berlampiran,
    coalesce(sum(public.jumlah_bukti(m.lampiran_links)), 0)::int
                                                    as jumlah_bukti_diunggah,

    -- penilaian auditor
    count(m.skor_auditor)::int                      as jumlah_butir_diaudit,
    coalesce(sum(m.nilai_skor_auditor), 0)::int     as total_nilai_skor_auditor,
    (count(*) filter (where m.skor_audite is not null and m.skor_auditor is null))::int
                                                    as jumlah_terisi_belum_diaudit,
    coalesce(sum(public.jumlah_validasi(m.validasi)), 0)::int
                                                    as jumlah_bukti_tervalidasi
  from public.v_audit_matrix_admin m
  group by m.periode_id, m.cabang_id
),
hitung as (
  select
    r.*,
    coalesce(round(r.total_nilai_skor_audite  * 100.0 / nullif(r.skor_maksimum_ideal, 0), 2), 0)
                                                    as nilai_akhir_audite,
    coalesce(round(r.total_nilai_skor_auditor * 100.0 / nullif(r.skor_maksimum_ideal, 0), 2), 0)
                                                    as nilai_akhir_auditor
  from rekap r
)
select
  h.periode_id,
  h.cabang_id,
  'Baitul Maal Hidayatullah (LAZNAS BMH)'::text     as nama_lembaga,
  case when c.nama ilike 'BMH%' then c.nama else 'BMH ' || c.nama end
                                                    as entitas_audit,
  p.nama                                            as periode_audit,
  h.jumlah_indikator,
  h.total_bobot,
  h.skor_maksimum_ideal,

  -- ===== Blok 1: isian cabang (sama dengan halaman user) =====
  h.jumlah_butir_terisi,
  h.jumlah_indikator - h.jumlah_butir_terisi        as jumlah_butir_belum_terisi,
  h.jumlah_butir_terisi || ' / ' || h.jumlah_indikator || ' Butir'
                                                    as jumlah_butir_terisi_teks,
  round(h.jumlah_butir_terisi * 100.0 / nullif(h.jumlah_indikator, 0), 2)
                                                    as persen_kelengkapan,
  h.jumlah_butir_berlampiran,
  h.jumlah_bukti_diunggah,
  h.total_nilai_skor_audite,
  h.nilai_akhir_audite,
  pa.nilai                                          as nilai_kepatuhan_audite,
  pa.predikat                                       as predikat_kepatuhan_audite,
  pa.status_kepatuhan                               as status_kepatuhan_audite,

  -- ===== Blok 2: "Sudah Di Audit" (penilaian auditor) =====
  case
    when h.jumlah_butir_diaudit = 0            then 'Belum Diaudit'
    when h.jumlah_terisi_belum_diaudit = 0     then 'Sudah Diaudit'
    else                                            'Sedang Diaudit'
  end                                               as status_audit,
  h.jumlah_butir_diaudit,
  h.jumlah_butir_diaudit || ' / ' || h.jumlah_indikator || ' Butir'
                                                    as jumlah_butir_diaudit_teks,
  h.jumlah_terisi_belum_diaudit,
  h.jumlah_bukti_tervalidasi,
  h.total_nilai_skor_auditor,                       -- Total Nilai Skor Diperoleh (Audited)
  h.nilai_akhir_auditor,                            -- Nilai Akhir Kepatuhan (Skala 100)
  pr.nilai                                          as nilai_kepatuhan_auditor,
  pr.predikat                                       as predikat_kepatuhan_auditor,
  pr.status_kepatuhan                               as status_kepatuhan_auditor,
  pr.wajib_ptk                                      as wajib_ptk_auditor,
  pr.keterangan                                     as keterangan_tindak_lanjut,

  -- selisih auditor - audite (negatif = auditor menurunkan nilai)
  h.total_nilai_skor_auditor - h.total_nilai_skor_audite as selisih_skor,
  round(h.nilai_akhir_auditor - h.nilai_akhir_audite, 2)  as selisih_nilai_akhir
from hitung h
join public.periode p on p.id = h.periode_id
join public.cabang  c on c.id = h.cabang_id
cross join lateral (
  select x.nilai, x.predikat, x.status_kepatuhan, x.keterangan, x.wajib_ptk
  from public.audit_predikat x
  where h.nilai_akhir_auditor >= x.batas_bawah
  order by x.batas_bawah desc
  limit 1
) pr
cross join lateral (
  select x.nilai, x.predikat, x.status_kepatuhan
  from public.audit_predikat x
  where h.nilai_akhir_audite >= x.batas_bawah
  order by x.batas_bawah desc
  limit 1
) pa;

-- ---------------------------------------------------------------------
-- 5. HAK AKSES (objek baru tidak otomatis ikut revoke/grant di data-schema.sql)
-- ---------------------------------------------------------------------
revoke all on public.v_audit_predikat, public.v_penilaian_cabang, public.v_penilaian_admin
  from anon;
grant select on public.v_audit_predikat, public.v_penilaian_cabang, public.v_penilaian_admin
  to authenticated;

-- ---------------------------------------------------------------------
-- 6. CEK HASIL (jalankan manual)
-- ---------------------------------------------------------------------
-- Tabel standar predikat:
--   select * from public.v_audit_predikat order by nilai;
--
-- Rekap semua cabang (sebagai postgres di SQL Editor, tanpa RLS):
--   select entitas_audit, jumlah_butir_terisi_teks, total_nilai_skor, skor_maksimum_ideal,
--          nilai_akhir, nilai_kepatuhan, status_kepatuhan
--   from public.v_penilaian_cabang order by entitas_audit;
--
-- Dari aplikasi:
--   user  : supabase.from('v_penilaian_cabang').select('*').eq('periode_id', periodeId).single()
--   admin : supabase.from('v_penilaian_admin').select('*').eq('periode_id', periodeId).eq('cabang_id', cabangId).single()
--   admin (daftar semua cabang): ... .select('*').eq('periode_id', periodeId).order('entitas_audit')
