import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { Page, Box, Text, Button } from "zmp-ui";
import { authorize, getAccessToken, getPhoneNumber, getUserInfo, openWebview } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import { ApiException } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { configAtom, zaloAvatarAtom } from "@/store/auth";
import { enableMock, isMockEnabled } from "@/api/mock";
import logoImg from "@/images/logo.png";

// Override: VITE_DEV_LOGIN=1 (force on) or VITE_DEV_LOGIN=0 (force off)
// Auto: show dev login when mock mode is active (browser / fallback)
const DEV_LOGIN_ENV = import.meta.env.VITE_DEV_LOGIN;

interface FeatureItem {
  key: "leave" | "attendance" | "payslip";
  icon: React.ReactNode;
  label: string;
  desc: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    key: "leave",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: "Nghỉ phép",
    desc: "Đăng ký nghỉ phép, theo dõi số ngày phép",
  },
  {
    key: "attendance",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Chấm công",
    desc: "Xem lịch chấm công, giải trình",
  },
  {
    key: "payslip",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    label: "Phiếu lương",
    desc: "Xem phiếu lương hàng tháng",
  },
];

const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const setZaloAvatar = useSetAtom(zaloAvatarAtom);
  const { saveSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneReason, setShowPhoneReason] = useState(true);
  // Dev login: manual Zalo User ID input (fallback when SDK unavailable)
  const [showDevInput, setShowDevInput] = useState(false);
  const [devUserId, setDevUserId] = useState("");
  // Message passed from SESSION_INVALID PHONE_CHANGED
  const phoneChangedMsg = (window.history.state?.usr as any)?.phoneChangedMsg as string | undefined;

  // Dev login: auto ON when mock is active (browser/fallback), or forced via env
  const devLoginEnabled = DEV_LOGIN_ENV === "1" || (DEV_LOGIN_ENV !== "0" && isMockEnabled());

  const handleLoginResult = async (data: Awaited<ReturnType<typeof api.login>>, allowMockFallback = false) => {
    console.log("[Login] handleLoginResult:", { result: data.result, zalo_user_id: data.zalo_user_id });
    switch (data.result) {
      case "ACTIVE":
      case "READ_ONLY": {
        await saveSession(
          data.token!,
          data.employee,
          data.access,
          data.masked_phone,
          data.oa,
        );
        // Fetch Zalo profile: avatar fallback + send idByOA for C&B chat config
        try {
          const userInfo = await getUserInfo({});
          const avatar = userInfo.userInfo?.avatar;
          if (avatar) setZaloAvatar(avatar);
          const idByOA = (userInfo.userInfo as any)?.idByOA as string | undefined;
          if (idByOA) {
            api.setIdByOA(idByOA).catch(() => { });
          }
        } catch { /* ignore — scope.userInfo not granted or SDK unavailable */ }
        if (data.result === "ACTIVE" && data.oa?.show_invite) {
          navigate("/oa-invite", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
        break;
      }
      case "NO_PHONE":
      case "NOT_FOUND": {
        // Simulator fallback: real API login failed → switch to mock data
        if (allowMockFallback) {
          console.log("[Login] real API returned", data.result, "→ fallback to mock");
          enableMock();
          const mockData = await api.login("mock", undefined);
          await handleLoginResult(mockData, false);
          return;
        }
        if (data.result === "NO_PHONE") {
          navigate("/login/no-phone", {
            state: { zalo_user_id: data.zalo_user_id, message: data.message },
          });
        } else {
          navigate("/login/not-found", {
            state: {
              masked_phone: data.masked_phone,
              zalo_user_id: data.zalo_user_id,
              link_request: data.link_request ?? null,
            },
          });
        }
        break;
      }
      case "EXPIRED":
        navigate("/login/deactivated", {
          state: { expired_on: data.expired_on, message: data.message },
        });
        break;
      case "DISABLED":
        navigate("/login/deactivated", {
          state: { message: data.message },
        });
        break;
      case "DEV_NOT_ALLOWED":
        navigate("/login/no-phone", {
          state: {
            zalo_user_id: data.zalo_user_id,
            message: data.message,
            devNotAllowed: true,
          },
        });
        break;
    }
  };

  const mockFallbackLogin = async () => {
    console.warn("[Login] → fallback to mock");
    enableMock();
    const mockData = await api.login("mock", undefined);
    await handleLoginResult(mockData, false);
  };

  const attemptLogin = async (accessToken: string, phoneToken?: string) => {
    console.log("[Login] attemptLogin:", { accessToken: accessToken?.substring(0, 20) + "...", hasPhoneToken: !!phoneToken });
    try {
      const data = await api.login(accessToken, phoneToken);
      // Real API returned a structured result — handle it normally
      // (NO_PHONE, NOT_FOUND etc. show proper error screens on real phone)
      await handleLoginResult(data, false);
    } catch (err) {
      if (err instanceof ApiException) {
        console.error("[Login] attemptLogin error:", { code: err.code, message: err.message });

        if (err.code === "CLIENT_TOO_OLD") {
          navigate("/update-required", { replace: true });
          return;
        }

        if (err.code === "ZALO_TOKEN_USED") {
          console.log("[Login] ZALO_TOKEN_USED — retrying with new phone token");
          try {
            const phoneResult = await getPhoneNumber({});
            await attemptLogin(accessToken, phoneResult.token!);
          } catch {
            await attemptLogin(accessToken);
          }
          return;
        }

        // Other API error (e.g. invalid token) → show error, no mock fallback
        setError(err.message);
        return;
      }
      // Network error (server unreachable) → fallback to mock
      await mockFallbackLogin();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    console.log("[Login] handleLogin: starting...");

    try {
      // Step 0: Request permissions (userInfo for server to read Zalo name + phone)
      try {
        await authorize({ scopes: ["scope.userInfo", "scope.userPhonenumber"] });
        console.log("[Login] authorize OK");
      } catch (authErr) {
        console.log("[Login] authorize denied/failed (non-blocking):", authErr);
      }

      // Step 1: Get access token
      let accessToken: string;
      try {
        const tokenResult = await getAccessToken({});
        accessToken = typeof tokenResult === "string"
          ? tokenResult
          : (tokenResult as any).accessToken as string;
        console.log("[Login] getAccessToken:", { type: typeof tokenResult, raw: tokenResult, extracted: accessToken });
      } catch (sdkErr: any) {
        console.warn("[Login] getAccessToken failed → fallback to mock:", sdkErr);
        enableMock();
        const mockData = await api.login("mock", undefined);
        await handleLoginResult(mockData, false);
        return;
      }

      // Step 2: Try to get phone number (user consent)
      let phoneToken: string | undefined;
      try {
        const phoneResult = await getPhoneNumber({});
        phoneToken = phoneResult.token!;
        console.log("[Login] getPhoneNumber OK:", { hasToken: !!phoneToken });
      } catch (phoneErr) {
        console.log("[Login] getPhoneNumber denied/failed:", phoneErr);
      }

      // Step 3: Call login API (phone_token is optional now)
      await attemptLogin(accessToken, phoneToken);
    } catch (err) {
      console.error("[Login] handleLogin error:", err);
      if (err instanceof ApiException) return;
      setError("Có lỗi kết nối, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const doDevLogin = async (zaloUserId: string) => {
    console.log("[Dev Login] calling dev_login with zalo_user_id:", zaloUserId);
    const data = await api.devLogin(zaloUserId);
    await handleLoginResult(data);
  };

  const handleDevLogin = async () => {
    if (!devLoginEnabled || !config?.dev_login) return;
    setDevLoading(true);
    setError(null);

    try {
      // Try getting user ID from Zalo SDK first
      let zaloUserId: string | undefined;
      try {
        const userInfo = await getUserInfo({});
        zaloUserId = userInfo.userInfo?.id;
        console.log("[Dev Login] getUserInfo OK:", { id: zaloUserId, name: userInfo.userInfo?.name });
      } catch (sdkErr) {
        console.warn("[Dev Login] getUserInfo failed (not in Zalo env?):", sdkErr);
      }

      if (zaloUserId) {
        await doDevLogin(zaloUserId);
      } else {
        // SDK unavailable (browser) — show manual input
        console.log("[Dev Login] showing manual input for Zalo User ID");
        setShowDevInput(true);
        setDevLoading(false);
        return;
      }
    } catch (err) {
      if (err instanceof ApiException) {
        console.error("[Dev Login] error:", { code: err.code, message: err.message });
        if (err.code === "CLIENT_TOO_OLD") {
          navigate("/update-required", { replace: true });
          return;
        }
        setError(err.message);
        return;
      }
      console.error("[Dev Login] unexpected error:", err);
      setError("Có lỗi kết nối, vui lòng thử lại");
    } finally {
      setDevLoading(false);
    }
  };

  const handleDevLoginManual = async () => {
    if (!devUserId.trim()) return;
    setDevLoading(true);
    setError(null);
    try {
      await doDevLogin(devUserId.trim());
    } catch (err) {
      if (err instanceof ApiException) {
        console.error("[Dev Login Manual] error:", { code: err.code, message: err.message });
        setError(err.message);
      } else {
        console.error("[Dev Login Manual] unexpected error:", err);
        setError("Có lỗi kết nối, vui lòng thử lại");
      }
    } finally {
      setDevLoading(false);
    }
  };

  const showDevLogin = devLoginEnabled && config?.dev_login;

  return (
    <Page className="flex flex-col bg-white" hideScrollbar={false}>
      <Box className="flex-1 flex flex-col items-center px-6 pt-12 pb-6">
        {/* Company logo */}
        <img
          src={logoImg}
          alt={config?.company.name || "TIQN"}
          className="h-12 object-contain mb-4"
        />

        {/* Company name — split by " - " into multiple lines */}
        {config?.company.name && (
          <Box className="mb-1 text-center">
            {config.company.name.split(" - ").map((part, i) => (
              <Text key={i} className="text-sm text-gray-500">
                {part.trim()}
              </Text>
            ))}
          </Box>
        )}

        {/* Title */}
        <Text.Title size="large" className="mb-8 text-center">
          Cổng thông tin nhân viên
        </Text.Title>

        {/* Features list — filtered by config.features */}
        <Box className="w-full space-y-4 mb-8">
          {ALL_FEATURES.filter((f) => {
            const feat = config?.features;
            if (!feat) return true; // show all if config not loaded yet
            if (f.key === "leave") return feat.leave_view || feat.leave_create;
            if (f.key === "attendance") return feat.attendance;
            if (f.key === "payslip") return feat.payslip;
            return true;
          }).map((feature) => (
            <Box
              key={feature.label}
              className="flex items-start gap-3 p-3 rounded-xl bg-blue-50"
            >
              <Box className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
                {feature.icon}
              </Box>
              <Box className="flex-1 min-w-0">
                <Text className="font-medium text-gray-900">
                  {feature.label}
                </Text>
                <Text className="text-sm text-gray-500">{feature.desc}</Text>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Why phone number? expandable */}
        <Box className="w-full mb-6">
          <button
            type="button"
            className="w-full flex items-center justify-between py-2 text-left"
            onClick={() => setShowPhoneReason(!showPhoneReason)}
          >
            <Text className="text-sm text-[#006AF5] font-medium">
              Vì sao ứng dụng cần bạn cung cấp số điện thoại ?
            </Text>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#006AF5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform ${showPhoneReason ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showPhoneReason && (
            <Box className="pt-2 pb-1 text-sm text-gray-600 space-y-2">
              <Text className="text-sm text-gray-600">
                Số điện thoại Zalo của bạn được dùng để đối chiếu với hồ sơ nhân viên trong hệ thống công ty.
              </Text>
              <Text className="text-sm text-gray-600">
                Đảm bảo rằng dữ liệu lương của bạn được bảo mật và chỉ hiển thị cho chính bạn.
              </Text>
            </Box>
          )}
        </Box>

        {/* Phone changed message */}
        {phoneChangedMsg && (
          <Box className="w-full mb-4 p-3 rounded-lg bg-amber-50">
            <Text className="text-sm text-amber-700 text-center">{phoneChangedMsg}</Text>
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Box className="w-full mb-4 p-3 rounded-lg bg-red-50">
            <Text className="text-sm text-red-600 text-center">{error}</Text>
          </Box>
        )}

        {/* Login button */}
        <Button
          className="w-full"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading || devLoading}
          onClick={handleLogin}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        {/* Dev login section */}
        {showDevLogin && (
          <Box className="w-full mt-3 space-y-2">
            {showDevInput && (
              <Box className="w-full space-y-2">
                <input
                  type="text"
                  placeholder="Nhập Zalo User ID"
                  value={devUserId}
                  onChange={(e) => setDevUserId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#006AF5]"
                />
                <Button
                  className="w-full"
                  variant="secondary"
                  size="large"
                  loading={devLoading}
                  disabled={!devUserId.trim() || devLoading}
                  onClick={handleDevLoginManual}
                >
                  Đăng nhập với User ID
                </Button>
              </Box>
            )}
            {!showDevInput && (
              <Button
                className="w-full"
                variant="tertiary"
                size="large"
                loading={devLoading}
                disabled={loading || devLoading}
                onClick={handleDevLogin}
              >
                {devLoading ? "Đang đăng nhập..." : "Đăng nhập thử (Simulator)"}
              </Button>
            )}
          </Box>
        )}

        {/* Footer: legal links */}
        <Box className="mt-4 px-4">
          <Text className="text-xs text-gray-400 text-center leading-relaxed">
            Tiếp tục nghĩa là bạn đồng ý với{" "}
            <button
              type="button"
              className="text-[#006AF5] underline inline"
              onClick={() => {
                if (config?.legal.privacy_policy_url) {
                  openWebview({ url: config.legal.privacy_policy_url });
                }
              }}
            >
              Chính sách dữ liệu
            </button>
            {" "}và{" "}
            <button
              type="button"
              className="text-[#006AF5] underline inline"
              onClick={() => {
                if (config?.legal.terms_url) {
                  openWebview({ url: config.legal.terms_url });
                }
              }}
            >
              Điều khoản sử dụng
            </button>
          </Text>
        </Box>
      </Box>
    </Page>
  );
};

export default IntroPage;
