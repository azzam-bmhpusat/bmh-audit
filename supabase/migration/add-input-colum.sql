-- =====================================================================
-- MIGRASI 5 BARIS LAMPIRAN & VALIDASI
-- =====================================================================

-- 1. Hapus sementara views yang bergantung pada kolom validasi
drop view if exists public.v_audit_total_admin cascade;
drop view if exists public.v_audit_matrix_admin cascade;
drop view if exists public.v_audit_matrix_cabang cascade;

-- 2. Tambah kolom lampiran_links pada tabel audit_jawaban
alter table public.audit_jawaban
  add column if not exists lampiran_links jsonb not null default '{}'::jsonb;

-- 3. Salin data tautan lama ke bukti urutan #1 jika sudah ada data sebelumnya
update public.audit_jawaban
  set lampiran_links = jsonb_build_object('1', lampiran_link)
  where lampiran_link is not null and (lampiran_links is null or lampiran_links = '{}'::jsonb);

-- 4. Ubah tipe kolom validasi menjadi jsonb
alter table public.audit_penilaian_auditor
  alter column validasi type jsonb using (
    case
      when validasi is not null then jsonb_build_object('1', validasi)
      else '{}'::jsonb
    end
  );
alter table public.audit_penilaian_auditor
  alter column validasi set default '{}'::jsonb;

-- 5. Buat ulang view matriks cabang (v_audit_matrix_cabang)
create view public.v_audit_matrix_cabang
with (security_invoker = true) as
select
  p.id                      as periode_id,
  c.id                      as cabang_id,
  pl.kode                   as pilar_kode,
  pl.nama                   as pilar_nama,
  v.kode                    as variabel_kode,
  v.nama                    as variabel_nama,
  i.nomor,
  i.pertanyaan,
  i.regulasi_utama,
  i.regulasi_tambahan,
  i.ranah,
  i.bobot,
  coalesce(j.lampiran_links, case when j.lampiran_link is not null then jsonb_build_object('1', j.lampiran_link) else '{}'::jsonb end) as lampiran_links,
  j.lampiran_link,
  j.skor_audite,
  j.skor_audite * i.bobot   as nilai_skor
from public.periode p
cross join public.cabang c
cross join public.audit_item i
join public.audit_variabel v on v.kode = i.variabel_kode
join public.audit_pilar pl   on pl.kode = v.pilar_kode
left join public.audit_jawaban j
  on  j.periode_id = p.id
  and j.cabang_id  = c.id
  and j.item_nomor = i.nomor;

-- 6. Buat ulang view matriks admin (v_audit_matrix_admin)
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
where (select public.is_admin());

-- 7. Buat ulang view total ringkasan admin (v_audit_total_admin)
create view public.v_audit_total_admin
with (security_invoker = true) as
select
  periode_id,
  cabang_id,
  sum(bobot)                                   as total_bobot,
  sum(bobot) * 5                               as skor_maksimum_ideal,
  coalesce(sum(nilai_skor), 0)                 as total_nilai_skor_audite,
  coalesce(sum(nilai_skor_auditor), 0)         as total_nilai_skor_auditor,
  round(coalesce(sum(nilai_skor_auditor), 0) * 100.0 / nullif(sum(bobot) * 5, 0), 2)
                                               as persen_auditor,
  round(coalesce(sum(nilai_skor), 0) * 100.0 / nullif(sum(bobot) * 5, 0), 2)
                                               as persen_audite,
  count(skor_audite)                           as item_terisi_audite,
  count(skor_auditor)                          as item_dinilai_auditor,
  count(*)                                     as total_item
from public.v_audit_matrix_admin
group by periode_id, cabang_id;

-- 8. Berikan kembali hak akses ke role authenticated
grant select on public.v_audit_matrix_cabang, public.v_audit_matrix_admin,
                public.v_audit_total_admin,  public.v_audit_item_poin
  to authenticated;