"use client";

import clsx from "clsx";

// 「◯分」という形の数値入力欄。演奏時間・転換時間の両方で使い回す
export function MinuteInput({
  value,
  onChange,
  ariaLabel,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min={0}
        step={5}
        value={value}
        aria-label={ariaLabel}
        // ドラッグ用のセンサーに数値入力を奪われないようにする
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? 0 : Math.max(0, Number(raw)));
        }}
        className={clsx(
          "rounded border border-gray-300 bg-white text-right tabular-nums",
          "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          size === "sm"
            ? "w-12 px-1 py-0.5 text-xs"
            : "w-14 px-1.5 py-1 text-sm",
        )}
      />
      <span
        className={clsx(
          "text-gray-500",
          size === "sm" ? "text-[11px]" : "text-xs",
        )}
      >
        分
      </span>
    </span>
  );
}
