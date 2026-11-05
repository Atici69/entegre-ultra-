create table if not exists public.dealer_applications (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 company text,
 phone text not null,
 email text,
 city text,
 message text,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
alter table public.dealer_applications enable row level security;
grant insert on public.dealer_applications to anon, authenticated;
grant select, update on public.dealer_applications to authenticated;
drop policy if exists dealer_applications_public_insert on public.dealer_applications;
create policy dealer_applications_public_insert on public.dealer_applications for insert to anon, authenticated with check (status = 'pending');
drop policy if exists dealer_applications_admin_read on public.dealer_applications;
create policy dealer_applications_admin_read on public.dealer_applications for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists dealer_applications_admin_update on public.dealer_applications;
create policy dealer_applications_admin_update on public.dealer_applications for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');