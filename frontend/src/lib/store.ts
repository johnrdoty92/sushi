import { create } from "zustand";
import type { Position, SubscriberState } from "./requests";
import { denormalizePositionValue } from "./utils";

type ItemState = {
  id: string;
  ownerId: string;
  position: Position;
  visible: boolean;
};

type RoomState = {
  subscribers: SubscriberState[];
  items: ItemState[];
  timeRemaining: number;
};

const defaultState: { id: string; room: RoomState } = {
  id: "",
  room: {
    subscribers: [],
    items: [],
    timeRemaining: -1,
  },
};

type ConnectionState = typeof defaultState & {
  setRoomState: (state: RoomState) => void;
  setId: (id: string) => void;
  reset: () => void;
};

export const useConnectionState = create<ConnectionState>()((set) => ({
  ...defaultState,
  setRoomState: ({ subscribers, items, timeRemaining }: RoomState) =>
    set(() => ({
      room: {
        subscribers: subscribers.map((s) => ({
          ...s,
          position: {
            x: denormalizePositionValue(s.position.x),
            y: denormalizePositionValue(s.position.y),
          },
        })),
        items: items.map((i) => ({
          ...i,
          position: {
            x: denormalizePositionValue(i.position.x),
            y: denormalizePositionValue(i.position.y),
          },
        })),
        timeRemaining,
      },
    })),
  setId: (id: string) => set(() => ({ id })),
  reset: () => set(defaultState),
}));
