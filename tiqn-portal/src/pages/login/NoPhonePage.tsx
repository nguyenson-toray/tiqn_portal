import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Button } from "zmp-ui";
import { getAccessToken, getPhoneNumber } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import { ApiException } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { configAtom } from "@/store/auth";

const NoPhonePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useAtomValue(configAtom);
  const { saveSession } = useAuth();
  const hrHotline = config?.contacts.hr_hotline;

  const state = location.state as {
    zalo_user_id?: string;
    message?: string;
    devNotAllowed?: boolean;
  } | null;

  const zaloUserId = state?.zalo_user_id || "";
  const isDevNotAllowed = state?.devNotAllowed === true;
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(zaloUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleAllowPhone = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenResult = await getAccessToken({});
      const accessToken = typeof tokenResult === "string"
        ? tokenResult
        : (tokenResult as any).accessToken as string;
      const phoneResult = await getPhoneNumber({});
      const data = await api.login(accessToken, phoneResult.token!);
      await handleResult(data);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Không thể đọc số điện thoại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetryLoading(true);
    setError(null);
    try {
      const tokenResult = await getAccessToken({});
      const accessToken = typeof tokenResult === "string"
        ? tokenResult
        : (tokenResult as any).accessToken as string;
      const data = await api.login(accessToken);
      await handleResult(data);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Có lỗi kết nối, vui lòng thử lại");
      }
    } finally {
      setRetryLoading(false);
    }
  };

  const handleResult = async (data: Awaited<ReturnType<typeof api.login>>) => {
    switch (data.result) {
      case "ACTIVE":
      case "READ_ONLY":
        await saveSession(data.token!, data.employee, data.access, data.masked_phone, data.oa);
        if (data.result === "ACTIVE" && data.oa?.show_invite) {
          navigate("/oa-invite", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
        break;
      case "NO_PHONE":
        setError("Tài khoản vẫn chưa có số điện thoại. Vui lòng liên hệ phòng Nhân sự.");
        break;
      case "NOT_FOUND":
        navigate("/login/not-found", {
          replace: true,
          state: { masked_phone: data.masked_phone, zalo_user_id: data.zalo_user_id },
        });
        break;
      default:
        navigate("/login", { replace: true });
    }
  };

  return (
    <Page className="flex flex-col bg-white">
      <Box className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <Box className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </Box>

        {/* Title */}
        <Text.Title size="large" className="mb-3 text-center">
          {isDevNotAllowed ? "Chưa được phép Dev Login" : "Chưa có số điện thoại"}
        </Text.Title>

        {/* Description */}
        <Text className="text-sm text-gray-600 text-center mb-4">
          {isDevNotAllowed
            ? (state?.message || "Tài khoản chưa được cấp quyền Dev Login. Gửi mã bên dưới cho phòng Nhân sự.")
            : "Tài khoản của bạn chưa có số điện thoại. Bạn có thể cho phép đọc SĐT, hoặc gửi mã bên dưới cho phòng Nhân sự để được kích hoạt."}
        </Text>

        {/* Zalo User ID */}
        {zaloUserId && (
          <Box className="w-full bg-gray-50 rounded-xl p-4 mb-4">
            <Text size="xxSmall" className="text-gray-500 mb-1">
              Mã Zalo User ID
            </Text>
            <Box className="flex items-center gap-2">
              <Text className="font-mono text-sm text-gray-900 flex-1 break-all select-all">
                {zaloUserId}
              </Text>
              <button
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 text-[#006AF5] text-xs font-medium"
                onClick={handleCopy}
              >
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
            </Box>
            <Text size="xxSmall" className="text-gray-400 mt-2">
              Gửi mã này cho phòng Nhân sự để được kích hoạt
            </Text>
          </Box>
        )}

        {/* HR hotline */}
        {hrHotline && (
          <Box className="w-full bg-blue-50 rounded-xl p-3 mb-4">
            <Text size="xxSmall" className="text-blue-700 text-center">
              Hotline Nhân sự: <span className="font-semibold">{hrHotline}</span>
            </Text>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box className="w-full mb-4 p-3 rounded-lg bg-red-50">
            <Text className="text-sm text-red-600 text-center">{error}</Text>
          </Box>
        )}

        {/* Actions */}
        <Box className="w-full space-y-3">
          {!isDevNotAllowed && (
            <Button
              className="w-full"
              variant="primary"
              size="large"
              loading={loading}
              disabled={loading || retryLoading}
              onClick={handleAllowPhone}
            >
              Cho phép đọc số điện thoại
            </Button>
          )}

          <Button
            className="w-full"
            variant={isDevNotAllowed ? "primary" : "secondary"}
            size="large"
            loading={retryLoading}
            disabled={loading || retryLoading}
            onClick={handleRetry}
          >
            Thử lại
          </Button>

          <Button
            className="w-full"
            variant="tertiary"
            size="large"
            onClick={() => navigate("/login", { replace: true })}
          >
            Quay lại
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default NoPhonePage;
