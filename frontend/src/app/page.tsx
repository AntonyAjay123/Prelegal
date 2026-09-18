import AuthGuard from "@/components/AuthGuard";
import DocumentCreator from "@/components/DocumentCreator";
import LogoutButton from "@/components/LogoutButton";

export default function Home() {
  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Prelegal Document Assistant
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Chat with the assistant to describe the agreement you need,
                then review the details before downloading the completed
                document.
              </p>
            </div>
            <LogoutButton />
          </header>
          <DocumentCreator />
        </main>
      </div>
    </AuthGuard>
  );
}
