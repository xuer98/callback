"use client";

import { useState } from "react";
import { FilterSelect, type Option } from "./filter-select";
import { Select } from "./select";
import {
  FIELD_LABELS,
  type FilterField,
  type FilterRow,
  type FrequencyRow,
  type SetField,
  type SetOp,
} from "@/lib/problem-filter";

// One row of the /problems filter panel: the field with its icon, the
// operator, the value control, and the remove button. On a phone the
// controls drop to a second line under the label.

const OPERATORS = [
  { value: "is", label: "is" },
  { value: "not", label: "is not" },
];

const PLACEHOLDERS: Record<SetField, string> = {
  company: "Any company",
  status: "Any status",
  difficulty: "Any difficulty",
  topic: "Any topic",
  language: "Any language",
};

export function FilterRowItem({
  row,
  options,
  onChange,
  onRemove,
}: {
  row: FilterRow;
  options: Record<SetField, Option[]>;
  onChange: (row: FilterRow) => void;
  onRemove: () => void;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[7.5rem_6rem_minmax(0,1fr)_auto]">
      <span className="order-1 flex items-center gap-2 text-sm text-zinc-300">
        <FieldIcon field={row.field} />
        {FIELD_LABELS[row.field]}
      </span>
      <div className="order-3 col-span-2 flex items-center gap-2 sm:contents">
        {row.field === "frequency" ? (
          <>
            <span className="w-24 shrink-0 rounded-md bg-zinc-900 py-1.5 pl-2.5 text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 sm:order-2">
              Range
            </span>
            <FrequencyInputs
              className="min-w-0 flex-1 sm:order-3"
              row={row}
              onChange={onChange}
            />
          </>
        ) : (
          <>
            <Select
              label={`${FIELD_LABELS[row.field]} operator`}
              hideLabel
              className="w-24 shrink-0 sm:order-2"
              value={row.op}
              options={OPERATORS}
              onChange={(op) => onChange({ ...row, op: op as SetOp })}
            />
            <FilterSelect
              className="min-w-0 flex-1 sm:order-3"
              label={FIELD_LABELS[row.field]}
              placeholder={PLACEHOLDERS[row.field]}
              options={options[row.field]}
              values={row.values}
              searchable={row.field === "company" || row.field === "topic"}
              onChange={(values) => onChange({ ...row, values })}
            />
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${FIELD_LABELS[row.field]} filter`}
        className="order-2 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 sm:order-4"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M3.5 8h9" />
        </svg>
      </button>
    </li>
  );
}

/**
 * The two bounds of a frequency row. Typed values apply on Enter or when
 * the field is left, swapped if they are the wrong way round.
 */
function FrequencyInputs({
  row,
  onChange,
  className = "",
}: {
  row: FrequencyRow;
  onChange: (row: FrequencyRow) => void;
  className?: string;
}) {
  const [min, setMin] = useState(row.min?.toString() ?? "");
  const [max, setMax] = useState(row.max?.toString() ?? "");

  const commit = () => {
    const parse = (text: string) => {
      const value = Number.parseInt(text, 10);
      return Number.isFinite(value)
        ? Math.min(100, Math.max(0, value))
        : undefined;
    };
    let lo = parse(min);
    let hi = parse(max);
    if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
    setMin(lo?.toString() ?? "");
    setMax(hi?.toString() ?? "");
    if (lo !== row.min || hi !== row.max) {
      onChange({ field: "frequency", min: lo, max: hi });
    }
  };

  const bound = (
    label: string,
    value: string,
    set: (value: string) => void,
  ) => (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        value={value}
        onChange={(event) => set(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="w-full rounded-md bg-zinc-900 py-1.5 pl-2.5 pr-6 text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors placeholder:text-zinc-600 hover:ring-zinc-700 focus:outline-none focus:ring-indigo-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500"
      >
        %
      </span>
    </label>
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {bound("Minimum frequency", min, setMin)}
      <span aria-hidden className="text-zinc-500">
        –
      </span>
      {bound("Maximum frequency", max, setMax)}
    </div>
  );
}

const ICONS: Record<FilterField, React.ReactNode> = {
  company: (
    <>
      <rect x="3" y="2.5" width="10" height="11" rx="1" />
      <path d="M6 5.5h1.5M8.5 5.5H10M6 8h1.5M8.5 8H10M6 10.5h1.5M8.5 10.5H10" />
    </>
  ),
  frequency: (
    <path d="M8 13.5a3.5 3.5 0 0 1-3.5-3.5c0-2 1.5-3 2-5 1 .8 1.3 2 1.3 2s.7-.8.7-2.5c1.6 1.5 3 3.2 3 5.5A3.5 3.5 0 0 1 8 13.5z" />
  ),
  status: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      <path d="m5.5 8 2 2 3.5-4" />
    </>
  ),
  difficulty: (
    <>
      <path d="M3 11a5 5 0 0 1 10 0" />
      <path d="m8 11 2.5-3.5" />
      <circle cx="8" cy="11" r="1" />
    </>
  ),
  topic: (
    <>
      <path d="M2.5 8.5V3a.5.5 0 0 1 .5-.5h5.5l5 5-6 6z" />
      <circle cx="5.5" cy="5.5" r="1" />
    </>
  ),
  language: <path d="m5 5-3 3 3 3M11 5l3 3-3 3M9.5 3l-3 10" />,
};

function FieldIcon({ field }: { field: FilterField }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[field]}
    </svg>
  );
}
