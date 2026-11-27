-- Fewer functions reachable through /rest/v1/rpc (Supabase security advisor):
-- trigger functions and internal helpers are not meant to be called by visitors at all; the limit functions
-- are for signed-in users only. Triggers keep working: EXECUTE is checked when a trigger is created, not when it fires.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_registration() from public, anon, authenticated;
revoke execute on function public.write_audit() from public, anon, authenticated;
revoke execute on function public.guard_profile_privileges() from public, anon, authenticated;
revoke execute on function public.setting(text) from public, anon, authenticated;
revoke execute on function public.require_admin() from public, anon, authenticated;

-- Role checks are used inside policies for signed-in users only.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_editor() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_editor() to authenticated;

revoke execute on function public.ai_messages_left() from public, anon;
revoke execute on function public.ai_limit_status() from public, anon;
grant execute on function public.ai_messages_left() to authenticated;
grant execute on function public.ai_limit_status() to authenticated;

comment on table public.ai_guest_usage is 'Guest AI messages per hashed IP and day. No policies on purpose: only the service role (server) reads and writes it.';
