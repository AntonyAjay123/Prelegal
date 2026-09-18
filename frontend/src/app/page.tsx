import fs from "node:fs";
import path from "node:path";
import AuthGuard from "@/components/AuthGuard";
import NdaCreator from "@/components/NdaCreator";

function readTemplate(filename: string): string {
  const templatesDir = path.join(process.cwd(), "..", "templates");
  return fs.readFileSync(path.join(templatesDir, filename), "utf-8");
}

export default function Home() {
  const standardTermsTemplate = readTemplate("mutual-nda.md");
  const coverPageTemplate = readTemplate("mutual-nda-coverpage.md");

  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Mutual NDA Creator
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Chat with the assistant to describe your deal, then review the
              details before downloading the completed document.
            </p>
          </header>
          <NdaCreator
            standardTermsTemplate={standardTermsTemplate}
            coverPageTemplate={coverPageTemplate}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
