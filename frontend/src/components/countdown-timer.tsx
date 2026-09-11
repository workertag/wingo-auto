import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Props {
  targetDate: Date | string | number;
  className?: string;
}

export function CountdownTimer({ targetDate, className }: Props) {
  const target = new Date(targetDate).getTime();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => compute(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(compute(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units: [keyof TimeLeft, string][] = [
    ["days", "Days"],
    ["hours", "Hours"],
    ["minutes", "Min"],
    ["seconds", "Sec"],
  ];

  return (
    <div className={`flex gap-3 ${className ?? ""}`}>
      {units.map(([key, label]) => (
        <div key={key} className="flex flex-col items-center">
          <div
            className="w-14 h-14 flex items-center justify-center rounded-xl text-2xl font-mono font-bold"
            style={{
              background: "var(--chip-bg)",
              border: "1px solid var(--line)",
              color: "var(--tb-ink)",
            }}
          >
            {String(timeLeft[key]).padStart(2, "0")}
          </div>
          <span
            className="text-xs mt-1 font-medium"
            style={{ color: "var(--tb-ink-soft)" }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function compute(target: number): TimeLeft {
  const distance = target - Date.now();
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}
