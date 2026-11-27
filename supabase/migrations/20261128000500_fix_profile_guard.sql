-- The privilege guard from 20261128000100 gave the message twice (in the RAISE format and in USING),
-- so PostgreSQL failed with 42601 instead of the intended 42501. The update was still refused, but
-- the client could not tell why. Found by supabase/tests/database/policies.test.sql.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.role is distinct from old.role
       or new.blocked_at is distinct from old.blocked_at
       or new.blocked_reason is distinct from old.blocked_reason
       or new.ai_daily_limit is distinct from old.ai_daily_limit
       or new.ai_reset_at is distinct from old.ai_reset_at)
     and not public.is_admin() then
    raise exception 'profile_privileges' using errcode = '42501',
      detail = 'Only an admin can change role, blocking or the AI limit';
  end if;
  return new;
end;
$$;
