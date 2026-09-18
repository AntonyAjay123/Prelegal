"use client";

import ChatPanel from "./ChatPanel";
import DocumentPreview from "./DocumentPreview";
import DynamicFieldsForm from "./DynamicFieldsForm";
import { useDocumentChat } from "@/hooks/useDocumentChat";

function slugifyFilename(name: string): string {
  return (
    name
      .trim()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || "document"
  );
}

export default function DocumentCreator() {
  const {
    messages,
    documentName,
    fields,
    allFields,
    content,
    isSending,
    error,
    sendMessage,
    retry,
    setFieldValue,
    refreshPreview,
  } = useDocumentChat();

  const missingFields = allFields.filter((label) => !fields[label]?.trim());
  const canDownload = allFields.length > 0 && missingFields.length === 0;

  function handleDownload() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyFilename(documentName ?? "document")}.md`;
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
            <DynamicFieldsForm
              fieldOrder={allFields}
              fields={fields}
              onChange={setFieldValue}
              onCommit={refreshPreview}
            />
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
            disabled={!canDownload}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
          >
            Download .md
          </button>
        </div>
        {allFields.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Tell the assistant what kind of document you need to get started.
          </p>
        ) : (
          missingFields.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Fill in {missingFields.join(", ")} to enable download.
            </p>
          )
        )}
        <DocumentPreview
          markdown={
            content ||
            "The document preview will appear here once you've told the assistant what you need."
          }
        />
      </div>
    </div>
  );
}
