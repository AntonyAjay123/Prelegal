"use client";

import { useRouter } from "next/navigation";
import { clearAuthenticated } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearAuthenticated();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      Log out
    </button>
  );
}
