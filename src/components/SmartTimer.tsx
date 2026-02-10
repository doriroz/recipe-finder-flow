import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartTimerProps {
  durationSeconds: number;
  label: string;
}

const SmartTimer = ({ durationSeconds, label }: SmartTimerProps) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      clear();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clear();
          setRunning(false);
          setFinished(true);
          playSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clear;
  }, [running, clear]);

  const playSound = () => {
    try {
      const ctx = audioRef.current || new AudioContext();
      audioRef.current = ctx;
      // Play 3 short beeps
      [0, 0.2, 0.4].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch {
      // Audio not available
    }
  };

  const reset = () => {
    clear();
    setRunning(false);
    setFinished(false);
    setRemaining(durationSeconds);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!running && !finished && remaining === durationSeconds) {
    // Initial state - show start button
    return (
      <Button
        variant="warm"
        size="sm"
        className="gap-2 mt-2"
        onClick={() => setRunning(true)}
      >
        <Timer className="w-4 h-4" />
        התחל טיימר - {label}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "mt-3 rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-300 border-2",
        finished
          ? "border-primary bg-accent animate-pulse"
          : "border-secondary/30 bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <Timer className={cn("w-5 h-5", finished ? "text-primary" : "text-secondary")} />
        <span className="font-bold text-xl font-mono tabular-nums text-foreground">
          {formatTime(remaining)}
        </span>
        {finished && (
          <span className="text-primary font-semibold text-sm">⏰ הזמן נגמר!</span>
        )}
      </div>

      <div className="flex gap-2">
        {!finished && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setRunning((p) => !p)}
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={reset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SmartTimer;
