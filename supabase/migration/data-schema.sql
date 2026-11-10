-- =====================================================================
-- AUDIT BMH - Instrumen Audit Kepatuhan Integratif LAZNAS BMH
-- Satuan Internal Audit (SIA) - BMH Perwakilan / Cabang
-- Jalankan SELURUH file ini sekali di Supabase > SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. TIPE & FUNGSI UMUM
-- ---------------------------------------------------------------------
create type public.app_role as enum ('admin', 'user');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. MASTER ORGANISASI: CABANG, PERIODE, PROFIL USER
-- ---------------------------------------------------------------------
create table public.cabang (
  id          bigint generated always as identity primary key,
  kode        text unique,
  nama        text not null unique,
  created_at  timestamptz not null default now()
);

create table public.periode (
  id          bigint generated always as identity primary key,
  nama        text not null unique,                 -- 'Semester-I Tahun 2026'
  is_open     boolean not null default true,        -- false = cabang tidak bisa mengisi lagi
  created_at  timestamptz not null default now()
);

-- Satu profil per akun login. role & cabang_id hanya bisa diubah admin.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nama        text,
  role        public.app_role not null default 'user',
  cabang_id   bigint references public.cabang (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index profiles_cabang_idx on public.profiles (cabang_id);

-- Helper RLS (security definer agar tidak rekursif terhadap RLS profiles)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_cabang_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select cabang_id from public.profiles where id = auth.uid();
$$;

-- Buat profil otomatis saat akun baru dibuat. Role SELALU 'user'
-- (jangan percaya metadata dari sisi klien). Jadikan admin lewat SQL, lihat bagian 9.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nama', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. MASTER INSTRUMEN (sama untuk semua cabang; sumber: file Excel)
--    Urutan import CSV: pilar -> variabel -> item -> item_poin
-- ---------------------------------------------------------------------
create table public.audit_pilar (
  kode      text primary key,                       -- 'I', 'II', 'III'
  nama      text not null,
  urutan    smallint not null unique
);

create table public.audit_variabel (
  kode        text primary key,                     -- 'V-1' ... 'V-12'
  pilar_kode  text not null references public.audit_pilar (kode) on update cascade,
  nama        text not null,
  urutan      smallint not null unique
);
create index audit_variabel_pilar_idx on public.audit_variabel (pilar_kode);

create table public.audit_item (
  nomor              smallint primary key,          -- No. 1 ... 72
  variabel_kode      text not null references public.audit_variabel (kode) on update cascade,
  pertanyaan         text not null,                 -- Indikator Pertanyaan Audit
  regulasi_utama     text,                          -- Acuan Regulasi Utama
  regulasi_tambahan  text,                          -- Acuan Tambahan
  ranah              text,                          -- kolom "Ranah" di Excel (Ps / PsPw)
  bobot              smallint not null check (bobot > 0)   -- hanya admin yang boleh ubah
);
create index audit_item_variabel_idx on public.audit_item (variabel_kode);

-- 5 poin per item: Fokus Pemeriksaan, Bukti Evidence, dan Kriteria Skor 1-5.
-- urutan 1..5 sekaligus = nilai skor pada kolom Kriteria Skor.
create table public.audit_item_poin (
  item_nomor          smallint not null references public.audit_item (nomor) on delete cascade,
  urutan              smallint not null check (urutan between 1 and 5),
  fokus_pemeriksaan   text not null,
  bukti_evidence      text,                         -- nullable: item no. 11 hanya punya 4 bukti
  kriteria_skor       text not null,
  primary key (item_nomor, urutan)
);

-- ---------------------------------------------------------------------
-- 3. JAWABAN CABANG (diisi user cabang; terlihat oleh cabang itu & admin)
-- ---------------------------------------------------------------------
create table public.audit_jawaban (
  id            bigint generated always as identity primary key,
  periode_id    bigint not null references public.periode (id) on delete cascade,
  cabang_id     bigint not null references public.cabang (id) on delete cascade,
  item_nomor    smallint not null references public.audit_item (nomor) on delete cascade,
  lampiran_links jsonb not null default '{}'::jsonb, -- 5 baris bukti evidence: {"1": "...", "2": "..."}
  lampiran_link text,                               -- Lampiran lama (fallback kompatibilitas)
  skor_audite   smallint check (skor_audite between 1 and 5),   -- Skor Audite (self-assessment)
  updated_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (periode_id, cabang_id, item_nomor)
);
create index audit_jawaban_cabang_idx on public.audit_jawaban (cabang_id, periode_id);

create trigger audit_jawaban_updated_at
  before update on public.audit_jawaban
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. PENILAIAN AUDITOR (HANYA admin; tidak terlihat oleh cabang)
--    Dipisah dari audit_jawaban supaya cabang tidak bisa membaca/mengubahnya.
-- ---------------------------------------------------------------------
create table public.audit_penilaian_auditor (
  id            bigint generated always as identity primary key,
  periode_id    bigint not null references public.periode (id) on delete cascade,
  cabang_id     bigint not null references public.cabang (id) on delete cascade,
  item_nomor    smallint not null references public.audit_item (nomor) on delete cascade,
  validasi      jsonb not null default '{}'::jsonb, -- 5 baris validasi per bukti: {"1": true, "2": false, ...}
  skor_auditor  smallint check (skor_auditor between 1 and 5),
  catatan       text,                               -- opsional: catatan auditor
  updated_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (periode_id, cabang_id, item_nomor)
);
create index audit_penilaian_cabang_idx on public.audit_penilaian_auditor (cabang_id, periode_id);

create trigger audit_penilaian_updated_at
  before update on public.audit_penilaian_auditor
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.cabang                  enable row level security;
alter table public.periode                 enable row level security;
alter table public.audit_pilar             enable row level security;
alter table public.audit_variabel          enable row level security;
alter table public.audit_item              enable row level security;
alter table public.audit_item_poin         enable row level security;
alter table public.audit_jawaban           enable row level security;
alter table public.audit_penilaian_auditor enable row level security;

-- profiles: user lihat profil sendiri, admin lihat & kelola semua
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy profiles_admin_delete on public.profiles for delete to authenticated
  using ((select public.is_admin()));

-- cabang: user hanya melihat cabangnya sendiri, admin melihat & kelola semua
create policy cabang_select on public.cabang for select to authenticated
  using (id = (select public.my_cabang_id()) or (select public.is_admin()));
create policy cabang_admin_write on public.cabang for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- periode: semua login boleh baca, admin kelola
create policy periode_select on public.periode for select to authenticated using (true);
create policy periode_admin_write on public.periode for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- master instrumen: semua login boleh baca; hanya admin boleh ubah (termasuk BOBOT)
create policy pilar_select on public.audit_pilar for select to authenticated using (true);
create policy pilar_admin_write on public.audit_pilar for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy variabel_select on public.audit_variabel for select to authenticated using (true);
create policy variabel_admin_write on public.audit_variabel for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy item_select on public.audit_item for select to authenticated using (true);
create policy item_admin_write on public.audit_item for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy poin_select on public.audit_item_poin for select to authenticated using (true);
create policy poin_admin_write on public.audit_item_poin for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- audit_jawaban:
--   * SELECT : cabang sendiri, atau admin (semua cabang)
--   * INSERT/UPDATE : HANYA user di cabang tsb, dan hanya jika periode masih open
--   * Admin SENGAJA tidak punya policy tulis -> admin tidak bisa mengubah skor audit cabang
create policy jawaban_select on public.audit_jawaban for select to authenticated
  using (cabang_id = (select public.my_cabang_id()) or (select public.is_admin()));

create policy jawaban_user_insert on public.audit_jawaban for insert to authenticated
  with check (
    cabang_id = (select public.my_cabang_id())
    and exists (select 1 from public.periode p where p.id = periode_id and p.is_open)
  );

create policy jawaban_user_update on public.audit_jawaban for update to authenticated
  using (
    cabang_id = (select public.my_cabang_id())
    and exists (select 1 from public.periode p where p.id = periode_id and p.is_open)
  )
  with check (
    cabang_id = (select public.my_cabang_id())
    and exists (select 1 from public.periode p where p.id = periode_id and p.is_open)
  );

-- audit_penilaian_auditor: HANYA admin (cabang tidak bisa baca sama sekali)
create policy penilaian_admin_all on public.audit_penilaian_auditor for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 6. HAK AKSES (grant) - anon tidak diberi akses sama sekali
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------------------------------------------------------------------
-- 7. VIEW UNTUK FRONTEND (security_invoker = RLS tetap berlaku sesuai user)
-- ---------------------------------------------------------------------

-- 7a. HALAMAN USER (cabang): matriks semua item + isian cabang + Nilai Skor otomatis.
--     Tanpa kolom auditor. Karena RLS pada tabel cabang, user hanya mendapat baris cabangnya sendiri.
--     Pakai: select * from v_audit_matrix_cabang where periode_id = :p order by nomor;
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

-- 7b. HALAMAN ADMIN: sama + Validasi, Skor Auditor, Nilai Skor Auditor.
--     "where is_admin()" memastikan non-admin selalu mendapat 0 baris.
--     Pakai: select * from v_audit_matrix_admin where periode_id = :p and cabang_id = :c order by nomor;
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

-- 7c. TOTAL (baris paling bawah halaman admin):
--     Total Nilai Skor Diperoleh / Skor Maksimum Ideal (100%)
--     = SUM(Nilai Skor Auditor) / SUM(5 x Bobot)
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

-- 7d. DETAIL 5 POIN per item (Fokus Pemeriksaan, Bukti Evidence, Kriteria Skor 1-5)
--     Dipakai bersama matriks; sama untuk semua cabang.
create view public.v_audit_item_poin
with (security_invoker = true) as
select
  po.item_nomor,
  po.urutan,
  po.fokus_pemeriksaan,
  po.bukti_evidence,
  po.kriteria_skor
from public.audit_item_poin po;

grant select on public.v_audit_matrix_cabang, public.v_audit_matrix_admin,
                public.v_audit_total_admin,  public.v_audit_item_poin
  to authenticated;

-- ---------------------------------------------------------------------
-- 8. DATA AWAL: PERIODE
-- ---------------------------------------------------------------------
insert into public.periode (nama, is_open) values ('Semester-I Tahun 2026', true);

-- ---------------------------------------------------------------------
-- 9. LANGKAH SETELAH SCHEMA (jalankan manual, sesuaikan)
-- ---------------------------------------------------------------------
-- a) Import 4 CSV lewat Table Editor, URUT:
--      1_audit_pilar.csv -> 2_audit_variabel.csv -> 3_audit_item.csv -> 4_audit_item_poin.csv
--
-- b) Isi daftar cabang, contoh:
--      insert into public.cabang (kode, nama) values
--        ('JKT', 'BMH Perwakilan Jakarta'),
--        ('SBY', 'BMH Perwakilan Surabaya');
--
-- c) Buat akun di Authentication > Users, lalu atur role & cabangnya:
--      -- jadikan admin
--      update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'admin@contoh.org');
--
--      -- hubungkan user ke cabangnya
--      update public.profiles
--      set cabang_id = (select id from public.cabang where kode = 'JKT')
--      where id = (select id from auth.users where email = 'user.jkt@contoh.org');

