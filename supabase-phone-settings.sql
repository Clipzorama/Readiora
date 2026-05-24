begin;

alter table public.profiles
  add column if not exists phone text;

-- Normalize common formatting in mirrored profile phone values.
-- Supabase Auth remains the source of truth for the user's phone number.
update public.profiles
set phone = case
  when phone is null or trim(phone) = '' then null
  when regexp_replace(phone, '[\s().-]', '', 'g') like '00%'
    then '+' || substring(regexp_replace(phone, '[\s().-]', '', 'g') from 3)
  else regexp_replace(phone, '[\s().-]', '', 'g')
end;

-- Keep only E.164-style mirrored values in public.profiles.
-- Format: + plus country calling code plus 8 to 15 total digits.
update public.profiles
set phone = null
where phone is not null
  and phone !~ '^\+[1-9][0-9]{7,14}$';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_e164_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_e164_check
      check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');
  end if;
end $$;

commit;
