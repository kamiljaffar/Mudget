"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./providers";
import type { ActionResult } from "./types";

/**
 * Runs a server action: toasts the result, refreshes server props on success
 * and exposes a `busy` flag for spinners.
 */
export function useAction<Args extends unknown[], R extends ActionResult>(
  action: (...args: Args) => Promise<R>,
) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (...args: Args): Promise<R | null> => {
      setBusy(true);
      try {
        const result = await action(...args);
        if (result.ok) {
          if (result.message) notify(result.message, "success");
          router.refresh();
        } else {
          notify(result.error, "error");
        }
        return result;
      } catch (error) {
        notify(
          error instanceof Error && error.message
            ? error.message
            : "Kuch ghalat ho gaya — dobara koshish karein.",
          "error",
        );
        return null;
      } finally {
        setBusy(false);
      }
    },
    [action, notify, router],
  );

  return { run, busy };
}
