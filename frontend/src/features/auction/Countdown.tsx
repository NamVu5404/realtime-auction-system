import { useEffect, useRef, useState } from "react";
import { Tag, Statistic } from "antd";
import { getTimeRemaining, formatCountdown } from "../../utils/dateUtils";

interface CountdownProps {
  targetTime: string; // ISO 8601 UTC string from backend
  onFinish?: () => void;
  isLive?: boolean;
}

/**
 * Countdown Timer Component
 *
 * Features:
 * - Converts UTC time to local timezone automatically
 * - Updates every second
 * - Triggers callback when countdown reaches 00:00:00
 * - Shows visual warning when < 1 minute remains
 * - Color coding: Green for "Starts In" (upcoming), Blue for "Ends In" (live)
 *
 * @param targetTime - ISO 8601 UTC time string (e.g., auction.endTime or auction.startTime)
 * @param onFinish - Called when countdown completes
 * @param isLive - If true, countdown is for end time (Blue/Cyan); if false, for start time (Green)
 */
export const Countdown = ({
  targetTime,
  onFinish,
  isLive = false,
}: CountdownProps) => {
  const calculateTimeLeft = () => {
    const remainingMs = getTimeRemaining(targetTime);
    if (remainingMs <= 0) {
      return "00:00:00";
    }
    return formatCountdown(remainingMs);
  };

  const [timeLeft, setTimeLeft] = useState<string>(calculateTimeLeft());
  const [isFinished, setIsFinished] = useState(false);
  const hasCalledFinishRef = useRef(false);

  useEffect(() => {
    // Initial check
    const initialRemaining = getTimeRemaining(targetTime);
    if (initialRemaining <= 0) {
      setIsFinished(true);
      setTimeLeft("00:00:00");
      if (!hasCalledFinishRef.current) {
        hasCalledFinishRef.current = true;
        onFinish?.();
      }
      return;
    }

    // Reset finished state when targetTime changes to a future time
    // (critical for anti-sniping: countdown may have ended, then time extends)
    setIsFinished(false);
    hasCalledFinishRef.current = false;
    setTimeLeft(formatCountdown(initialRemaining));

    // Update countdown every second
    const interval = setInterval(() => {
      const remainingMs = getTimeRemaining(targetTime);

      // Format and display remaining time
      const formatted = formatCountdown(remainingMs);
      setTimeLeft(formatted);

      // Check if countdown finished
      if (remainingMs <= 0) {
        setTimeLeft("00:00:00");
        setIsFinished(true);
        if (!hasCalledFinishRef.current) {
          hasCalledFinishRef.current = true;
          onFinish?.();
        }
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onFinish]);

  // Show "Ended" tag when countdown completes
  if (isFinished) {
    return (
      <div className="text-center">
        <Tag color="success" className="text-lg px-4 py-2 animate-pulse">
          Ended!
        </Tag>
      </div>
    );
  }

  // Check if less than 1 minute remaining (warning state)
  const [hours, minutes, seconds] = timeLeft.split(":").map(Number);
  const showWarning =
    hours === 0 && minutes === 0 && seconds < 60 && seconds > 0;

  // Color logic:
  // - Upcoming (Starts In): Green
  // - Live (Ends In): Blue/Cyan
  // - Warning: Orange-red (last minute)
  const getCountdownColor = () => {
    if (showWarning) {
      return "#e84749"; // Orange-red for warning
    }
    if (isLive) {
      return "#00C853"; // Cyan/Sky blue for live countdown
    }
    return "#3c89e8"; // Green for upcoming countdown
  };

  return (
    <div className="text-center">
      <p
        className={`text-sm mb-2 ${
          isLive ? "text-green-400" : "text-green-400"
        }`}
      >
        {isLive ? "Ends in" : "Starts in"}
      </p>
      <Statistic
        value={timeLeft}
        styles={{
          content: {
            color: getCountdownColor(),
            fontSize: "24px",
            fontWeight: "bold",
            fontFamily: "monospace",
            letterSpacing: "2px",
          },
        }}
      />
    </div>
  );
};

export default Countdown;
