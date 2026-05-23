export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromISO(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function addDays(value: string, days: number) {
  const date = dateFromISO(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function formatDateLabel(value: string, locale = "en-LK") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(dateFromISO(value));
}

export function formatDay(value: string, locale = "en-LK") {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(dateFromISO(value));
}

export function formatCurrency(amount: number, currency = "LKR") {
  return `${currency} ${new Intl.NumberFormat("en-LK").format(amount)}`;
}

export function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2026, 0, 1, hour, minute + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function makeThirtyMinuteSlots(startTime: string, endTime: string) {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  let cursor = startTime;
  while (cursor < endTime) {
    const next = addMinutes(cursor, 30);
    if (next > endTime) break;
    slots.push({ startTime: cursor, endTime: next });
    cursor = next;
  }
  return slots;
}

export function displayTime(time: string) {
  const [hourValue, minute] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

export function displayTimeToDb(time: string) {
  const [rawHour, rawMinuteAndPeriod] = time.split(":");
  const [minute, period] = rawMinuteAndPeriod.split(" ");
  let hour = Number(rawHour);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}
