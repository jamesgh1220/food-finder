"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserAuthServices } from "@/lib/composition/browser-auth";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    setError(null);
    const { logoutUser } = createBrowserAuthServices();
    const result = await logoutUser.execute();

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saliendo…" : "Cerrar sesión"}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
