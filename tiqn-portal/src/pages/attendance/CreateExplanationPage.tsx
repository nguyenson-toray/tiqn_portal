import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page, Box, Text, Spinner, Button, Icon } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { ExplanationFormData } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { formatDate } from "@/utils/format";
import ErrorState from "@/components/ErrorState";
import AppHeader from "@/components/AppHeader";

/** Generate all dates between from and to (inclusive) */
function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

const CreateExplanationPage: React.FC = () => {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();

  const [form, setForm] = useState<ExplanationFormData | null>(null);
  const [fromDate, setFromDate] = useState(date || "");
  const [toDate, setToDate] = useState(date || "");
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [times, setTimes] = useState<Record<string, { check_in: string; check_out: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const clientRequestIdRef = useRef<string | null>(null);

  const mountedRef = useRef(true);

  const { run: fetchForm, loading, error } = useAsyncAction(api.getExplanationForm);
  const { run: submitRequest } = useAsyncAction(api.createAttendanceRequest);

  const loadForm = useCallback(async () => {
    if (!date) return;
    const result = await fetchForm(date);
    if (result && mountedRef.current) {
      setForm(result);
      setFromDate(result.date);
      setToDate(result.date);
      // Pre-populate existing times
      if (result.existing) {
        setTimes({
          [result.date]: {
            check_in: result.existing.check_in || "",
            check_out: result.existing.check_out || "",
          },
        });
      }
    }
  }, [date, fetchForm]);

  useEffect(() => {
    mountedRef.current = true;
    loadForm();
    return () => {
      mountedRef.current = false;
    };
  }, [loadForm]);

  const selectedReason = form?.reasons.find((r) => r.value === reason);
  const requiresTimes = selectedReason?.requires_times || false;
  const dateRange = getDateRange(fromDate, toDate);

  const handleTimeChange = (d: string, field: "check_in" | "check_out", value: string) => {
    setTimes((prev) => ({
      ...prev,
      [d]: { ...(prev[d] || { check_in: "", check_out: "" }), [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!reason || !explanation.trim()) return;

    // Generate client_request_id once per click
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = crypto.randomUUID();
    }

    setSubmitting(true);
    setSubmitError(null);

    const timesPayload = requiresTimes
      ? dateRange.map((d) => ({
          date: d,
          check_in: times[d]?.check_in || null,
          check_out: times[d]?.check_out || null,
        }))
      : undefined;

    const result = await submitRequest({
      from_date: fromDate,
      to_date: toDate,
      reason,
      explanation: explanation.trim(),
      times: timesPayload,
      client_request_id: clientRequestIdRef.current,
    });

    setSubmitting(false);

    if (result) {
      // Reset the ref so next click generates a new ID
      clientRequestIdRef.current = null;
      navigate(-1);
    } else {
      // On error, keep the same client_request_id for retry
      setSubmitError("Gửi giải trình thất bại, vui lòng thử lại");
    }
  };

  if (loading && !form) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
      </Page>
    );
  }

  if (error && !form) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <ErrorState message={error} onRetry={loadForm} />
      </Page>
    );
  }

  if (!form) return null;

  // Blocked state
  if (form.blocked) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Giải trình chấm công" showBack />
        <Box className="flex-1 flex items-center justify-center px-6">
          <Text className="text-center text-gray-500">{form.blocked.message}</Text>
        </Box>
      </Page>
    );
  }

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Giải trình chấm công" showBack />

      <Box className="flex-1 overflow-auto px-4 pt-3 pb-24 space-y-4">
        {/* Context */}
        <Box className="bg-blue-50 rounded-xl p-3">
          <Text size="small" className="text-blue-700">
            {form.context_label}
          </Text>
        </Box>

        {/* Date Fields */}
        <Box className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <Box>
            <Text size="xSmall" className="text-gray-500 mb-1">
              Từ ngày
            </Text>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
            />
          </Box>
          <Box>
            <Text size="xSmall" className="text-gray-500 mb-1">
              Đến ngày
            </Text>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
            />
          </Box>
        </Box>

        {/* Reason Select */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Text size="xSmall" className="text-gray-500 mb-1">
            Lý do
          </Text>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="">-- Chọn lý do --</option>
            {form.reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Box>

        {/* Time Inputs (if requires_times) */}
        {requiresTimes && (
          <Box className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <Text size="small" className="font-semibold text-gray-900">
              Thời gian chấm công
            </Text>
            {dateRange.map((d) => (
              <Box key={d} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <Text size="xSmall" className="text-gray-500 mb-1">
                  {formatDate(d)}
                </Text>
                <Box className="grid grid-cols-2 gap-2">
                  <Box>
                    <Text size="xxSmall" className="text-gray-400 mb-0.5">
                      Giờ vào
                    </Text>
                    <input
                      type="time"
                      value={times[d]?.check_in || ""}
                      onChange={(e) => handleTimeChange(d, "check_in", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                    />
                  </Box>
                  <Box>
                    <Text size="xxSmall" className="text-gray-400 mb-0.5">
                      Giờ ra
                    </Text>
                    <input
                      type="time"
                      value={times[d]?.check_out || ""}
                      onChange={(e) => handleTimeChange(d, "check_out", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Explanation TextArea */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Text size="xSmall" className="text-gray-500 mb-1">
            Giải thích
          </Text>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={4}
            placeholder="Nhập nội dung giải trình..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
          />
          <Text size="xxSmall" className="text-gray-400 text-right mt-1">
            {explanation.length}/500
          </Text>
        </Box>

        {/* Approver Info */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Text size="xSmall" className="text-gray-500 mb-1">
            Người duyệt
          </Text>
          <Box className="flex items-center gap-2">
            <Box className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Text size="xxSmall" className="text-gray-600 font-medium">
                {form.approver.initials}
              </Text>
            </Box>
            <Box>
              <Text size="small" className="font-medium text-gray-900">
                {form.approver.full_name}
              </Text>
              <Text size="xxSmall" className="text-gray-500">
                {form.approver.designation}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Shift Info */}
        <Box className="bg-gray-50 rounded-xl p-3">
          <Text size="xxSmall" className="text-gray-400">
            Ca làm: {form.shift.label} ({form.shift.start} - {form.shift.end})
          </Text>
        </Box>

        {submitError && (
          <Text size="small" className="text-red-600 text-center">
            {submitError}
          </Text>
        )}
      </Box>

      {/* Submit Button */}
      <Box className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-10">
        <Button
          fullWidth
          loading={submitting}
          disabled={!reason || !explanation.trim() || submitting}
          onClick={handleSubmit}
        >
          Gửi giải trình
        </Button>
      </Box>
    </Page>
  );
};

export default CreateExplanationPage;
