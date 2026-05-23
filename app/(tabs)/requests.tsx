import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { BookingCard } from "@/components/BookingCard";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { AppButton } from "@/components/ui/AppButton";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { FormField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { useLanguage } from "@/hooks/useLanguage";
import { useTracks } from "@/hooks/useTracks";
import { addDays, todayISO } from "@/lib/date";
import { listBookings } from "@/lib/bookingService";
import type { Booking, BookingStatus } from "@/types/database";

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const dateRange = useMemo(() => {
    if (dateFilter === "tomorrow") {
      const tomorrow = addDays(todayISO(), 1);
      return { dateStart: tomorrow, dateEnd: tomorrow };
    }
    if (dateFilter === "week") {
      return { dateStart: selectedDate, dateEnd: addDays(selectedDate, 6) };
    }
    return { dateStart: undefined, dateEnd: undefined };
  }, [dateFilter, selectedDate]);

  const refreshBookings = useCallback(
    async ({ reset, cursor }: { reset: boolean; cursor?: string | null }) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      const result = await listBookings({
        status: filter,
        dateFilter: dateFilter === "date" ? "date" : "all",
        selectedDate,
        dateStart: dateRange.dateStart,
        dateEnd: dateRange.dateEnd,
        onlyFutureOrToday: true,
        trackId: trackFilter,
        paymentMethod: paymentFilter,
        cursor: cursor ?? null,
        pageSize: 20
      });
      setLoading(false);
      setLoadingMore(false);

      if (result.error || !result.data) {
        setError(result.error ?? "Could not load bookings.");
        if (reset) {
          setBookings([]);
          setNextCursor(null);
          setTotalCount(0);
        }
        return;
      }

      const page = result.data;
      setError(null);
      setBookings((current) => (reset ? page.items : [...current, ...page.items]));
      setNextCursor(page.nextCursor);
      setTotalCount(page.totalCount);
    },
    [dateFilter, dateRange.dateEnd, dateRange.dateStart, filter, paymentFilter, selectedDate, trackFilter]
  );

  useFocusEffect(
    useCallback(() => {
      refreshBookings({ reset: true });
    }, [refreshBookings])
  );

  const filtered = useMemo(
    () =>
      bookings.filter((booking) => {
        const query = search.trim().toLowerCase();
        return (
          !query ||
          booking.booking_reference.toLowerCase().includes(query) ||
          booking.customers?.full_name?.toLowerCase().includes(query) ||
          booking.customers?.whatsapp_number?.toLowerCase().includes(query) ||
          booking.customer_nic.toLowerCase().includes(query)
        );
      }),
    [bookings, search]
  );
  const recordIds = useMemo(() => filtered.map((booking) => booking.booking_id), [filtered]);
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
      <Text className="mb-4 mt-5 text-sm text-muted">{t("requests.shown", { shown: filtered.length, total: totalCount })}</Text>
      {loading ? <LoadingState label={t("requests.loading")} /> : null}
      {error || tracksError ? <ErrorState message={error ?? tracksError ?? ""} /> : null}
      {!loading && filtered.length === 0 ? <EmptyState title={t("requests.emptyTitle")} message={t("requests.emptyMessage")} /> : null}
      {filtered.map((booking, index) => (
        <BookingCard
          key={booking.booking_id}
          booking={booking}
          expanded={index === 0 && filter !== "accepted"}
          onPress={() =>
            router.push({
              pathname: "/booking/[id]",
              params: {
                id: booking.booking_id,
                recordIds: recordIds.join(","),
                recordIndex: String(index)
              }
            })
          }
        />
      ))}
      {nextCursor ? (
        <AppButton
          className="mb-6"
          title={loadingMore ? t("common.loading") : t("common.show")}
          variant="ghost"
          loading={loadingMore}
          onPress={() => refreshBookings({ reset: false, cursor: nextCursor })}
        />
      ) : null}
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
