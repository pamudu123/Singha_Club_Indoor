import type { Track } from "@/types/database";

export const configuredTracks: Track[] = [
  {
    id: "d7392b1c-d247-46a6-b39c-18b5f8dceb6b",
    track_name: "Track 1",
    description: "Main indoor net",
    is_active: true
  },
  {
    id: "74aed49b-736a-42c4-b227-ce6d68c2c75d",
    track_name: "Track 2",
    description: "Practice indoor net",
    is_active: true
  }
];

export const configuredTrackIds = configuredTracks.map((track) => track.id);
