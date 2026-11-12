import { BOARD_SIZE } from "./constants";

export { cn } from "cn";

export const normalizePositionValue = (value: number) => value / (BOARD_SIZE / 2);

export const denormalizePositionValue = (value: number) => (BOARD_SIZE / 2) * value;
