import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * Date Utilities for Timezone Handling
 *
 * Backend sends all dates in UTC (ISO 8601 format)
 * Frontend converts to user's local timezone for display
 */

/**
 * Convert UTC ISO string to local time Dayjs object
 *
 * @param utcISOString - ISO 8601 string from backend (in UTC)
 * @returns Dayjs object in user's local timezone
 */
export const convertUTCToLocal = (utcISOString: string) => {
  return dayjs.utc(utcISOString).local();
};

/**
 * Format auction time for display (e.g., "Jan 25, 2024 2:30 PM")
 *
 * @param utcISOString - ISO 8601 string from backend (in UTC)
 * @returns Formatted string in local timezone
 */
export const formatAuctionTime = (utcISOString: string): string => {
  return convertUTCToLocal(utcISOString).format("MMM DD, YYYY h:mm A");
};

/**
 * Format time for countdown display (e.g., "01:23:45")
 * Used in Countdown component
 *
 * @param milliseconds - Time duration in milliseconds
 * @returns Formatted string "HH:MM:SS"
 */
export const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(days).padStart(2, "0")}d : ${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}s`;
};

/**
 * Calculate time remaining from now to target time
 *
 * @param utcTargetTime - ISO 8601 target time string (in UTC)
 * @returns Milliseconds remaining (0 if time has passed)
 */
export const getTimeRemaining = (utcTargetTime: string): number => {
  const now = dayjs(); // Current time in local timezone
  const target = convertUTCToLocal(utcTargetTime); // Target time in local timezone
  const diff = target.diff(now);
  return Math.max(0, diff);
};

/**
 * Check if auction has started
 *
 * @param utcStartTime - ISO 8601 start time string (in UTC)
 * @returns True if start time has passed
 */
export const hasAuctionStarted = (utcStartTime: string): boolean => {
  const now = dayjs();
  const startTime = convertUTCToLocal(utcStartTime);
  return now.isAfter(startTime);
};

/**
 * Check if auction has ended
 *
 * @param utcEndTime - ISO 8601 end time string (in UTC)
 * @returns True if end time has passed
 */
export const hasAuctionEnded = (utcEndTime: string): boolean => {
  const now = dayjs();
  const endTime = convertUTCToLocal(utcEndTime);
  return now.isAfter(endTime);
};

/**
 * Get relative time string (e.g., "in 5 minutes", "2 hours ago")
 *
 * @param utcISOString - ISO 8601 string from backend (in UTC)
 * @returns Relative time string
 */
export const getRelativeTime = (utcISOString: string): string => {
  return convertUTCToLocal(utcISOString).fromNow();
};

/**
 * Determine auction status based on times
 * Useful for secondary status checks beyond the backend status field
 *
 * @param utcStartTime - ISO 8601 start time string (in UTC)
 * @param utcEndTime - ISO 8601 end time string (in UTC)
 * @returns 'UPCOMING' | 'LIVE' | 'ENDED'
 */
export const getDerivedAuctionStatus = (
  utcStartTime: string,
  utcEndTime: string,
): "UPCOMING" | "LIVE" | "ENDED" => {
  const now = dayjs();
  const startTime = convertUTCToLocal(utcStartTime);
  const endTime = convertUTCToLocal(utcEndTime);

  if (now.isBefore(startTime)) {
    return "UPCOMING";
  } else if (now.isBefore(endTime)) {
    return "LIVE";
  } else {
    return "ENDED";
  }
};

/**
 * Get user's timezone
 *
 * @returns IANA timezone string (e.g., 'America/New_York')
 */
export const getUserTimezone = (): string => {
  return dayjs.tz.guess();
};

/**
 * Normalize date value (ISO string or epoch seconds/ms) to ISO string
 *
 * @param date - Date as string or number
 * @returns ISO 8601 string
 */
export const normalizeDate = (date: any): string | undefined => {
  if (!date) return undefined;

  // If it's a number, check if it's seconds or milliseconds
  if (typeof date === "number") {
    // Epoch seconds are typically 10 digits (e.g., 1708643487)
    // Epoch ms are typically 13 digits
    const ms = date < 10000000000 ? date * 1000 : date;
    return dayjs(ms).toISOString();
  }

  // Handle Jackson serialization of Instant as an object: { epochSecond: ..., nano: ... }
  if (typeof date === "object" && date !== null) {
    if (date.epochSecond !== undefined) {
      const ms = date.epochSecond * 1000 + (date.nano || 0) / 1000000;
      return dayjs(ms).toISOString();
    }
  }

  return String(date);
};