-- ---------------------------------------------------------------------
-- 10. MIGRASI DARI VERSI SEBELUMNYA (JALANKAN JIKA DATABASE SUDAH ADA DATA)
-- ---------------------------------------------------------------------
-- -- Drop views terlebih dahulu karena tipe kolom validasi akan diubah
-- drop view if exists public.v_audit_total_admin cascade;
-- drop view if exists public.v_audit_matrix_admin cascade;
-- drop view if exists public.v_audit_matrix_cabang cascade;
--
-- -- Ubah kolom lampiran_links dan validasi
-- alter table public.audit_jawaban
--   add column if not exists lampiran_links jsonb not null default '{}'::jsonb;
-- update public.audit_jawaban
--   set lampiran_links = jsonb_build_object('1', lampiran_link)
--   where lampiran_link is not null and (lampiran_links is null or lampiran_links = '{}'::jsonb);
--
-- alter table public.audit_penilaian_auditor
--   alter column validasi type jsonb using (
--     case
--       when validasi is not null then jsonb_build_object('1', validasi)
--       else '{}'::jsonb
--     end
--   );
-- alter table public.audit_penilaian_auditor
--   alter column validasi set default '{}'::jsonb;
--
-- -- Buat ulang views
-- create view public.v_audit_matrix_cabang
-- with (security_invoker = true) as
-- select
--   p.id                      as periode_id,
--   c.id                      as cabang_id,
--   pl.kode                   as pilar_kode,
--   pl.nama                   as pilar_nama,
--   v.kode                    as variabel_kode,
--   v.nama                    as variabel_nama,
--   i.nomor,
--   i.pertanyaan,
--   i.regulasi_utama,
--   i.regulasi_tambahan,
--   i.ranah,
--   i.bobot,
--   coalesce(j.lampiran_links, case when j.lampiran_link is not null then jsonb_build_object('1', j.lampiran_link) else '{}'::jsonb end) as lampiran_links,
--   j.lampiran_link,
--   j.skor_audite,
--   j.skor_audite * i.bobot   as nilai_skor
-- from public.periode p
-- cross join public.cabang c
-- cross join public.audit_item i
-- join public.audit_variabel v on v.kode = i.variabel_kode
-- join public.audit_pilar pl   on pl.kode = v.pilar_kode
-- left join public.audit_jawaban j
--   on  j.periode_id = p.id
--   and j.cabang_id  = c.id
--   and j.item_nomor = i.nomor;
--
-- create view public.v_audit_matrix_admin
-- with (security_invoker = true) as
-- select
--   m.*,
--   coalesce(a.validasi, '{}'::jsonb) as validasi,
--   a.skor_auditor,
--   a.skor_auditor * m.bobot  as nilai_skor_auditor,
--   a.catatan
-- from public.v_audit_matrix_cabang m
-- left join public.audit_penilaian_auditor a
--   on  a.periode_id = m.periode_id
--   and a.cabang_id  = m.cabang_id
--   and a.item_nomor = m.nomor
-- where (select public.is_admin());
--
-- create view public.v_audit_total_admin
-- with (security_invoker = true) as
-- select
--   periode_id,
--   cabang_id,
--   sum(bobot)                                   as total_bobot,
--   sum(bobot) * 5                               as skor_maksimum_ideal,
--   coalesce(sum(nilai_skor), 0)                 as total_nilai_skor_audite,
--   coalesce(sum(nilai_skor_auditor), 0)         as total_nilai_skor_auditor,
--   round(coalesce(sum(nilai_skor_auditor), 0) * 100.0 / nullif(sum(bobot) * 5, 0), 2)
--                                                as persen_auditor,
--   round(coalesce(sum(nilai_skor), 0) * 100.0 / nullif(sum(bobot) * 5, 0), 2)
--                                                as persen_audite,
--   count(skor_audite)                           as item_terisi_audite,
--   count(skor_auditor)                          as item_dinilai_auditor,
--   count(*)                                     as total_item
-- from public.v_audit_matrix_admin
-- group by periode_id, cabang_id;
--
-- grant select on public.v_audit_matrix_cabang, public.v_audit_matrix_admin,
--                 public.v_audit_total_admin,  public.v_audit_item_poin
--   to authenticated;


