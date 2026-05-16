begin;

insert into public.tracks (id, track_name, description, is_active)
values
  ('00000000-0000-4000-8000-000000000101', 'Track 1', 'Main indoor net', true),
  ('00000000-0000-4000-8000-000000000102', 'Track 2', 'Practice indoor net', true)
on conflict (id) do update set
  track_name = excluded.track_name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.admin_users (id, full_name, nic, email, whatsapp_number, is_active)
values
  ('00000000-0000-4000-8000-000000000001', 'Local Admin', '900000000V', 'admin@singha.club', '+94 77 123 4567', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  nic = excluded.nic,
  email = excluded.email,
  whatsapp_number = excluded.whatsapp_number,
  is_active = excluded.is_active;

insert into public.customers (nic, full_name, email, whatsapp_number)
values
  ('990123456V', 'Kavindu Perera', 'kavindu.perera@gmail.com', '+94 77 123 4567'),
  ('981112222V', 'Arjun Mehta', 'arjun@example.com', '+94 76 555 1212'),
  ('965551111V', 'Vikram Singh', 'vikram@example.com', '+94 75 222 7890'),
  ('932221111V', 'Nehan Kapoor', 'nehan@example.com', '+94 71 444 7788'),
  ('955551234V', 'Tharindu Perera', 'tharindu.perera@example.com', '+94 77 234 5678')
on conflict (nic) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  whatsapp_number = excluded.whatsapp_number;

insert into public.slot_prices (id, track_id, start_time, end_time, day_type, price, currency, effective_from, effective_to, is_active)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '06:00', '08:00', 'weekday', 700, 'LKR', '2026-05-01', '2026-12-31', true),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000101', '08:00', '12:00', 'weekday', 900, 'LKR', '2026-05-01', '2026-12-31', true),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101', '16:00', '22:00', 'weekday', 1300, 'LKR', '2026-05-01', null, true),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', '06:00', '12:00', 'weekday', 800, 'LKR', '2026-05-01', null, true),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000102', '16:00', '22:00', 'weekend', 1500, 'LKR', '2026-05-01', null, true)
on conflict (id) do update set
  track_id = excluded.track_id,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  day_type = excluded.day_type,
  price = excluded.price,
  currency = excluded.currency,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  is_active = excluded.is_active;

insert into public.bookings (
  booking_id,
  booking_reference,
  customer_nic,
  booking_date,
  number_of_people,
  status,
  remarks,
  total_price,
  currency,
  accepted_by_admin_id,
  accepted_at,
  rejected_by_admin_id,
  rejected_at,
  rejection_reason,
  on_hold_reason,
  created_at
)
values
  ('20000000-0000-4000-8000-000000000001', 'SCB-2026-000101', '990123456V', '2026-05-16', 12, 'submitted', 'Corporate match. Please arrange extra lights if possible.', 5200, 'LKR', null, null, null, null, null, null, '2026-05-16 08:10:00+05:30'),
  ('20000000-0000-4000-8000-000000000002', 'SCB-2026-000102', '981112222V', '2026-05-16', 8, 'accepted', 'Morning practice session.', 2800, 'LKR', '00000000-0000-4000-8000-000000000001', '2026-05-16 08:35:00+05:30', null, null, null, null, '2026-05-16 07:45:00+05:30'),
  ('20000000-0000-4000-8000-000000000003', 'SCB-2026-000103', '965551111V', '2026-05-17', 10, 'on_hold', 'Needs changing rooms for 10 people.', 4500, 'LKR', null, null, null, null, null, 'Waiting for payment confirmation.', '2026-05-16 09:00:00+05:30'),
  ('20000000-0000-4000-8000-000000000004', 'SCB-2026-000104', '932221111V', '2026-05-18', 6, 'rejected', 'Requested unavailable private event time.', 3000, 'LKR', null, null, '00000000-0000-4000-8000-000000000001', '2026-05-16 09:20:00+05:30', 'Track unavailable for private event.', null, '2026-05-15 18:00:00+05:30')
on conflict (booking_id) do update set
  booking_reference = excluded.booking_reference,
  customer_nic = excluded.customer_nic,
  booking_date = excluded.booking_date,
  number_of_people = excluded.number_of_people,
  status = excluded.status,
  remarks = excluded.remarks,
  total_price = excluded.total_price,
  currency = excluded.currency,
  accepted_by_admin_id = excluded.accepted_by_admin_id,
  accepted_at = excluded.accepted_at,
  rejected_by_admin_id = excluded.rejected_by_admin_id,
  rejected_at = excluded.rejected_at,
  rejection_reason = excluded.rejection_reason,
  on_hold_reason = excluded.on_hold_reason;

