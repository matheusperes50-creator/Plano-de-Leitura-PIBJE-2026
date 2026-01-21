
export interface ReadingEntry {
  day: number;
  month: string;
  passage: string;
}

export type ProgressState = Record<string, boolean>; // key format: "month-day"

export interface MonthData {
  name: string;
  id: string;
  readings: Record<number, string>;
}
