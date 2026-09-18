"use client";

import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-dark-navy dark:text-zinc-50">
          Prelegal
        </h1>
        <p className="text-sm text-gray-text">
          Sign in to start drafting your agreement.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
