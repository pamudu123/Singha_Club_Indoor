import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { BookingCard } from "@/components/BookingCard";
import { SegmentedFilter } from "@/components/SegmentedFilter";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { FormField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateView";
import { Screen } from "@/components/ui/Screen";
import { useAsyncData } from "@/hooks/useAsyncData";
import { addDays, todayISO } from "@/lib/date";
import { listBookings } from "@/lib/bookingService";
import { tracks } from "@/constants/mockData";
import type { BookingStatus } from "@/types/database";

type Filter = "all" | BookingStatus;
type DateFilter = "all" | "date" | "tomorrow" | "week";
type TrackFilter = string;
type PaymentFilter = "all" | "payment_proof" | "pay_on_arrival";

export default function RequestsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const { data, error, loading } = useAsyncData(() => listBookings(), []);
  const bookings = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () =>
      bookings.filter((booking) => {
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
        return statusMatch && searchMatch && dateMatch && trackMatch && paymentMatch;
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
        title="Booking Requests"
        subtitle="Manage and respond to booking requests"
        showSearch
        showFilter
        onSearchPress={() => setShowSearch((current) => !current)}
        onFilterPress={() => setShowFilters((current) => !current)}
      />
      {showSearch ? <FormField className="mb-4" label="Search" value={search} onChangeText={setSearch} placeholder="Name, reference, NIC, or WhatsApp" /> : null}
      <SegmentedFilter
        value={filter}
        onChange={setFilter}
        options={[
          { label: "All", value: "all", count: counts.all },
          { label: "Submitted", value: "submitted", count: counts.submitted },
          { label: "Accepted", value: "accepted", count: counts.accepted },
          { label: "Rejected", value: "rejected", count: counts.rejected },
          { label: "On Hold", value: "on_hold", count: counts.on_hold }
        ]}
      />
      {showFilters ? (
        <View className="mt-5 gap-4">
          <SegmentedFilter
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { label: "All Dates", value: "all" },
              { label: "Selected", value: "date" },
              { label: "Tomorrow", value: "tomorrow" },
              { label: "This Week", value: "week" }
            ]}
          />
          {dateFilter === "date" || dateFilter === "week" ? <DatePickerField label="Filter Date" value={selectedDate} onChange={setSelectedDate} /> : null}
          <SegmentedFilter
            value={trackFilter}
            onChange={setTrackFilter}
            options={[
              { label: "All Tracks", value: "all" },
              ...tracks.map((item) => ({ label: item.track_name, value: item.id }))
            ]}
          />
          <SegmentedFilter
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={[
              { label: "Any Payment", value: "all" },
              { label: "Payment Proof", value: "payment_proof" },
              { label: "Pay on Arrival", value: "pay_on_arrival" }
            ]}
          />
        </View>
      ) : null}
      <Text className="mb-4 mt-5 text-sm text-muted">{filtered.length} of {bookings.length} requests shown</Text>
      {loading ? <LoadingState label="Loading booking requests..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && filtered.length === 0 ? <EmptyState title="No requests found" message="New booking requests will appear here." /> : null}
      {filtered.map((booking, index) => (
        <BookingCard key={booking.booking_id} booking={booking} expanded={index === 0 && filter !== "accepted"} />
      ))}
    </Screen>
  );
}
