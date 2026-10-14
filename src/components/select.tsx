"use client";

interface Option {
  value: string;
  label: string;
}

/**
 * A labelled native select in the app's styling; the label can be read out
 * only, for a control whose meaning is already on screen. Used by the
 * /problems toolbar and filter panel and by the problem side menu.
 */
export function Select({
  label,
  hideLabel = false,
  value,
  placeholder,
  options,
  onChange,
  className = "",
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  placeholder?: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className={hideLabel ? "sr-only" : "text-xs text-zinc-500"}>
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md bg-zinc-900 py-1.5 pl-2.5 pr-8 text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors hover:text-white focus:outline-none focus:ring-indigo-500"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500"
        >
          <path
            d="M3 4.5 6 8l3-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
