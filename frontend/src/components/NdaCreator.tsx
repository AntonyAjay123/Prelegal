"use client";

import { useMemo } from "react";
import ChatPanel from "./ChatPanel";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";
import { useNdaChat } from "@/hooks/useNdaChat";
import { buildCompletedNda, getMissingFields } from "@/lib/nda";

interface NdaCreatorProps {
  standardTermsTemplate: string;
  coverPageTemplate: string;
}

export default function NdaCreator({
  standardTermsTemplate,
  coverPageTemplate,
}: NdaCreatorProps) {
  const { messages, fields, isSending, error, sendMessage, retry, setFields } =
    useNdaChat();

  const completedNda = useMemo(
    () => buildCompletedNda(fields, standardTermsTemplate, coverPageTemplate),
    [fields, standardTermsTemplate, coverPageTemplate]
  );

  const missingFields = useMemo(() => getMissingFields(fields), [fields]);

  function handleDownload() {
    const blob = new Blob([completedNda], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const slugify = (name: string) =>
      name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "-");
    const party1 = slugify(fields.party1Name) || "party-1";
    const party2 = slugify(fields.party2Name) || "party-2";
    link.download = `mutual-nda-${party1}-${party2}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <ChatPanel
          messages={messages}
          isSending={isSending}
          error={error}
          onSend={sendMessage}
          onRetry={retry}
        />
        <details className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Review &amp; edit details
          </summary>
          <div className="mt-4">
            <NdaForm data={fields} onChange={setFields} />
          </div>
        </details>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Preview
          </h2>
          <button
            type="button"
            onClick={handleDownload}
            disabled={missingFields.length > 0}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
          >
            Download .md
          </button>
        </div>
        {missingFields.length > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Fill in {missingFields.join(", ")} to enable download.
          </p>
        )}
        <NdaPreview markdown={completedNda} />
      </div>
    </div>
  );
}
