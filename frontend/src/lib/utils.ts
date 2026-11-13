import { BOARD_SIZE } from "./constants";

export { cn } from "cn";

export const normalizePositionValue = (value: number) => value / (BOARD_SIZE / 2);

export const denormalizePositionValue = (value: number) => (BOARD_SIZE / 2) * value;

export const getHueFromName = (name: string) => {
  const firstLetter = (name[0] ?? "a").toLowerCase();
  const value = Math.max(firstLetter.charCodeAt(0) - "a".charCodeAt(0), 0);
  const hue = Math.min(value / "z".charCodeAt(0), 1);
  return `hsl(${Math.floor(hue * 360)} 75% 75%)`;
};
