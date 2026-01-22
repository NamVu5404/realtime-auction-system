import { useEffect, useState } from 'react';
import { Tag, Statistic } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';

dayjs.extend(duration);
dayjs.extend(utc);

interface CountdownProps {
  endTime: string;
  onEnded?: () => void;
  isLive?: boolean;
}

export const Countdown = ({ endTime, onEnded, isLive = false }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = dayjs();
      const end = dayjs(endTime);
      const diff = end.diff(now);

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsEnded(true);
        onEnded?.();
        clearInterval(interval);
        return;
      }

      const dur = dayjs.duration(diff);
      const hours = String(Math.floor(dur.asHours())).padStart(2, '0');
      const minutes = String(dur.minutes()).padStart(2, '0');
      const seconds = String(dur.seconds()).padStart(2, '0');

      setTimeLeft(`${hours}:${minutes}:${seconds}`);

      // Trigger warning when less than 1 minute
      if (diff < 60000 && diff > 0) {
        setIsEnded(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnded]);

  if (isEnded) {
    return (
      <Tag color="error" className="text-lg px-4 py-2">
        Ended
      </Tag>
    );
  }

  const showWarning = timeLeft.startsWith('00:0') && timeLeft !== '00:00:00';

  return (
    <div className="text-center">
      <p className="text-sm text-gray-500 mt-1">
        {isLive ? 'Ends in' : 'Starts in'}
      </p>
      <Statistic
        value={timeLeft}
        valueStyle={{
          color: showWarning ? '#1890ff' : isLive ? '#ff4d4f' : '#52c41a',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
        }}
      />
    </div>
  );
};

export default Countdown;
