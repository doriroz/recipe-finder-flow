import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface V2StickyTimerProps {
  durationSeconds: number;
  label: string;
  onDismiss: () => void;
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

const V2StickyTimer = ({ durationSeconds, label, onDismiss }: V2StickyTimerProps) => {
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

  // Circular progress ring math
  const size = 160;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className={cn(
        "fixed bottom-[88px] inset-x-0 z-30 px-4 pointer-events-none flex justify-center",
        "animate-fade-in",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto relative rounded-full",
          "flex items-center gap-6 ps-8 pe-4 py-4",
          "border border-white/40 backdrop-blur-md",
          "transition-all duration-500",
          finished
            ? "animate-pulse"
            : "",
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
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(0 0% 100% / 0.25)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(0 0% 100%)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono font-bold tabular-nums leading-none text-[2.75rem] tracking-tight drop-shadow-sm">
              {fmt(remaining)}
            </span>
            <span className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] opacity-85">
              {finished ? "⏰ הזמן נגמר" : label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-3 pe-2">
          {!finished && (
            <Button
              size="icon"
              variant="ghost"
              className="text-current hover:bg-white/25 bg-white/10 h-12 w-12 rounded-full"
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? "השהה" : "המשך"}
            >
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-current hover:bg-white/25 bg-white/10 h-12 w-12 rounded-full"
            onClick={reset}
            aria-label="אפס"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-current hover:bg-white/25 bg-white/10 h-12 w-12 rounded-full"
            onClick={onDismiss}
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default V2StickyTimer;