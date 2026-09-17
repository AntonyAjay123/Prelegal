"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NdaPreviewProps {
  markdown: string;
}

export default function NdaPreview({ markdown }: NdaPreviewProps) {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
