interface CircularProgressProps {
  /** 0-100 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  colorRgb: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 88,
  strokeWidth = 8,
  colorRgb,
  trackColor = "rgba(255,255,255,0.06)",
  children,
}: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative shrink-0 inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`rgb(${colorRgb})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.6s ease",
            filter: `drop-shadow(0 0 6px rgba(${colorRgb},0.5))`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
