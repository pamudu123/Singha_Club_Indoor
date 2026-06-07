import type { Track } from "@/types/database";

export const configuredTracks: Track[] = [
  {
    id: "TRK-0001",
    track_name: "Track 1",
    description: "Main indoor net",
    is_active: true
  },
  {
    id: "TRK-0002",
    track_name: "Track 2",
    description: "Practice indoor net",
    is_active: true
  }
];

export const configuredTrackIds = configuredTracks.map((track) => track.id);
