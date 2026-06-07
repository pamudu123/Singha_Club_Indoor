alter table public.slot_prices
  add column if not exists status text not null default 'active';

update public.slot_prices
set status = case when is_active then 'active' else 'inactive' end
where status is null or status not in ('active', 'inactive', 'delete');

alter table public.slot_prices
  drop constraint if exists slot_prices_status_check;

alter table public.slot_prices
  add constraint slot_prices_status_check
  check (status in ('active', 'inactive', 'delete'));

create index if not exists slot_prices_status_idx
  on public.slot_prices (status);
