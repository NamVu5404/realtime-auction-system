import { useEffect, useRef, useState } from "react";
import { getTimeRemaining, formatCountdown } from "../../utils/dateUtils";

interface CountdownProps {
  targetTime: string;
  onFinish?: () => void;
  isLive?: boolean;
  compact?: boolean;
}

export const Countdown = ({
  targetTime,
  onFinish,
  isLive = false,
  compact = false,
}: CountdownProps) => {
  const calculateTimeLeft = () => {
    const remainingMs = getTimeRemaining(targetTime);
    if (remainingMs <= 0) return "00d : 00h : 00m : 00s";
    return formatCountdown(remainingMs);
  };

  const [timeLeft, setTimeLeft] = useState<string>(calculateTimeLeft());
  const [isFinished, setIsFinished] = useState(false);
  const hasCalledFinishRef = useRef(false);

  useEffect(() => {
    const initialRemaining = getTimeRemaining(targetTime);
    if (initialRemaining <= 0) {
      setIsFinished(true);
      setTimeLeft("00d : 00h : 00m : 00s");
      if (!hasCalledFinishRef.current) {
        hasCalledFinishRef.current = true;
        onFinish?.();
      }
      return;
    }

    setIsFinished(false);
    hasCalledFinishRef.current = false;
    setTimeLeft(formatCountdown(initialRemaining));

    const interval = setInterval(() => {
      const remainingMs = getTimeRemaining(targetTime);
      setTimeLeft(formatCountdown(remainingMs));

      if (remainingMs <= 0) {
        setTimeLeft("00d : 00h : 00m : 00s");
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

  if (isFinished) {
    return (
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 16px",
            borderRadius: "100px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "0.5px solid rgba(239,68,68,0.5)",
            color: "#f87171",
            background: "rgba(239,68,68,0.07)",
          }}
        >
          Ended
        </span>
      </div>
    );
  }

  // Compact mode — used in auction cards to keep layout tight
  if (compact) {
    const m2 = timeLeft.match(/(\d+)d : (\d+)h : (\d+)m : (\d+)s/);
    const compactColor = isLive
      ? getTimeRemaining(targetTime) < 3600000 ? "#f87171" : "#FED469"
      : "#60a5fa";
    const display = m2
      ? `${m2[1]}d ${m2[2]}h ${m2[3]}m ${m2[4]}s`
      : timeLeft;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
          {isLive ? "Ends in" : "Starts in"}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: compactColor,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.02em",
          }}
        >
          {display}
        </span>
      </div>
    );
  }

  const match = timeLeft.match(/(\d+)d : (\d+)h : (\d+)m : (\d+)s/);
  const days = match ? parseInt(match[1], 10) : 0;
  const hours = match ? parseInt(match[2], 10) : 0;
  const minutes = match ? parseInt(match[3], 10) : 0;
  const seconds = match ? parseInt(match[4], 10) : 0;
  const showWarning =
    days === 0 && hours === 0 && minutes === 0 && seconds < 60 && seconds > 0;

  // Color logic: Pure white for digits, blue/red for backgrounds and borders
  const getColor = () => {
    if (showWarning) return "#ef4444";
    return "#fafafa"; // Pure white digits
  };

  const getLabelColor = () => {
    if (isLive) return "#FED469";
    if (showWarning) return "#ef4444";
    return "#60a5fa";
  };

  const getBorderColor = () => {
    if (showWarning) return "rgba(239,68,68,0.3)";
    if (isLive) return "rgba(254,212,105,0.3)";
    return "rgba(96,165,250,0.3)";
  };

  const getBgColor = () => {
    if (showWarning) return "rgba(239,68,68,0.06)";
    if (isLive) return "rgba(254,212,105,0.06)";
    return "rgba(96,165,250,0.06)";
  };

  const getGlowShadow = () => {
    if (showWarning) return "0 0 20px rgba(239,68,68,0.3)";
    if (isLive) return "0 0 20px rgba(254,212,105,0.2)";
    return "none";
  };

  return (
    <div
      style={{
        background: getBgColor(),
        border: `0.5px solid ${getBorderColor()}`,
        borderRadius: "12px",
        padding: "12px 16px",
        textAlign: "center",
      }}
    >
      {/* Label */}
      <div
        style={{
          display: "inline-block",
          marginBottom: "6px",
          padding: "2px 12px",
          borderRadius: "100px",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: getLabelColor(),
          border: `0.5px solid ${getBorderColor()}`,
        }}
      >
        {isLive ? "Ends in" : "Starts in"}
      </div>

      <div
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "20px",
          fontWeight: 800,
          color: getColor(),
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          textShadow: getGlowShadow(),
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
        }}
      >
        {match ? (
          <>
            <span>{match[1]}</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#ddd",
                margin: "0 4px 0 2px",
              }}
            >
              d
            </span>
            <span
              style={{
                color: "#ddd",
                margin: "0 4px",
                fontSize: "20px",
                fontWeight: 400,
              }}
            >
              :
            </span>
            <span>{match[2]}</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#ddd",
                margin: "0 4px 0 2px",
              }}
            >
              h
            </span>
            <span
              style={{
                color: "#ddd",
                margin: "0 4px",
                fontSize: "20px",
                fontWeight: 400,
              }}
            >
              :
            </span>
            <span>{match[3]}</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#ddd",
                margin: "0 4px 0 2px",
              }}
            >
              m
            </span>
            <span
              style={{
                color: "#ddd",
                margin: "0 4px",
                fontSize: "20px",
                fontWeight: 400,
              }}
            >
              :
            </span>
            <span>{match[4]}</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#ddd",
                margin: "0 0 0 2px",
              }}
            >
              s
            </span>
          </>
        ) : (
          timeLeft
        )}
      </div>
    </div>
  );
};

export default Countdown;
