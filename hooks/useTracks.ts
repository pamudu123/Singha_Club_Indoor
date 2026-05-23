import { useMemo } from "react";
import { listTracks } from "@/lib/scheduleService";
import { useAsyncData } from "./useAsyncData";

export function useTracks() {
  const result = useAsyncData(listTracks, []);
  const tracks = result.data ?? [];
  const trackOptions = useMemo(() => tracks.map((track) => ({ label: track.track_name, value: track.id })), [tracks]);

  return {
    ...result,
    tracks,
    trackOptions
  };
}
