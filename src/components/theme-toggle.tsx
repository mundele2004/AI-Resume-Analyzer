"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

function subscribeToMount() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <div
      className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white/75 p-1 shadow-sm shadow-slate-950/5 backdrop-blur transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/75 dark:shadow-black/20"
      aria-label="Theme selector"
    >
      {themes.map(({ value, label, icon: Icon }) => {
        const isActive = mounted && theme === value;

        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Use ${label.toLowerCase()} theme`}
            aria-pressed={isActive}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              "size-8 rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50",
              isActive &&
                "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-100 dark:hover:text-slate-950"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
