import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { BookingCard } from "@/components/BookingCard";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { FormField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { addDays, todayISO } from "@/lib/date";
import { listBookings } from "@/lib/bookingService";
import type { BookingStatus } from "@/types/database";

type Filter = "all" | BookingStatus;
type DateFilter = "all" | "date" | "tomorrow" | "week";
type TrackFilter = string;
type PaymentFilter = "all" | "payment_proof" | "pay_on_arrival";

export default function RequestsScreen() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const { trackOptions, error: tracksError } = useTracks();
  const { data, error, loading, refresh } = useAsyncData(
    () => listBookings({ status: filter, dateFilter, selectedDate, onlyFutureOrToday: true }),
    [filter, dateFilter, selectedDate],
    true
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  const bookings = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () =>
      bookings.filter((booking) => {
        const isNotPast = booking.booking_date >= todayISO();
        const statusMatch = filter === "all" || booking.status === filter;
        const query = search.trim().toLowerCase();
        const searchMatch =
          !query ||
          booking.booking_reference.toLowerCase().includes(query) ||
          booking.customers?.full_name?.toLowerCase().includes(query) ||
          booking.customers?.whatsapp_number?.toLowerCase().includes(query) ||
          booking.customer_nic.toLowerCase().includes(query);
        const slot = booking.booking_slots?.[0];
        const payment = booking.booking_payments?.[0];
        const tomorrow = addDays(todayISO(), 1);
        const weekEnd = addDays(selectedDate, 6);
        const dateMatch =
          dateFilter === "all" ||
          (dateFilter === "date" && booking.booking_date === selectedDate) ||
          (dateFilter === "tomorrow" && booking.booking_date === tomorrow) ||
          (dateFilter === "week" && booking.booking_date >= selectedDate && booking.booking_date <= weekEnd);
        const trackMatch = trackFilter === "all" || String(slot?.track_id) === trackFilter;
        const paymentMatch = paymentFilter === "all" || payment?.payment_method === paymentFilter;
        return isNotPast && statusMatch && searchMatch && dateMatch && trackMatch && paymentMatch;
      }),
    [bookings, dateFilter, filter, paymentFilter, search, selectedDate, trackFilter]
  );
  const counts = useMemo(
    () => ({
      all: bookings.length,
      submitted: bookings.filter((booking) => booking.status === "submitted").length,
      accepted: bookings.filter((booking) => booking.status === "accepted").length,
      rejected: bookings.filter((booking) => booking.status === "rejected").length,
      on_hold: bookings.filter((booking) => booking.status === "on_hold").length
    }),
    [bookings]
  );

  return (
    <Screen>
      <AppHeader
        title={t("requests.title")}
        subtitle={t("requests.subtitle")}
        showSearch
        showFilter
        onSearchPress={() => setShowSearch((current) => !current)}
        onFilterPress={() => setShowFilters((current) => !current)}
      />
      {showSearch ? <FormField className="mb-4" label={t("common.search")} value={search} onChangeText={setSearch} placeholder={t("requests.searchPlaceholder")} /> : null}
      <SegmentedFilter
        value={filter}
        onChange={setFilter}
        options={[
          { label: t("common.all"), value: "all", count: counts.all },
          { label: t("common.submitted"), value: "submitted", count: counts.submitted },
          { label: t("common.accepted"), value: "accepted", count: counts.accepted },
          { label: t("common.rejected"), value: "rejected", count: counts.rejected },
          { label: t("common.onHold"), value: "on_hold", count: counts.on_hold }
        ]}
      />
      {showFilters ? (
        <View className="mt-5">
          <FilterCategory title={t("requests.dateCategory")}>
            <SegmentedFilter
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { label: t("common.allDates"), value: "all" },
                { label: t("common.selected"), value: "date" },
                { label: t("common.tomorrow"), value: "tomorrow" },
                { label: t("requests.thisWeek"), value: "week" }
              ]}
            />
            {dateFilter === "date" || dateFilter === "week" ? <DatePickerField className="mt-4" label={t("common.filterDate")} value={selectedDate} onChange={setSelectedDate} /> : null}
          </FilterCategory>

          <FilterCategory title={t("requests.trackCategory")}>
            <SegmentedFilter
              value={trackFilter}
              onChange={setTrackFilter}
              options={[
                { label: t("common.allTracks"), value: "all" },
                ...trackOptions
              ]}
            />
          </FilterCategory>

          <FilterCategory title={t("requests.paymentCategory")}>
            <SegmentedFilter
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { label: t("common.anyPayment"), value: "all" },
                { label: t("common.paymentProof"), value: "payment_proof" },
                { label: t("create.payOnArrival"), value: "pay_on_arrival" }
              ]}
            />
          </FilterCategory>
        </View>
      ) : null}
      <Text className="mb-4 mt-5 text-sm text-muted">{t("requests.shown", { shown: filtered.length, total: bookings.length })}</Text>
      {loading ? <LoadingState label={t("requests.loading")} /> : null}
      {error || tracksError ? <ErrorState message={error ?? tracksError ?? ""} /> : null}
      {!loading && filtered.length === 0 ? <EmptyState title={t("requests.emptyTitle")} message={t("requests.emptyMessage")} /> : null}
      {filtered.map((booking, index) => (
        <BookingCard key={booking.booking_id} booking={booking} expanded={index === 0 && filter !== "accepted"} />
      ))}
    </Screen>
  );
}

function FilterCategory({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="border-t border-line py-4">
      <Text className="mb-3 text-sm font-semibold uppercase text-muted">{title}</Text>
      {children}
    </View>
  );
}
