import { Mic, MicOff, Radio } from "lucide-react";

export function MicrophoneStatus({
  isListening,
  status,
  unsupported,
}: {
  isListening: boolean;
  status: string;
  unsupported?: boolean;
}) {
  const Icon = unsupported ? MicOff : isListening ? Radio : Mic;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div
          className={`grid size-11 place-items-center rounded-full ${
            isListening
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
              : unsupported
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-300"
          }`}
        >
          <Icon className={`size-5 ${isListening ? "animate-pulse" : ""}`} />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {unsupported ? "Speech unavailable" : isListening ? "Listening..." : "Microphone ready"}
          </p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
}
