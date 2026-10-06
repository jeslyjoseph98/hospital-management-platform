"use client";

import type { TimingInput } from "@/lib/api/types";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export function TimingsEditor({
  value,
  onChange,
}: {
  value: TimingInput[];
  onChange: (timings: TimingInput[]) => void;
}) {
  function byDay(day: number) {
    return value.find((t) => t.dayOfWeek === day);
  }

  function toggleDay(day: number, checked: boolean) {
    if (checked) {
      onChange([...value, { dayOfWeek: day, startTime: "09:00", endTime: "13:00" }]);
    } else {
      onChange(value.filter((t) => t.dayOfWeek !== day));
    }
  }

  function updateTime(day: number, field: "startTime" | "endTime", time: string) {
    onChange(value.map((t) => (t.dayOfWeek === day ? { ...t, [field]: time } : t)));
  }

  return (
    <div className="space-y-2">
      {DAYS.map((d) => {
        const timing = byDay(d.value);
        return (
          <div
            key={d.value}
            className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 ${
              timing ? "border-violet-200 bg-violet-50/50" : "border-slate-200"
            }`}
          >
            <label className="flex w-32 items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={!!timing}
                onChange={(e) => toggleDay(d.value, e.target.checked)}
                className="h-4 w-4 rounded accent-violet-600"
              />
              {d.label}
            </label>
            {timing && (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  className="field-input"
                  value={timing.startTime}
                  onChange={(e) => updateTime(d.value, "startTime", e.target.value)}
                />
                <span className="text-slate-400">to</span>
                <input
                  type="time"
                  className="field-input"
                  value={timing.endTime}
                  onChange={(e) => updateTime(d.value, "endTime", e.target.value)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
