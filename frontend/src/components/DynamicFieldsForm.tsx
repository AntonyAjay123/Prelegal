"use client";

interface DynamicFieldsFormProps {
  fieldOrder: string[];
  fields: Record<string, string>;
  onChange: (label: string, value: string) => void;
  onCommit: () => void;
}

const inputClasses =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function DynamicFieldsForm({
  fieldOrder,
  fields,
  onChange,
  onCommit,
}: DynamicFieldsFormProps) {
  if (fieldOrder.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Fields will appear here once the assistant knows which document
        you&apos;re drafting.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      {fieldOrder.map((label) => (
        <label key={label} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          <input
            className={inputClasses}
            value={fields[label] ?? ""}
            onChange={(e) => onChange(label, e.target.value)}
            onBlur={onCommit}
          />
        </label>
      ))}
    </form>
  );
}
