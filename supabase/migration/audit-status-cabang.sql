-- =====================================================================
-- MIGRASI STATUS AUDIT CABANG (PEMBERIAN STATUS MANUAL OLEH AUDITOR)
-- =====================================================================

-- 1. Tabel audit_status_cabang: menyimpan penetapan status manual oleh auditor SIA
create table if not exists public.audit_status_cabang (
  id          bigint generated always as identity primary key,
  periode_id  bigint not null references public.periode (id) on delete cascade,
  cabang_id   bigint not null references public.cabang (id) on delete cascade,
  status      text not null check (status in ('Belum Diaudit', 'Sedang Diaudit', 'Sudah Diaudit')),
  is_locked   boolean not null default false,
  locked_at   timestamptz,
  catatan     text,
  updated_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint uq_audit_status_cabang_periode unique (periode_id, cabang_id)
);

-- Kolom tambahan jika tabel sudah pernah dibuat sebelumnya
alter table public.audit_status_cabang
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_at timestamptz;

-- 2. Aktifkan Row Level Security (RLS)
alter table public.audit_status_cabang enable row level security;

-- Policy Select: Semua user yang login dapat membaca status
drop policy if exists "audit_status_cabang_select" on public.audit_status_cabang;
create policy "audit_status_cabang_select"
  on public.audit_status_cabang
  for select
  to authenticated
  using (true);

-- Policy Insert/Update/Delete: Hanya role admin (Auditor SIA)
drop policy if exists "audit_status_cabang_admin_all" on public.audit_status_cabang;
create policy "audit_status_cabang_admin_all"
  on public.audit_status_cabang
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

grant select, insert, update, delete on public.audit_status_cabang to authenticated;

-- 3. Izinkan akun cabang membaca skor penilaian auditor untuk cabangnya sendiri
drop policy if exists "penilaian_auditor_select_own" on public.audit_penilaian_auditor;
create policy "penilaian_auditor_select_own"
  on public.audit_penilaian_auditor
  for select
  to authenticated
  using (
    (select public.is_admin())
    or cabang_id = (select public.my_cabang_id())
  );

-- 4. Buat ulang view matriks admin (v_audit_matrix_admin) agar cabang bisa membaca barisnya sendiri
drop view if exists public.v_audit_matrix_admin cascade;
create view public.v_audit_matrix_admin
with (security_invoker = true) as
select
  m.*,
  coalesce(a.validasi, '{}'::jsonb) as validasi,
  a.skor_auditor,
  a.skor_auditor * m.bobot  as nilai_skor_auditor,
  a.catatan
from public.v_audit_matrix_cabang m
left join public.audit_penilaian_auditor a
  on  a.periode_id = m.periode_id
  and a.cabang_id  = m.cabang_id
  and a.item_nomor = m.nomor
where (select public.is_admin()) or m.cabang_id = (select public.my_cabang_id());

grant select on public.v_audit_matrix_admin to authenticated;

-- 5. Perbarui view v_penilaian_admin agar memprioritaskan status manual jika ada
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
  -- Prioritas: 1) Status manual dari audit_status_cabang jika ada, 2) Perhitungan otomatis
  case
    when sc.status is not null                 then sc.status
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
left join public.audit_status_cabang sc
  on  sc.periode_id = h.periode_id
  and sc.cabang_id  = h.cabang_id
cross join lateral (
  select x.nilai, x.predikat, x.status_kepatuhan
  from public.audit_predikat x
  where h.nilai_akhir_audite >= x.batas_bawah
  order by x.batas_bawah desc
  limit 1
) pa
cross join lateral (
  select x.nilai, x.predikat, x.status_kepatuhan, x.keterangan, x.wajib_ptk
  from public.audit_predikat x
  where h.nilai_akhir_auditor >= x.batas_bawah
  order by x.batas_bawah desc
  limit 1
) pr;

grant select on public.v_penilaian_admin to authenticated;
