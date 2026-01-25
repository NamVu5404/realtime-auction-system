import { useEffect, useState } from 'react';
import { Tag, Statistic } from 'antd';
import { getTimeRemaining, formatCountdown } from '../../utils/dateUtils';

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
export const Countdown = ({ targetTime, onFinish, isLive = false }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      const remainingMs = getTimeRemaining(targetTime);

      // Format and display remaining time
      const formatted = formatCountdown(remainingMs);
      setTimeLeft(formatted);

      // Check if countdown finished
      if (remainingMs <= 0) {
        setTimeLeft('00:00:00');
        setIsFinished(true);
        onFinish?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onFinish]);

  // Show "Ended" tag when countdown completes
  if (isFinished) {
    return (
      <Tag color="error" className="text-lg px-4 py-2">
        Time Reached
      </Tag>
    );
  }

  // Check if less than 1 minute remaining (warning state)
  const [hours, minutes, seconds] = timeLeft.split(':').map(Number);
  const showWarning = hours === 0 && minutes === 0 && seconds < 60 && seconds > 0;

  // Color logic:
  // - Upcoming (Starts In): Green
  // - Live (Ends In): Blue/Cyan
  // - Warning: Orange-red (last minute)
  const getCountdownColor = () => {
    if (showWarning) {
      return '#e84749'; // Orange-red for warning
    }
    if (isLive) {
      return '#00C853'; // Cyan/Sky blue for live countdown
    }
    return '#3c89e8'; // Green for upcoming countdown
  };

  return (
    <div className="text-center">
      <p className={`text-sm mb-2 ${
        isLive ? 'text-green-400' : 'text-green-400'
      }`}>
        {isLive ? 'Ends in' : 'Starts in'}
      </p>
      <Statistic
        value={timeLeft}
        valueStyle={{
          color: getCountdownColor(),
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          letterSpacing: '2px',
        }}
      />
    </div>
  );
};

export default Countdown;
