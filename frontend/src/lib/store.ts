import { create } from "zustand";
import type { Position, SubscriberState } from "./requests";

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
  setRoomState: (state: RoomState) => set(() => ({ room: state })),
  setId: (id: string) => set(() => ({ id })),
  reset: () => set(defaultState),
}));
