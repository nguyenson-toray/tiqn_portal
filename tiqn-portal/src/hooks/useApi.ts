import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom, useStore } from "jotai";
import { ApiException, NetworkError, setToken } from "@/api/client";
import { tokenAtom, employeeAtom, accessAtom } from "@/store/auth";
import { allDataAtoms, viewedPayslipPeriodsAtom } from "@/store/data";
import { clearPayslipCache } from "@/utils/payslipCache";

export function useApiError() {
  const navigate = useNavigate();
  const setTokenState = useSetAtom(tokenAtom);
  const setEmployee = useSetAtom(employeeAtom);
  const setAccess = useSetAtom(accessAtom);
  const store = useStore();

  const handleError = useCallback(
    (err: unknown): string => {
      console.error("[useApiError] handling error:", err);
      if (err instanceof ApiException) {
        const { code, details } = err;
        console.error("[useApiError] ApiException:", { code, message: err.message, details });

        if (code === "SESSION_REQUIRED" || code === "SESSION_INVALID") {
          setToken(null);
          setTokenState(null);
          setEmployee(null);
          setAccess(null);
          // Clear all cached data atoms
          for (const a of allDataAtoms) {
            store.set(a, a === viewedPayslipPeriodsAtom ? new Set<string>() : null);
          }
          clearPayslipCache();

          if (code === "SESSION_INVALID" && details?.reason === "STATUS_CHANGED") {
            const result = details.result;
            if (result === "NOT_FOUND") {
              navigate("/login/not-found", { replace: true });
            } else {
              navigate("/login/deactivated", { replace: true });
            }
          } else if (code === "SESSION_INVALID" && details?.reason === "PHONE_CHANGED") {
            navigate("/login", {
              replace: true,
              state: {
                phoneChangedMsg: "Số điện thoại của tài khoản vừa được cập nhật, vui lòng đăng nhập lại.",
              },
            });
          } else {
            navigate("/login", { replace: true });
          }
          return err.message;
        }

        if (code === "CLIENT_TOO_OLD") {
          navigate("/update-required", { replace: true });
          return err.message;
        }

        if (code === "FEATURE_DISABLED") {
          navigate("/home", { replace: true });
          return err.message;
        }

        if (code === "RATE_LIMITED") {
          const retryAfter = details?.retry_after || 30;
          return `Vui lòng chờ ${retryAfter} giây rồi thử lại`;
        }

        return err.message;
      }

      if (err instanceof NetworkError) {
        return err.message;
      }

      return "Có lỗi, vui lòng thử lại";
    },
    [navigate, setTokenState, setEmployee, setAccess, store],
  );

  return { handleError };
}

export function useAsyncAction<T>(
  action: (...args: any[]) => Promise<T>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useApiError();

  const run = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await action(...args);
        return result;
      } catch (err) {
        const msg = handleError(err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [action, handleError],
  );

  return { run, loading, error, setError };
}
