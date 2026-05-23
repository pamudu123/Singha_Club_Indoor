export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function validateSignup(input: {
  fullName: string;
  whatsappNumber: string;
  email: string;
}) {
  if (!input.fullName.trim()) return "Name is required.";
  if (!input.whatsappNumber.trim()) return "WhatsApp number is required.";
  if (!isEmail(input.email)) return "Enter a valid email address.";
  return null;
}

export function validateLogin(username: string) {
  if (!username.trim()) return "Username is required.";
  return null;
}

export function validateBooking(input: {
  name: string;
  nic: string;
  whatsapp: string;
  bookingDate: string;
  selectedSlots: string[];
  people: number;
}) {
  if (!input.name.trim()) return "Customer name is required.";
  if (!input.nic.trim()) return "NIC is required.";
  if (!input.whatsapp.trim()) return "WhatsApp number is required.";
  if (!input.bookingDate) return "Booking date is required.";
  if (!input.selectedSlots.length) return "Select at least one time slot.";
  if (input.people < 1) return "Number of people must be at least 1.";
  return null;
}
