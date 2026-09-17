"use client";

import type { NdaFormData } from "@/lib/nda";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClasses =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function update<K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Parties
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Party 1 name">
            <input
              className={inputClasses}
              value={data.party1Name}
              onChange={(e) => update("party1Name", e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </Field>
          <Field label="Party 1 company">
            <input
              className={inputClasses}
              value={data.party1Company}
              onChange={(e) => update("party1Company", e.target.value)}
              placeholder="Acme Inc."
            />
          </Field>
          <Field label="Party 2 name">
            <input
              className={inputClasses}
              value={data.party2Name}
              onChange={(e) => update("party2Name", e.target.value)}
              placeholder="John Smith"
              required
            />
          </Field>
          <Field label="Party 2 company">
            <input
              className={inputClasses}
              value={data.party2Company}
              onChange={(e) => update("party2Company", e.target.value)}
              placeholder="Widget Co."
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Deal details
        </legend>
        <Field label="Purpose (how confidential information may be used)">
          <textarea
            className={`${inputClasses} min-h-20 resize-y`}
            value={data.purpose}
            onChange={(e) => update("purpose", e.target.value)}
            placeholder="evaluating a potential business relationship between the parties"
            required
          />
        </Field>
        <Field label="Effective date">
          <input
            type="date"
            className={inputClasses}
            value={data.effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
            required
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          MNDA term (how long the agreement lasts)
        </legend>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="mndaTermType"
            checked={data.mndaTermType === "expires"}
            onChange={() => update("mndaTermType", "expires")}
          />
          Expires
          <input
            type="number"
            min={1}
            className={`${inputClasses} w-20`}
            value={data.mndaTermYears}
            disabled={data.mndaTermType !== "expires"}
            onChange={(e) => update("mndaTermYears", Number(e.target.value))}
          />
          year(s) from the effective date
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="mndaTermType"
            checked={data.mndaTermType === "continues"}
            onChange={() => update("mndaTermType", "continues")}
          />
          Continues until terminated by either party
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Term of confidentiality (how long information stays protected)
        </legend>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="confidentialityTermType"
            checked={data.confidentialityTermType === "years"}
            onChange={() => update("confidentialityTermType", "years")}
          />
          <input
            type="number"
            min={1}
            className={`${inputClasses} w-20`}
            value={data.confidentialityTermYears}
            disabled={data.confidentialityTermType !== "years"}
            onChange={(e) =>
              update("confidentialityTermYears", Number(e.target.value))
            }
          />
          year(s) from the effective date
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="confidentialityTermType"
            checked={data.confidentialityTermType === "perpetuity"}
            onChange={() => update("confidentialityTermType", "perpetuity")}
          />
          In perpetuity
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Governing law
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Governing law (state)">
            <input
              className={inputClasses}
              value={data.governingLaw}
              onChange={(e) => update("governingLaw", e.target.value)}
              placeholder="Delaware"
              required
            />
          </Field>
          <Field label="Jurisdiction (city/county and state)">
            <input
              className={inputClasses}
              value={data.jurisdiction}
              onChange={(e) => update("jurisdiction", e.target.value)}
              placeholder="New Castle, DE"
              required
            />
          </Field>
        </div>
      </fieldset>
    </form>
  );
}
