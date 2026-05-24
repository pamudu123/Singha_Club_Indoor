export type BookingStatus = "submitted" | "accepted" | "rejected" | "on_hold";
export type SlotStatus = "active" | "released";
export type PaymentMethod = "payment_proof" | "pay_on_arrival";
export type DayType = "all_days" | "weekday" | "weekend" | "specific_day";

export type AdminUser = {
  id: string;
  full_name: string;
  nic?: string | null;
  email: string;
  whatsapp_number?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Customer = {
  nic: string;
  full_name: string;
  email?: string | null;
  whatsapp_number: string;
  created_at?: string;
  updated_at?: string;
};

export type Track = {
  id: string;
  track_name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Booking = {
  booking_id: string;
  booking_reference: string;
  customer_nic: string;
  booking_date: string;
  number_of_people: number;
  status: BookingStatus;
  remarks?: string | null;
  total_price: number;
  currency: string;
  accepted_by_admin_id?: string | null;
  accepted_at?: string | null;
  rejected_by_admin_id?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  on_hold_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  customers?: Customer | null;
  booking_slots?: BookingSlot[];
  booking_payments?: BookingPayment[];
  accepted_admin?: { full_name: string } | null;
  rejected_admin?: { full_name: string } | null;
};

export type BookingSlot = {
  id: string;
  booking_id: string;
  track_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  price_at_booking: number;
  slot_status: SlotStatus;
  tracks?: Track | null;
  bookings?: Booking | null;
};

export type BlockedSlot = {
  id: string;
  track_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_by_admin_id: string;
  created_at?: string;
  updated_at?: string;
  tracks?: Track | null;
};

export type SlotPrice = {
  id: string;
  track_id: string;
  start_time: string;
  end_time: string;
  day_type: DayType;
  price: number;
  currency: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  tracks?: Track | null;
};

export type BookingPayment = {
  id: string;
  booking_id: string;
  payment_method: PaymentMethod;
  payment_proof_path?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BookingStatusHistory = {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by_admin_id: string | null;
  reason?: string | null;
  created_at?: string;
  changed_by_admin?: { full_name: string } | null;
};

export type AdminActivityLog = {
  id: string;
  admin_user_id: string;
  booking_id?: string | null;
  action_type: string;
  description: string;
  created_at?: string;
};

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  totalCount: number;
};

export type CreateBookingInput = {
  bookingReference?: string;
  customer: Customer;
  bookingDate: string;
  trackId: string;
  slots: Array<{ startTime: string; endTime: string; price: number }>;
  numberOfPeople: number;
  paymentMethod: PaymentMethod;
  paymentProofPath?: string | null;
  remarks?: string;
  createAsAccepted: boolean;
  adminId: string;
};
