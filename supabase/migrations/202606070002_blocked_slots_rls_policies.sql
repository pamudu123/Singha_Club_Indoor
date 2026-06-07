alter table public.blocked_slots enable row level security;

drop policy if exists "Allow public read access to blocked_slots" on public.blocked_slots;
drop policy if exists "Allow active admins to insert blocked_slots" on public.blocked_slots;
drop policy if exists "Allow active admins to delete blocked_slots" on public.blocked_slots;

create policy "Allow public read access to blocked_slots"
on public.blocked_slots
for select
to anon, authenticated
using (true);

create policy "Allow active admins to insert blocked_slots"
on public.blocked_slots
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.id = blocked_slots.created_by_admin_id
      and admin_users.is_active = true
  )
);

create policy "Allow active admins to delete blocked_slots"
on public.blocked_slots
for delete
to anon, authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.id = blocked_slots.created_by_admin_id
      and admin_users.is_active = true
  )
);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "Allow active admins to insert activity logs" on public.admin_activity_logs;

create policy "Allow active admins to insert activity logs"
on public.admin_activity_logs
for insert
to anon, authenticated
with check (
  admin_user_id is null
  or exists (
    select 1
    from public.admin_users
    where admin_users.id = admin_activity_logs.admin_user_id
      and admin_users.is_active = true
  )
);
