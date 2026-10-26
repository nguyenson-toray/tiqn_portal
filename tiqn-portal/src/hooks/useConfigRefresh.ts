import { useEffect } from "react";
import { useSetAtom } from "jotai";
import * as api from "@/api/endpoints";
import { configAtom } from "@/store/auth";

/**
 * Refresh get_config when the app returns to foreground (visibilitychange).
 * This ensures feature flags are always up-to-date without requiring a rebuild.
 */
export function useConfigRefresh() {
  const setConfig = useSetAtom(configAtom);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        api.getConfig().then(setConfig).catch(() => { /* keep existing config */ });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [setConfig]);
}
