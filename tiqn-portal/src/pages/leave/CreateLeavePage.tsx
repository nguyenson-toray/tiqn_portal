import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Spinner, Button, Icon, Input } from "zmp-ui";

import * as api from "@/api/endpoints";
import { ApiException, NetworkError } from "@/api/client";
import type { LeaveFormData, PreviewLeaveData } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { configAtom, isReadOnlyAtom } from "@/store/auth";
import { formatDateShort, formatDecimal } from "@/utils/format";
import ErrorState from "@/components/ErrorState";
import AppHeader from "@/components/AppHeader";

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const CreateLeavePage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  // Form data from API
  const [formData, setFormData] = useState<LeaveFormData | null>(null);
  const { run: fetchForm, loading: formLoading, error: formError } = useAsyncAction(
    api.getLeaveForm,
  );

  // Form state
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Preview
  const [preview, setPreview] = useState<PreviewLeaveData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const clientRequestIdRef = useRef<string | null>(null);
  const formEditedRef = useRef(false);

  // Confirmation

  const mountedRef = useRef(true);

  const { run: runPreview } = useAsyncAction(api.previewLeave);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const data = await fetchForm();
      if (data && mountedRef.current) {
        setFormData(data);
        if (data.leave_types.length > 0) {
          setLeaveType(data.leave_types[0].leave_type);
        }
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchForm]);

  // Selected leave type info
  const selectedType = useMemo(
    () => formData?.leave_types.find((t) => t.leave_type === leaveType),
    [formData, leaveType],
  );

  // Preview with debounce
  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    setPreview(null);

    if (!leaveType || !fromDate || !toDate) return;

    previewTimerRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      const params: Record<string, any> = {
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
      };
      if (halfDay) {
        params.half_day = 1;
        params.half_day_date = fromDate;
      }
      const data = await runPreview(params);
      if (data && mountedRef.current) {
        setPreview(data);
      }
      setPreviewLoading(false);
    }, 400);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [leaveType, fromDate, toDate, halfDay, runPreview]);

  // Mark form as edited when user changes fields
  useEffect(() => {
    formEditedRef.current = true;
  }, [leaveType, fromDate, toDate, halfDay, reason]);

  // File handling
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const docsConfig = formData?.documents;
    const uploadsConfig = config?.uploads;
    const maxFiles = docsConfig?.max_files ?? uploadsConfig?.max_files ?? 5;
    const maxSizeMB = docsConfig?.max_size_mb ?? uploadsConfig?.max_size_mb ?? 5;
    const acceptTypes = docsConfig?.accept ?? uploadsConfig?.accept ?? [];

    const newFiles = Array.from(selected);
    const errors: string[] = [];

    // Check total count
    if (files.length + newFiles.length > maxFiles) {
      errors.push(`Tối đa ${maxFiles} tệp`);
    }

    for (const f of newFiles) {
      // Check size
      if (f.size > maxSizeMB * 1024 * 1024) {
        errors.push(`${f.name}: vượt quá ${maxSizeMB}MB`);
      }
      // Check type
      if (acceptTypes.length > 0) {
        const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
        const mimeMatch = acceptTypes.some(
          (a) => f.type === a || (a.endsWith("/*") && f.type.startsWith(a.replace("/*", "/")))
        );
        const extMatch = acceptTypes.some((a) => a.startsWith(".") && ext === a.toLowerCase());
        if (!mimeMatch && !extMatch) {
          errors.push(`${f.name}: loại tệp không được chấp nhận`);
        }
      }
    }

    if (errors.length > 0) {
      setSubmitError(errors.join(". "));
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setSubmitError(null);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async () => {
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
      setSubmitError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Generate new client_request_id if form was edited, or if no id exists
    if (formEditedRef.current || !clientRequestIdRef.current) {
      clientRequestIdRef.current = crypto.randomUUID();
      formEditedRef.current = false;
    }

    try {
      const params: Record<string, any> = {
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim(),
        client_request_id: clientRequestIdRef.current,
      };
      if (halfDay) {
        params.half_day = 1;
        params.half_day_date = fromDate;
      }

      const result = await api.createLeaveApplication(params as any);
      const leaveId = result.id;

      // Upload documents if any
      if (selectedType?.allows_documents && files.length > 0) {
        let uploadFailed = 0;
        for (const file of files) {
          try {
            const uploadId = crypto.randomUUID();
            await api.uploadLeaveDocument(leaveId, uploadId, file);
          } catch {
            uploadFailed++;
          }
        }

        if (uploadFailed > 0) {
          setSubmitError(
            `Đơn đã gửi, ${uploadFailed} tệp chưa tải lên`,
          );
          // Still navigate to detail
          setTimeout(() => navigate(`/leave/${leaveId}`, { replace: true }), 1500);
          return;
        }
      }

      navigate(`/leave/${leaveId}`, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setSubmitError(err.message || "Có lỗi khi gửi đơn");
      } else if (err instanceof NetworkError) {
        // Network error - keep same client_request_id for retry
        formEditedRef.current = false;
        setSubmitError("Lỗi mạng, vui lòng thử lại");
      } else {
        setSubmitError("Có lỗi, vui lòng thử lại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (formLoading) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Tạo đơn nghỉ" showBack />
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
      </Page>
    );
  }

  if (formError) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Tạo đơn nghỉ" showBack />
        <ErrorState message={formError} onRetry={() => fetchForm()} />
      </Page>
    );
  }

  // Blocked state
  if (formData?.blocked) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Tạo đơn nghỉ" showBack />
        <Box className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
            <Icon icon="zi-warning" size={32} className="text-orange-500" />
          </div>
          <Text className="text-center text-gray-600">{formData.blocked.message}</Text>
        </Box>
      </Page>
    );
  }

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Tạo đơn nghỉ" showBack />

      <Box className="flex-1 overflow-auto px-4 pt-3 pb-6 space-y-4">
        {/* Leave Type */}
        <Box>
          <Text size="small" className="text-gray-600 font-medium mb-1">
            Loại nghỉ
          </Text>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
          >
            {formData?.leave_types.map((lt) => (
              <option key={lt.leave_type} value={lt.leave_type}>
                {lt.label}
                {lt.uses_balance && lt.available !== null
                  ? ` (còn ${formatDecimal(lt.available)} ngày)`
                  : ""}
              </option>
            ))}
          </select>
        </Box>

        {/* Date Pickers */}
        <Box className="grid grid-cols-2 gap-3">
          <Box>
            <Text size="small" className="text-gray-600 font-medium mb-1">
              Từ ngày
            </Text>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              value={fromDate}
              onChange={(e) => {
                const ds = e.target.value;
                setFromDate(ds);
                if (!toDate || ds > toDate) setToDate(ds);
              }}
            />
          </Box>
          <Box>
            <Text size="small" className="text-gray-600 font-medium mb-1">
              Đến ngày
            </Text>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
              }}
            />
          </Box>
        </Box>

        {/* Half Day */}
        {formData?.half_day_allowed && (
          <Box>
            <Text size="small" className="text-gray-600 font-medium mb-1">
              Thời lượng
            </Text>
            <Box className="flex gap-3">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  !halfDay
                    ? "border-[#006AF5] bg-blue-50 text-[#006AF5]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
                onClick={() => setHalfDay(false)}
              >
                Cả ngày
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  halfDay
                    ? "border-[#006AF5] bg-blue-50 text-[#006AF5]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
                onClick={() => setHalfDay(true)}
              >
                Nửa ngày
              </button>
            </Box>
          </Box>
        )}

        {/* Preview */}
        {(previewLoading || preview) && (
          <Box className="bg-blue-50 rounded-lg p-3">
            {previewLoading ? (
              <Box className="flex items-center gap-2">
                <Spinner visible />
                <Text size="small" className="text-[#006AF5]">
                  Đang tính...
                </Text>
              </Box>
            ) : preview ? (
              <>
                <Text size="small" className="font-medium text-blue-700 mb-1">
                  {formatDecimal(preview.days)} ngày nghỉ
                </Text>
                {preview.available_before !== null && (
                  <Text size="xSmall" className="text-[#006AF5]">
                    Phép khả dụng: {formatDecimal(preview.available_before)} →{" "}
                    {preview.available_after !== null
                      ? formatDecimal(preview.available_after)
                      : "—"}
                  </Text>
                )}
                {preview.excluded_dates.length > 0 && (
                  <Text size="xSmall" className="text-[#006AF5] mt-1">
                    Không tính:{" "}
                    {preview.excluded_dates
                      .map((d) => `${formatDateShort(d.date)} (${d.label})`)
                      .join(", ")}
                  </Text>
                )}
                {preview.note && (
                  <Text size="xSmall" className="text-[#006AF5] mt-1">
                    {preview.note}
                  </Text>
                )}
              </>
            ) : null}
          </Box>
        )}

        {/* Reason */}
        <Box>
          <Text size="small" className="text-gray-600 font-medium mb-1">
            Lý do
          </Text>
          <textarea
            value={reason}
            onChange={(e) => {
              if (e.target.value.length <= 500) setReason(e.target.value);
            }}
            placeholder="Nhập lý do nghỉ phép..."
            maxLength={500}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white resize-none"
          />
          <Text size="xxSmall" className="text-gray-400 text-right">
            {reason.length}/500
          </Text>
        </Box>

        {/* Approver */}
        {formData?.approver && (
          <Box>
            <Text size="small" className="text-gray-600 font-medium mb-1">
              Người duyệt
            </Text>
            <Box className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Text size="xSmall" className="text-[#006AF5] font-semibold">
                  {formData.approver.initials}
                </Text>
              </div>
              <Box>
                <Text size="small" className="font-medium text-gray-900">
                  {formData.approver.full_name}
                </Text>
                <Text size="xxSmall" className="text-gray-500">
                  {formData.approver.designation}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Documents Section */}
        {selectedType?.allows_documents && (
          <Box>
            <Text size="small" className="text-gray-600 font-medium mb-1">
              Giấy tờ khám bệnh
            </Text>

            {/* Selected Files */}
            {files.length > 0 && (
              <Box className="space-y-2 mb-2">
                {files.map((f, i) => (
                  <Box
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <Box className="flex items-center gap-2 min-w-0 flex-1">
                      <Icon icon="zi-photo" size={18} className="text-gray-400" />
                      <Text
                        size="xSmall"
                        className="text-gray-700 truncate"
                      >
                        {f.name}
                      </Text>
                    </Box>
                    <button
                      type="button"
                      className="p-1 text-gray-400"
                      onClick={() => removeFile(i)}
                    >
                      <Icon icon="zi-close" size={16} />
                    </button>
                  </Box>
                ))}
              </Box>
            )}

            <button
              type="button"
              className="w-full border border-dashed border-gray-300 rounded-lg py-3 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon icon="zi-camera" size={20} className="text-gray-400 mx-auto" />
              <Text size="xSmall" className="text-gray-500 mt-1">
                Chọn tệp hoặc chụp ảnh
              </Text>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={
                (formData?.documents?.accept ?? config?.uploads?.accept)?.join(",") ||
                "image/*,.pdf"
              }
              onChange={handleFileSelect}
              className="hidden"
            />
          </Box>
        )}

        {/* Error */}
        {submitError && (
          <Box className="bg-red-50 rounded-lg px-3 py-2">
            <Text size="small" className="text-red-600">
              {submitError}
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          fullWidth
          loading={submitting}
          disabled={submitting || isReadOnly || !leaveType || !fromDate || !toDate || !reason.trim()}
          onClick={handleSubmit}
          className="mt-2"
        >
          Gửi đơn
        </Button>
      </Box>
    </Page>
  );
};

export default CreateLeavePage;
