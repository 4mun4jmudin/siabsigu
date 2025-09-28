import React from "react";

// Progress bar sederhana
export function Progress({ value = 0, className = "" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-blue-600"
        style={{ width: `${v}%`, transition: "width 200ms ease" }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        role="progressbar"
      />
    </div>
  );
}
