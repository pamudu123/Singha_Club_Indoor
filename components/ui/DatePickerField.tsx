import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { dateFromISO, formatDateLabel, toISODate, todayISO } from "@/lib/date";

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  minDate?: string;
  maxDate?: string;
  className?: string;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DatePickerField({ label, value, onChange, error, minDate, maxDate, className = "" }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(dateFromISO(value || todayISO())));
  const selectedDate = dateFromISO(value || todayISO());

  const monthLabel = new Intl.DateTimeFormat("en-LK", { month: "long", year: "numeric" }).format(visibleMonth);
  const days = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(date: Date) {
    const next = toISODate(date);
    if (isDisabled(next, minDate, maxDate)) return;
    onChange(next);
    setVisibleMonth(startOfMonth(date));
    setOpen(false);
  }

  function selectToday() {
    const next = todayISO();
    if (isDisabled(next, minDate, maxDate)) return;
    onChange(next);
    setVisibleMonth(startOfMonth(dateFromISO(next)));
    setOpen(false);
  }

  return (
    <View className={className}>
      <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      <Pressable className={`min-h-14 flex-row items-center rounded-xl border bg-white px-3 active:opacity-80 ${error ? "border-red-300" : "border-line"}`} onPress={() => setOpen(true)}>
        <CalendarDays size={20} color={colors.muted} />
        <Text className="ml-3 flex-1 text-base text-ink">{formatDateLabel(value)}</Text>
      </Pressable>
      {error ? <Text className="mt-1 text-sm text-red-500">{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/30 px-4 pb-6">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="rounded-2xl border border-line bg-white p-4 shadow-lg">
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable className="h-11 w-11 items-center justify-center rounded-xl border border-line" onPress={() => moveMonth(-1)}>
                <ChevronLeft size={22} color={colors.ink} />
              </Pressable>
              <Text className="text-lg font-bold text-ink">{monthLabel}</Text>
              <Pressable className="h-11 w-11 items-center justify-center rounded-xl border border-line" onPress={() => moveMonth(1)}>
                <ChevronRight size={22} color={colors.ink} />
              </Pressable>
            </View>

            <View className="flex-row">
              {weekDays.map((day) => (
                <Text key={day} className="h-8 flex-1 text-center text-xs font-semibold text-muted">
                  {day}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {days.map((date) => {
                const isoDate = toISODate(date);
                const selected = isoDate === toISODate(selectedDate);
                const muted = date.getMonth() !== visibleMonth.getMonth();
                const disabled = isDisabled(isoDate, minDate, maxDate);
                return (
                  <Pressable
                    key={isoDate}
                    className={`h-11 basis-[14.2857%] items-center justify-center rounded-xl ${selected ? "bg-singha-600" : ""} ${disabled ? "opacity-30" : ""}`}
                    disabled={disabled}
                    onPress={() => selectDate(date)}
                  >
                    <Text className={`font-semibold ${selected ? "text-white" : muted ? "text-muted" : "text-ink"}`}>{date.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable className="min-h-12 flex-1 items-center justify-center rounded-xl border border-line bg-white" onPress={() => setOpen(false)}>
                <Text className="font-semibold text-ink">Cancel</Text>
              </Pressable>
              <Pressable className="min-h-12 flex-1 items-center justify-center rounded-xl border border-singha-600 bg-green-50" onPress={selectToday}>
                <Text className="font-semibold text-singha-700">Today</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function isDisabled(value: string, minDate?: string, maxDate?: string) {
  return Boolean((minDate && value < minDate) || (maxDate && value > maxDate));
}
