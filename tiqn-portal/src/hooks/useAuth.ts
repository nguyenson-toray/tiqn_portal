import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useSetAtom, useStore } from "jotai";
import { getStorage, setStorage, removeStorage, getUserInfo } from "zmp-sdk/apis";
import { setToken } from "@/api/client";
import * as api from "@/api/endpoints";
import { enableMock, isMockEnabled } from "@/api/mock";
import { loadPayslipCache, clearPayslipCache } from "@/utils/payslipCache";
import {
  tokenAtom,
  employeeAtom,
  accessAtom,
  maskedPhoneAtom,
  oaAtom,
  chatAtom,
  zaloAvatarAtom,
  configAtom,
  authLoadingAtom,
  loginMethodAtom,
} from "@/store/auth";
import { allDataAtoms, viewedPayslipPeriodsAtom } from "@/store/data";

const STORAGE_KEY = "portal_token";
const CONFIG_CACHE_KEY = "config_cache";
const CONFIG_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useAuth() {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useAtom(authLoadingAtom);
  const setTokenState = useSetAtom(tokenAtom);
  const setEmployee = useSetAtom(employeeAtom);
  const setAccess = useSetAtom(accessAtom);
  const setMaskedPhone = useSetAtom(maskedPhoneAtom);
  const setOa = useSetAtom(oaAtom);
  const setChat = useSetAtom(chatAtom);
  const setZaloAvatar = useSetAtom(zaloAvatarAtom);
  const setConfig = useSetAtom(configAtom);
  const setLoginMethod = useSetAtom(loginMethodAtom);
  const store = useStore();

  const loadConfig = useCallback(async () => {
    // Skip cache if mock is OFF — we want to test real server reachability
    if (!isMockEnabled()) {
      console.log("[Auth] loadConfig: mock OFF, trying real API...");
      try {
        const config = await api.getConfig();
        console.log("[Auth] loadConfig: real API OK", config);
        setConfig(config);
        try {
          await setStorage({
            data: { [CONFIG_CACHE_KEY]: { data: config, ts: Date.now() } },
          });
        } catch { /* ignore */ }
        return config;
      } catch (err) {
        console.warn("[Auth] loadConfig: real API failed, enabling mock fallback", err);
        enableMock();
        // Fall through to fetch from mock
      }
    }

    // Mock enabled or cache path
    console.log("[Auth] loadConfig: checking cache...");
    try {
      const stored = await getStorage({ keys: [CONFIG_CACHE_KEY] });
      const cached = stored?.[CONFIG_CACHE_KEY] as any;
      if (cached && Date.now() - cached.ts < CONFIG_CACHE_TTL) {
        console.log("[Auth] loadConfig: using cached config", cached.data);
        setConfig(cached.data);
        return cached.data;
      }
    } catch { /* ignore */ }

    console.log("[Auth] loadConfig: fetching config...");
    const config = await api.getConfig();
    console.log("[Auth] loadConfig: got config", config);
    setConfig(config);
    try {
      await setStorage({
        data: { [CONFIG_CACHE_KEY]: { data: config, ts: Date.now() } },
      });
    } catch { /* ignore */ }
    return config;
  }, [setConfig]);

  const initAuth = useCallback(async () => {
    console.log("[Auth] initAuth: starting...");
    setAuthLoading(true);
    try {
      await loadConfig();
      await loadPayslipCache();

      // Check for stored token
      let storedToken: string | null = null;
      try {
        const stored = await getStorage({ keys: [STORAGE_KEY] });
        storedToken = stored?.[STORAGE_KEY] as string | null;
      } catch { /* ignore */ }

      console.log("[Auth] initAuth: storedToken =", storedToken ? `${storedToken.substring(0, 8)}...` : "null");

      if (!storedToken) {
        console.log("[Auth] initAuth: no token, redirecting to /login");
        setAuthLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      // Verify session
      setToken(storedToken);
      try {
        const data = await api.me();
        console.log("[Auth] initAuth: me() OK", {
          employee: data.employee.employee_id,
          access: data.access.mode,
          login_method: data.login_method,
        });
        setTokenState(storedToken);
        setEmployee(data.employee);
        setAccess(data.access);
        setMaskedPhone(data.masked_phone);
        setOa(data.oa);
        setChat(data.chat ?? null);
        setLoginMethod(data.login_method);
        // Fetch Zalo avatar as fallback (fire and forget)
        try {
          const userInfo = await getUserInfo({});
          const avatar = userInfo.userInfo?.avatar;
          if (avatar) setZaloAvatar(avatar);
        } catch { /* ignore — SDK unavailable */ }
        setAuthLoading(false);
        navigate("/home", { replace: true });
      } catch (meErr) {
        console.error("[Auth] initAuth: me() failed, clearing session", meErr);
        setToken(null);
        try {
          await removeStorage({ keys: [STORAGE_KEY] });
        } catch { /* ignore */ }
        setAuthLoading(false);
        navigate("/login", { replace: true });
      }
    } catch (configErr) {
      console.error("[Auth] initAuth: loadConfig failed", configErr);
      setAuthLoading(false);
      navigate("/login", { replace: true });
    }
  }, [loadConfig, navigate, setAuthLoading, setTokenState, setEmployee, setAccess, setMaskedPhone, setOa, setChat, setZaloAvatar, setLoginMethod]);

  const saveSession = useCallback(
    async (token: string, employee: any, access: any, maskedPhone: string, oa: any, chat?: any) => {
      console.log("[Auth] saveSession:", {
        token: token ? `${token.substring(0, 8)}...` : "null",
        employee: employee?.employee_id,
        access: access?.mode,
      });
      setToken(token);
      setTokenState(token);
      setEmployee(employee);
      setAccess(access);
      setMaskedPhone(maskedPhone);
      setOa(oa);
      setChat(chat ?? null);
      try {
        await setStorage({ data: { [STORAGE_KEY]: token } });
      } catch { /* ignore */ }
    },
    [setTokenState, setEmployee, setAccess, setMaskedPhone, setOa, setChat],
  );

  const clearSession = useCallback(async () => {
    console.log("[Auth] clearSession");
    setToken(null);
    setTokenState(null);
    setEmployee(null);
    setAccess(null);
    setMaskedPhone(null);
    setOa({ followed: false, show_invite: false });
    setChat(null);
    setZaloAvatar(null);
    setLoginMethod(null);
    // Clear all cached data atoms (prevent data leaking between users)
    for (const a of allDataAtoms) {
      store.set(a, a === viewedPayslipPeriodsAtom ? new Set<string>() : null);
    }
    try {
      await removeStorage({ keys: [STORAGE_KEY] });
    } catch { /* ignore */ }
    await clearPayslipCache();
  }, [setTokenState, setEmployee, setAccess, setMaskedPhone, setOa, setChat, setZaloAvatar, setLoginMethod, store]);

  return { initAuth, loadConfig, saveSession, clearSession, authLoading };
}
