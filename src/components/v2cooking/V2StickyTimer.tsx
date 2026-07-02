import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface V2StickyTimerProps {
  durationSeconds: number;
  label: string;
  onDismiss: () => void;
  fixed?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const playChime = () => {
  try {
    const Ctx =
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.18, 0.36].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 1320 : 880;
      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.25, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.4);
    });
    setTimeout(() => ctx.close().catch(() => {}), 2000);
  } catch {
    /* noop */
  }
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const sizeConfig = {
  xs: {
    ring: 110,
    stroke: 7,
    buttonSize: "h-8 w-8",
    iconSize: "w-3.5 h-3.5",
    gap: "gap-2",
    padding: "ps-3 pe-3 py-2",
    timeText: "text-[1.5rem]",
    labelText: "text-[0.55rem]",
  },
  sm: {
    ring: 150,
    stroke: 8,
    buttonSize: "h-9 w-9",
    iconSize: "w-4 h-4",
    gap: "gap-3",
    padding: "ps-4 pe-3 py-3",
    timeText: "text-[2rem]",
    labelText: "text-[0.65rem]",
  },
  md: {
    ring: 160,
    stroke: 9,
    buttonSize: "h-11 w-11",
    iconSize: "w-5 h-5",
    gap: "gap-4",
    padding: "ps-5 pe-4 py-3",
    timeText: "text-[2.25rem]",
    labelText: "text-[0.68rem]",
  },
  lg: {
    ring: 160,
    stroke: 10,
    buttonSize: "h-12 w-12",
    iconSize: "w-5 h-5",
    gap: "gap-6",
    padding: "ps-8 pe-5 py-4",
    timeText: "text-[2.75rem]",
    labelText: "text-[0.7rem]",
  },
};

const V2StickyTimer = ({
  durationSeconds,
  label,
  onDismiss,
  fixed = true,
  size = "lg",
}: V2StickyTimerProps) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((p) => {
        if (p <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          setFinished(true);
          playChime();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = () => {
    setRemaining(durationSeconds);
    setFinished(false);
    setRunning(true);
  };

  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  const widget = (
    <div
      className={cn(
        "pointer-events-auto relative rounded-full",
        "flex items-center",
        config.gap,
        config.padding,
        "border border-white/40 backdrop-blur-md",
        "transition-all duration-500",
        finished ? "animate-pulse" : "",
      )}
      style={{
        background: finished
          ? "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--secondary) / 0.85) 100%)"
          : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(28 95% 65%) 100%)",
        boxShadow:
          "0 20px 50px -12px hsl(var(--primary) / 0.55), 0 8px 20px -8px hsl(var(--primary) / 0.35)",
        color: "hsl(var(--primary-foreground))",
      }}
    >
      {/* Circular progress ring + countdown */}
      <div className="relative shrink-0" style={{ width: config.ring, height: config.ring }}>
        <svg width={config.ring} height={config.ring} className="-rotate-90">
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(0 0% 100% / 0.25)"
            strokeWidth={config.stroke}
          />
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(0 0% 100%)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-mono font-bold tabular-nums leading-none tracking-tight drop-shadow-sm",
              config.timeText,
            )}
          >
            {fmt(remaining)}
          </span>
          <span
            className={cn(
              "mt-2 uppercase tracking-[0.18em] opacity-85",
              config.labelText,
            )}
          >
            {finished ? "⏰ הזמן נגמר" : label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {!finished && (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "text-current hover:bg-white/25 bg-white/10 rounded-full",
              config.buttonSize,
            )}
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? "השהה" : "המשך"}
          >
            {running ? (
              <Pause className={config.iconSize} />
            ) : (
              <Play className={config.iconSize} />
            )}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "text-current hover:bg-white/25 bg-white/10 rounded-full",
            config.buttonSize,
          )}
          onClick={reset}
          aria-label="אפס"
        >
          <RotateCcw className={config.iconSize} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "text-current hover:bg-white/25 bg-white/10 rounded-full",
            config.buttonSize,
          )}
          onClick={onDismiss}
          aria-label="סגור"
        >
          <X className={config.iconSize} />
        </Button>
      </div>
    </div>
  );

  if (!fixed) return widget;

  return (
    <div
      className={cn(
        "fixed bottom-[88px] inset-x-0 z-30 px-4 pointer-events-none flex justify-center",
        "animate-fade-in",
      )}
    >
      {widget}
    </div>
  );
};

export default V2StickyTimer;
