-- Harden public dealer application writes.
-- Existing rows are not scanned immediately; new/updated rows are constrained.
alter table public.dealer_applications
  add constraint dealer_applications_name_length
    check (char_length(btrim(name)) between 2 and 120) not valid,
  add constraint dealer_applications_phone_length
    check (char_length(btrim(phone)) between 5 and 30) not valid,
  add constraint dealer_applications_company_length
    check (company is null or char_length(company) <= 160) not valid,
  add constraint dealer_applications_email_length
    check (email is null or char_length(email) <= 254) not valid,
  add constraint dealer_applications_city_length
    check (city is null or char_length(city) <= 100) not valid,
  add constraint dealer_applications_message_length
    check (message is null or char_length(message) <= 2000) not valid;

-- Do not let anonymous clients choose IDs, timestamps, or workflow status.
revoke insert on table public.dealer_applications from anon, authenticated;
grant insert (name, company, phone, email, city, message)
  on table public.dealer_applications to anon, authenticated;

drop policy if exists dealer_applications_public_insert on public.dealer_applications;
create policy dealer_applications_public_insert
  on public.dealer_applications
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and char_length(btrim(name)) between 2 and 120
    and char_length(btrim(phone)) between 5 and 30
    and (company is null or char_length(company) <= 160)
    and (email is null or char_length(email) <= 254)
    and (city is null or char_length(city) <= 100)
    and (message is null or char_length(message) <= 2000)
  );
