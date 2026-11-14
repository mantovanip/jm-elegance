-- JM ELEGANCE · Executar SOMENTE em um projeto Supabase novo da JM Elegance.
-- Não executar em projetos existentes nem no banco de outro sistema.
create table if not exists public.admin_users(
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.products(
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(btrim(name)) between 3 and 120),
  description text not null check(char_length(btrim(description)) between 8 and 1200),
  category text not null check(category in ('feminino','masculino','fitness')),
  price numeric(10,2) check(price is null or price>=0),
  photos text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint max_six_photos check(coalesce(array_length(photos,1),0)<=6)
);
create index if not exists products_published_date_idx on public.products(published,created_at desc);
create index if not exists products_category_idx on public.products(category,published);
create table if not exists public.store_settings(
  id int primary key default 1 check(id=1),
  group_url text not null default '',
  whatsapp_number text not null default '',
  instagram_url text not null default '',
  welcome_message text not null default '',
  updated_at timestamptz not null default now(),
  check(length(group_url)<=500),
  check(length(whatsapp_number)<=20),
  check(length(instagram_url)<=500),
  check(length(welcome_message)<=160)
);
insert into public.store_settings(id) values (1) on conflict(id) do nothing;
create or replace function public.jm_touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at=now();
  return new;
end;
$$;
revoke all on function public.jm_touch_updated_at() from public,anon,authenticated;
drop trigger if exists jm_products_updated on public.products;
create trigger jm_products_updated before update on public.products for each row execute function public.jm_touch_updated_at();
drop trigger if exists jm_settings_updated on public.store_settings;
create trigger jm_settings_updated before update on public.store_settings for each row execute function public.jm_touch_updated_at();
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
drop policy if exists "jm_admin_membership_read" on public.admin_users;
create policy "jm_admin_membership_read" on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
-- Catálogo público: somente peças publicadas.
drop policy if exists "jm_products_public_read" on public.products;
create policy "jm_products_public_read" on public.products for select to anon,authenticated using(published=true);
drop policy if exists "jm_products_admin_read" on public.products;
create policy "jm_products_admin_read" on public.products for select to authenticated
  using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "jm_products_admin_insert" on public.products;
create policy "jm_products_admin_insert" on public.products for insert to authenticated
  with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "jm_products_admin_update" on public.products;
create policy "jm_products_admin_update" on public.products for update to authenticated
  using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
  with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "jm_products_admin_delete" on public.products;
create policy "jm_products_admin_delete" on public.products for delete to authenticated
  using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
-- Contatos da loja são públicos, mas alterações apenas de administradores.
drop policy if exists "jm_settings_public_read" on public.store_settings;
create policy "jm_settings_public_read" on public.store_settings for select to anon,authenticated using(id=1);
drop policy if exists "jm_settings_admin_update" on public.store_settings;
create policy "jm_settings_admin_update" on public.store_settings for update to authenticated
  using(id=1 and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
  with check(id=1 and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
grant usage on schema public to anon,authenticated;
grant select on public.products,public.store_settings to anon;
grant select,insert,update,delete on public.products to authenticated;
grant select,update on public.store_settings to authenticated;
grant select on public.admin_users to authenticated;
revoke all on public.admin_users from anon;
-- Fotos das peças são públicas; upload e exclusão somente por administrador.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "jm_images_upload" on storage.objects;
create policy "jm_images_upload" on storage.objects for insert to authenticated
  with check(bucket_id='product-images' and (storage.foldername(name))[1]='products'
    and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "jm_images_admin_list" on storage.objects;
create policy "jm_images_admin_list" on storage.objects for select to authenticated
  using(bucket_id='product-images' and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "jm_images_admin_delete" on storage.objects;
create policy "jm_images_admin_delete" on storage.objects for delete to authenticated
  using(bucket_id='product-images' and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
-- Após executar: crie um usuário em Authentication > Users.
-- Depois libere o UID do administrador (substituir UUID):
-- insert into public.admin_users(user_id) values('SEU-UID') on conflict(user_id) do nothing;
