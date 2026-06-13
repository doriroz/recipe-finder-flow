import { useEffect, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type WakeLockSentinel = { release: () => Promise<void> };

const V2KeepAwakeToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> };
      };
      if (nav.wakeLock?.request) {
        lockRef.current = await nav.wakeLock.request("screen");
      }
    } catch (err) {
      console.warn("[KeepAwake] failed:", err);
    }
  };

  const release = async () => {
    try {
      await lockRef.current?.release();
    } catch {
      /* noop */
    }
    lockRef.current = null;
  };

  useEffect(() => {
    if (enabled) acquire();
    else release();
    return () => {
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Re-acquire on visibility change
  useEffect(() => {
    const onVis = () => {
      if (enabled && document.visibilityState === "visible" && !lockRef.current) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="מידע על השארת מסך דולק"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            מונע מהמסך להיכבות בזמן הבישול
          </TooltipContent>
        </Tooltip>
        <span className="text-sm text-muted-foreground">השאר מסך דולק</span>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
    </TooltipProvider>
  );
};

export default V2KeepAwakeToggle;