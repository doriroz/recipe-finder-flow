import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer, X } from "lucide-react";
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

  return (
    <div
      className={cn(
        "fixed bottom-[72px] inset-x-0 z-30 px-4 pointer-events-none",
        "animate-fade-in",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-3xl rounded-2xl shadow-lg border",
          "flex items-center justify-between gap-4 px-4 py-3",
          finished
            ? "bg-secondary text-secondary-foreground border-secondary animate-pulse"
            : "bg-primary text-primary-foreground border-primary/50",
        )}
      >
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="text-xs opacity-90">{label}</span>
            <span className="font-mono text-xl font-bold tabular-nums">{fmt(remaining)}</span>
          </div>
          {finished && <span className="text-sm font-semibold mr-2">⏰ הזמן נגמר!</span>}
        </div>
        <div className="flex items-center gap-1">
          {!finished && (
            <Button
              size="icon"
              variant="ghost"
              className="text-current hover:bg-white/20 h-9 w-9"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-current hover:bg-white/20 h-9 w-9"
            onClick={reset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-current hover:bg-white/20 h-9 w-9"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default V2StickyTimer;