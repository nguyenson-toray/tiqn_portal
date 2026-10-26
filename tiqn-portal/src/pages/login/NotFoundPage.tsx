import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Page, Box, Text, Button } from "zmp-ui";
import { getAccessToken } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import { ApiException } from "@/api/client";
import type { LinkRequestInfo } from "@/api/types";
import { formatDateTime } from "@/utils/format";

const EMPLOYEE_ID_REGEX = /^TIQN-\d{4}$/;

/** Normalize Vietnamese name: trim, collapse spaces, capitalize each word */
function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\p{L}+/gu, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
}

interface NavState {
  masked_phone?: string;
  zalo_user_id?: string;
  link_request?: LinkRequestInfo | null;
}

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as NavState) || {};
  const maskedPhone = state.masked_phone || "";

  // Link request state
  const [linkRequest, setLinkRequest] = useState<LinkRequestInfo | null>(
    state.link_request ?? null,
  );
  const isPending = linkRequest?.status === "PENDING";
  const isRejected = linkRequest?.status === "REJECTED";
  const canResend = linkRequest?.can_resend ?? true; // default true for pre-1.6.0
  const noRequest = !linkRequest; // never sent

  // Show form when: no request yet, rejected + can resend, or pending + can resend (edit)
  const [editing, setEditing] = useState(false);
  const showForm = noRequest || (isRejected && canResend) || editing;

  // Form state — pre-fill employee_id when editing existing request
  const [employeeId, setEmployeeId] = useState(
    linkRequest?.employee_id || "",
  );
  const [fullName, setFullName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const employeeIdTrimmed = employeeId.trim().toUpperCase();
  const employeeIdValid = EMPLOYEE_ID_REGEX.test(employeeIdTrimmed);
  const fullNameValid = fullName.trim().length >= 2;
  const canSubmit = employeeIdValid && fullNameValid;

  const handleSubmitLink = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    try {
      // Get fresh access token
      let accessToken: string;
      try {
        const tokenResult = await getAccessToken({});
        accessToken = typeof tokenResult === "string"
          ? tokenResult
          : (tokenResult as any).accessToken as string;
      } catch {
        accessToken = "mock_access_token";
      }

      const result = await api.linkEmployeeRequest({
        access_token: accessToken,
        employee_id: employeeIdTrimmed,
        full_name: normalizeName(fullName),
      });

      // Success → update state from response, close form
      setLinkRequest(result.link_request);
      setSubmittedName(normalizeName(fullName));
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiException) {
        handleApiError(err);
      } else {
        setGeneralError("Có lỗi kết nối, vui lòng thử lại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApiError = (err: ApiException) => {
    switch (err.code) {
      case "VALIDATION":
        if (err.field) {
          setFieldErrors((prev) => ({ ...prev, [err.field!]: err.message }));
        } else {
          setGeneralError(err.message);
        }
        break;
      case "NOT_FOUND":
        // field: null — show message at top of form, keep input data
        setGeneralError(err.message);
        break;
      case "EMPLOYEE_LINKED":
        setFieldErrors({ employee_id: err.message });
        break;
      case "REQUEST_LIMIT":
        setGeneralError(err.message);
        break;
      case "PENDING":
        // Pre-1.6.0: re-login to get link_request
        handleRetry();
        break;
      case "LOGIN_AGAIN":
        navigate("/login", { replace: true });
        break;
      case "DISABLED":
        navigate("/login/deactivated", {
          state: { message: err.message },
        });
        break;
      case "RATE_LIMITED":
        setGeneralError(err.message);
        break;
      default:
        setGeneralError(err.message);
        break;
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEmployeeId(linkRequest?.employee_id || "");
    setFullName("");
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleRetry = () => {
    navigate("/login", { replace: true });
  };

  // Request count info line
  const countInfo = linkRequest
    ? `Đã gửi ${linkRequest.request_count} lần · Hôm nay còn ${linkRequest.remaining_today} lần`
    : null;

  return (
    <Page className="flex flex-col bg-white" hideScrollbar={false}>
      <Box className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
        {/* Icon */}
        <Box className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </Box>

        {/* Title */}
        <Text.Title size="large" className="mb-2 text-center">
          Chưa tìm thấy hồ sơ nhân viên
        </Text.Title>

        {/* Masked phone */}
        {maskedPhone && (
          <Text className="text-sm text-gray-500 text-center mb-4">
            Số điện thoại <span className="font-medium text-gray-700">{maskedPhone}</span> chưa được đăng ký trong hệ thống.
          </Text>
        )}

        {/* === PENDING state (not editing) === */}
        {isPending && !editing && (
          <Box className="w-full bg-green-50 rounded-xl p-4 mb-4">
            <Box className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <Text className="text-sm font-semibold text-green-700">
                Yêu cầu đã được gửi
              </Text>
            </Box>
            <Text className="text-sm text-green-700">
              Mã nhân viên: <span className="font-semibold">{linkRequest!.employee_id}</span>
            </Text>
            {submittedName && (
              <Text className="text-sm text-green-700">
                Họ tên: <span className="font-semibold">{submittedName}</span>
              </Text>
            )}
            {linkRequest!.requested_at && (
              <Text size="xxSmall" className="text-green-600 mt-0.5">
                Gửi lúc {formatDateTime(linkRequest!.requested_at)}
              </Text>
            )}
            {countInfo && (
              <Text size="xxSmall" className="text-green-600 mt-0.5">
                {countInfo}
              </Text>
            )}
            <Text size="xxSmall" className="text-green-600 mt-2">
              Đang chờ phòng Nhân sự duyệt. Sau khi được duyệt, hãy bấm "Thử lại" để đăng nhập.
            </Text>

            {/* Edit button */}
            {canResend && (
              <Button
                className="w-full mt-3"
                variant="secondary"
                size="medium"
                onClick={handleEdit}
              >
                Sửa yêu cầu
              </Button>
            )}
            {!canResend && (
              <Box className="mt-3 p-2.5 rounded-lg bg-amber-50">
                <Text size="xxSmall" className="text-amber-700 text-center">
                  Bạn đã gửi đủ {linkRequest!.max_per_day} lần hôm nay, vui lòng thử lại vào ngày mai
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* === REJECTED state === */}
        {isRejected && !editing && (
          <Box className="w-full bg-red-50 rounded-xl p-4 mb-4">
            <Box className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <Text className="text-sm font-semibold text-red-700">
                Yêu cầu bị từ chối
              </Text>
            </Box>
            <Text className="text-sm text-red-700">
              Mã nhân viên: <span className="font-semibold">{linkRequest!.employee_id}</span>
            </Text>
            {linkRequest!.reject_reason && (
              <Text size="xxSmall" className="text-red-600 mt-1">
                Lý do: {linkRequest!.reject_reason}
              </Text>
            )}
            {countInfo && (
              <Text size="xxSmall" className="text-red-600 mt-1">
                {countInfo}
              </Text>
            )}
            {canResend ? (
              <Text size="xxSmall" className="text-red-600 mt-2">
                Bạn có thể gửi lại yêu cầu bên dưới.
              </Text>
            ) : (
              <Box className="mt-3 p-2.5 rounded-lg bg-amber-50">
                <Text size="xxSmall" className="text-amber-700 text-center">
                  Bạn đã gửi đủ {linkRequest!.max_per_day} lần hôm nay, vui lòng thử lại vào ngày mai
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* === Form === */}
        {showForm && (
          <Box className="w-full bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-1">
              {editing ? "Sửa yêu cầu tạo tài khoản" : "Yêu cầu tạo tài khoản"}
            </Text>
            <Text size="xxSmall" className="text-gray-500 mb-3">
              Nhập mã nhân viên và họ tên để phòng Nhân sự xác minh và liên kết tài khoản Zalo của bạn.
            </Text>

            {/* Warning */}
            <Box className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Box className="flex items-start gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <Text size="xxSmall" className="text-amber-800 leading-relaxed">
                  Mỗi số điện thoại Zalo luôn được kiểm tra &amp; gán với 1 nhân viên duy nhất.
                  Vì vậy hãy nhập đúng thông tin mã nhân viên, họ tên của mình.
                  Nếu bạn nhập thông tin của người khác, bộ phận Nhân sự sẽ từ chối quyền truy cập vào ứng dụng này.
                </Text>
              </Box>
            </Box>

            {/* General error — top of form */}
            {generalError && (
              <Box className="mb-3 p-2.5 rounded-lg bg-red-50">
                <Text size="xxSmall" className="text-red-600">{generalError}</Text>
              </Box>
            )}

            {/* Employee ID input */}
            <Box className="mb-3">
              <Text size="xxSmall" className="text-gray-600 mb-1 font-medium">
                Mã nhân viên
              </Text>
              <input
                type="text"
                placeholder="TIQN-0001"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value.toUpperCase());
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.employee_id;
                    return next;
                  });
                  setGeneralError(null);
                }}
                maxLength={9}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono tracking-wider bg-white focus:outline-none ${
                  (employeeId && !employeeIdValid) || fieldErrors.employee_id
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-300 focus:border-[#006AF5]"
                }`}
              />
              {employeeId && !employeeIdValid && !fieldErrors.employee_id && (
                <Text size="xxSmall" className="text-red-500 mt-1">
                  Định dạng: TIQN-xxxx (4 chữ số)
                </Text>
              )}
              {fieldErrors.employee_id && (
                <Text size="xxSmall" className="text-red-500 mt-1">
                  {fieldErrors.employee_id}
                </Text>
              )}
            </Box>

            {/* Full name input */}
            <Box className="mb-4">
              <Text size="xxSmall" className="text-gray-600 mb-1 font-medium">
                Họ và tên
              </Text>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.full_name;
                    return next;
                  });
                  setGeneralError(null);
                }}
                onBlur={() => {
                  if (fullName.trim()) {
                    setFullName(normalizeName(fullName));
                  }
                }}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none ${
                  fieldErrors.full_name
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-300 focus:border-[#006AF5]"
                }`}
              />
              {fieldErrors.full_name && (
                <Text size="xxSmall" className="text-red-500 mt-1">
                  {fieldErrors.full_name}
                </Text>
              )}
            </Box>

            {/* Limit info */}
            {noRequest && (
              <Text size="xxSmall" className="text-gray-400 mb-3 text-center">
                Tối đa 2 lần/ngày
              </Text>
            )}

            {/* Submit button */}
            <Button
              className="w-full"
              variant="primary"
              size="large"
              loading={submitting}
              disabled={!canSubmit || submitting}
              onClick={handleSubmitLink}
            >
              {editing ? "Gửi lại yêu cầu" : "Yêu cầu tạo tài khoản"}
            </Button>

            {/* Cancel edit */}
            {editing && (
              <Button
                className="w-full mt-2"
                variant="tertiary"
                size="medium"
                onClick={() => setEditing(false)}
              >
                Huỷ
              </Button>
            )}
          </Box>
        )}

        {/* Retry button */}
        <Box className="w-full mt-auto">
          <Button
            className="w-full"
            variant="tertiary"
            size="large"
            onClick={handleRetry}
          >
            Thử lại
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default NotFoundPage;