insert into public.booking_slots (id, booking_id, track_id, slot_date, start_time, end_time, price_at_booking, slot_status)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '2026-05-16', '18:00', '18:30', 1300, 'active'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '2026-05-16', '18:30', '19:00', 1300, 'active'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '2026-05-16', '19:00', '19:30', 1300, 'active'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '2026-05-16', '19:30', '20:00', 1300, 'active'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', '2026-05-16', '07:00', '07:30', 800, 'active'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', '2026-05-16', '07:30', '08:00', 800, 'active'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', '2026-05-16', '08:00', '08:30', 600, 'active'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', '2026-05-16', '08:30', '09:00', 600, 'active'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101', '2026-05-17', '20:00', '20:30', 1500, 'active'),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101', '2026-05-17', '20:30', '21:00', 1500, 'active'),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101', '2026-05-17', '21:00', '21:30', 1500, 'active'),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', '2026-05-18', '19:00', '19:30', 1500, 'released'),
  ('30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', '2026-05-18', '19:30', '20:00', 1500, 'released')
on conflict (id) do update set
  booking_id = excluded.booking_id,
  track_id = excluded.track_id,
  slot_date = excluded.slot_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  price_at_booking = excluded.price_at_booking,
  slot_status = excluded.slot_status;

insert into public.booking_payments (id, booking_id, payment_method, payment_proof_path)
values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'payment_proof', 'payment-proofs/SCB-2026-000101/payment-proof.jpg'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'pay_on_arrival', null),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'payment_proof', 'payment-proofs/SCB-2026-000103/payment-proof.pdf'),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'pay_on_arrival', null)
on conflict (id) do update set
  booking_id = excluded.booking_id,
  payment_method = excluded.payment_method,
  payment_proof_path = excluded.payment_proof_path;

insert into public.booking_status_history (id, booking_id, old_status, new_status, changed_by_admin_id, reason, created_at)
values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'submitted', 'submitted', '00000000-0000-4000-8000-000000000001', 'Booking submitted from mobile app', '2026-05-16 08:10:00+05:30'),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'submitted', 'accepted', '00000000-0000-4000-8000-000000000001', 'Payment confirmed by admin', '2026-05-16 08:35:00+05:30'),
  ('50000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'submitted', 'on_hold', '00000000-0000-4000-8000-000000000001', 'Waiting for payment confirmation', '2026-05-16 09:05:00+05:30'),
  ('50000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'submitted', 'rejected', '00000000-0000-4000-8000-000000000001', 'Track unavailable for private event', '2026-05-16 09:20:00+05:30')
on conflict (id) do update set
  booking_id = excluded.booking_id,
  old_status = excluded.old_status,
  new_status = excluded.new_status,
  changed_by_admin_id = excluded.changed_by_admin_id,
  reason = excluded.reason;

insert into public.blocked_slots (id, track_id, slot_date, start_time, end_time, reason, created_by_admin_id, created_at)
values
  ('60000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '2026-05-16', '21:00', '21:30', 'Maintenance', '00000000-0000-4000-8000-000000000001', '2026-05-16 09:30:00+05:30'),
  ('60000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000101', '2026-05-16', '21:30', '22:00', 'Maintenance', '00000000-0000-4000-8000-000000000001', '2026-05-16 09:30:00+05:30'),
  ('60000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000102', '2026-05-17', '09:30', '10:00', 'Staff Training', '00000000-0000-4000-8000-000000000001', '2026-05-16 09:30:00+05:30'),
  ('60000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', '2026-05-17', '10:00', '10:30', 'Staff Training', '00000000-0000-4000-8000-000000000001', '2026-05-16 09:30:00+05:30')
on conflict (id) do update set
  track_id = excluded.track_id,
  slot_date = excluded.slot_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  reason = excluded.reason,
  created_by_admin_id = excluded.created_by_admin_id;

insert into public.admin_activity_logs (id, admin_user_id, booking_id, action_type, description, created_at)
values
  ('70000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'booking_accepted', 'Accepted SCB-2026-000102 after confirming morning session.', '2026-05-16 08:35:00+05:30'),
  ('70000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'booking_on_hold', 'Placed SCB-2026-000103 on hold for payment confirmation.', '2026-05-16 09:05:00+05:30'),
  ('70000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', null, 'slot_blocked', 'Blocked Track 1 maintenance slots on 2026-05-16.', '2026-05-16 09:30:00+05:30')
on conflict (id) do update set
  admin_user_id = excluded.admin_user_id,
  booking_id = excluded.booking_id,
  action_type = excluded.action_type,
  description = excluded.description;

commit;
