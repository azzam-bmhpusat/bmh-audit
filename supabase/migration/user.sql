-- =====================================================================
-- AUDIT BMH - USER & LOGIN
-- 2 role: admin dan user (user = 1 akun per cabang/daerah)
--
-- PRASYARAT: data-schema.sql SUDAH dijalankan.
-- Jalankan file ini di Supabase > SQL Editor (role postgres).
--
-- LOGIN (form Next.js):
--   Nama     : nama daerah cabang, contoh "Jawa Timur"  (tidak peka huruf besar/kecil)
--   Password : default "password"
-- Supabase Auth butuh email, jadi Nama diubah otomatis menjadi email internal:
--   "Jawa Timur" -> jawa-timur@audit.bmh.or.id
-- Email ini hanya identitas login, tidak pernah dikirimi email.
-- Aturan konversi harus SAMA di SQL (nama_to_email) dan di Next.js (lihat contoh kode).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Penanda "wajib ganti password" (password default dipakai bersama)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists wajib_ganti_password boolean not null default true;

-- ---------------------------------------------------------------------
-- 2. Konversi Nama -> email login
-- ---------------------------------------------------------------------
create or replace function public.nama_to_email(p_nama text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(trim(p_nama)), '[^a-z0-9]+', '-', 'g'))
         || '@audit.bmh.or.id';
$$;

-- ---------------------------------------------------------------------
-- 3. Fungsi pembuat user (hanya bisa dipanggil dari SQL Editor / service role)
--    role 'user'  -> otomatis membuat baris cabang (jika belum ada) dan menautkannya
--    role 'admin' -> tanpa cabang
--    Aman dijalankan berulang: akun yang sudah ada dilewati.
-- ---------------------------------------------------------------------
create or replace function public.buat_user(
  p_nama     text,
  p_role     public.app_role default 'user',
  p_password text default encode(gen_random_bytes(8), 'hex')
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_nama     text := regexp_replace(trim(p_nama), '\s+', ' ', 'g');
  v_email    text := public.nama_to_email(p_nama);
  v_uid      uuid;
  v_cabang   bigint;
  v_password text := coalesce(nullif(p_password, ''), encode(gen_random_bytes(8), 'hex'));
begin
  if v_nama is null or v_nama = '' then
    raise exception 'Nama tidak boleh kosong';
  end if;

  select id into v_uid from auth.users where email = v_email;
  if v_uid is not null then
    raise notice 'Sudah ada, dilewati: % (%)', v_nama, v_email;
    return v_uid;
  end if;

  if p_role = 'user' then
    select id into v_cabang from public.cabang where lower(nama) = lower(v_nama);
    if v_cabang is null then
      insert into public.cabang (nama) values (v_nama) returning id into v_cabang;
    end if;
  end if;

  v_uid := gen_random_uuid();

  -- Trigger on_auth_user_created otomatis membuat baris profiles (role 'user')
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    v_email, extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nama', v_nama),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
    'email', v_uid::text, now(), now(), now()
  );

  update public.profiles
     set nama = v_nama,
         role = p_role,
         cabang_id = v_cabang,
         wajib_ganti_password = true
   where id = v_uid;

  return v_uid;
end;
$$;

-- Reset password ke password baru aman, misal jika cabang lupa password
create or replace function public.reset_password_user(
  p_nama     text,
  p_password text default encode(gen_random_bytes(8), 'hex')
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_uid      uuid;
  v_password text := coalesce(nullif(p_password, ''), encode(gen_random_bytes(8), 'hex'));
begin
  select id into v_uid from auth.users where email = public.nama_to_email(p_nama);
  if v_uid is null then
    raise exception 'User "%" tidak ditemukan', p_nama;
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = v_uid;

  update public.profiles set wajib_ganti_password = true where id = v_uid;
end;
$$;

-- PENTING: kedua fungsi di atas membuat/mengubah akun, jadi TIDAK boleh dipanggil dari aplikasi.
revoke all on function public.buat_user(text, public.app_role, text)
  from public, anon, authenticated;
revoke all on function public.reset_password_user(text, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Dipanggil frontend setelah user berhasil ganti password
--    (supabase.auth.updateUser({ password }) lalu supabase.rpc('tandai_password_diganti'))
--    Ini hanya penanda untuk UI; user tetap tidak bisa mengubah role/cabangnya sendiri.
-- ---------------------------------------------------------------------
create or replace function public.tandai_password_diganti()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set wajib_ganti_password = false where id = auth.uid();
$$;

revoke all on function public.tandai_password_diganti() from public, anon;
grant execute on function public.tandai_password_diganti() to authenticated;

-- ---------------------------------------------------------------------
-- 5. PASTIKAN RLS AKTIF (kebijakan lengkap ada di data-schema.sql, bagian 5)
--    Ringkasan:
--      profiles                 : user hanya baca profil sendiri; admin kelola semua;
--                                 TIDAK ada policy insert/update untuk user -> role tidak bisa dinaikkan sendiri
--      cabang                   : user hanya cabangnya; admin semua
--      audit_pilar/variabel/item/poin : semua login baca; hanya admin ubah (termasuk bobot)
--      audit_jawaban            : user baca/isi HANYA cabangnya (periode open); admin baca saja
--      audit_penilaian_auditor  : HANYA admin
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

-- ---------------------------------------------------------------------
-- 6. BUAT AKUN
-- ---------------------------------------------------------------------

-- 6a. ADMIN  -> login: Nama "Admin"
--     GANTI password di bawah ini sebelum dijalankan! Jangan pakai password default untuk admin.
select public.buat_user('Admin', 'admin', 'password');

-- 6b. USER CABANG  -> login: Nama = nama daerah, Password = 
select public.buat_user('Jawa Timur');

-- Tambah cabang lain (ganti/ tambah nama daerah sesuai kebutuhan):
-- select public.buat_user(n) from unnest(array[
--   'Jawa Barat', 'Jawa Tengah', 'DKI Jakarta', 'Sulawesi Selatan'
-- ]) as n;

-- ---------------------------------------------------------------------
-- 7. CEK HASIL
-- ---------------------------------------------------------------------
select p.nama, p.role, c.nama as cabang, u.email as email_login, p.wajib_ganti_password
from public.profiles p
join auth.users u on u.id = p.id
left join public.cabang c on c.id = p.cabang_id
order by p.role, p.nama;

select tablename, rowsecurity as rls_aktif
from pg_tables
where schemaname = 'public'
order by tablename;
