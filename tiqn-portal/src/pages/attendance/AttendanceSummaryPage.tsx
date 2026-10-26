import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Box, Text, Spinner, Icon } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { AttendanceSummaryData } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { formatDateShort, formatDecimal, formatPeriodLabel } from "@/utils/format";
import BottomNav from "@/components/BottomNav";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import ErrorState from "@/components/ErrorState";
import { useAtomValue } from "jotai";
import { isReadOnlyAtom } from "@/store/auth";

const TAB_ITEMS = [
  { key: "calendar", label: "Lịch tháng", path: "/attendance" },
  { key: "summary", label: "Tổng hợp", path: "/attendance/summary" },
  { key: "overtime", label: "Tăng ca", path: "/attendance/overtime" },
];

function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

const AttendanceSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  const [period, setPeriod] = useState<string | null>(null);
  const [data, setData] = useState<AttendanceSummaryData | null>(null);
  const mountedRef = useRef(true);

  const { run: fetchSummary, loading, error } = useAsyncAction(api.getAttendanceSummary);

  const loadData = useCallback(
    async (p?: string) => {
      const params = p ? { period: p } : undefined;
      const result = await fetchSummary(params);
      if (result && mountedRef.current) {
        setData(result);
        if (!p) setPeriod(result.period);
      }
    },
    [fetchSummary],
  );

  useEffect(() => {
    mountedRef.current = true;
    loadData(period || undefined);
    return () => {
      mountedRef.current = false;
    };
  }, [loadData, period]);

  const handlePrevPeriod = () => {
    if (period) setPeriod(shiftPeriod(period, -1));
  };
  const handleNextPeriod = () => {
    if (period) setPeriod(shiftPeriod(period, 1));
  };

  if (loading && !data) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
        <BottomNav />
      </Page>
    );
  }

  if (error && !data) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <ErrorState message={error} onRetry={() => loadData(period || undefined)} />
        <BottomNav />
      </Page>
    );
  }

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      {isReadOnly && <ReadOnlyBanner />}

      {/* Header */}
      <Box className="bg-[#006AF5] px-4 py-3">
        <Text className="font-semibold text-lg text-white">Chấm công</Text>
      </Box>

      {/* Tabs */}
      <Box className="bg-white border-b border-gray-100">
        <Box className="flex">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                tab.key === "summary"
                  ? "text-[#006AF5] border-b-2 border-[#006AF5]"
                  : "text-gray-500"
              }`}
              onClick={() => {
                if (tab.path !== "/attendance/summary") navigate(tab.path);
              }}
            >
              {tab.label}
            </button>
          ))}
        </Box>
      </Box>

      <Box className="flex-1 overflow-auto px-4 pt-3 pb-24 space-y-3">
        {/* Period Selector */}
        <Box className="flex items-center justify-center gap-4">
          <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 active:bg-blue-100" aria-label="Kỳ trước" onClick={handlePrevPeriod}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <Box className="min-w-[140px] text-center">
            <Text className="font-semibold text-gray-900">
              {period ? formatPeriodLabel(period) : ""}
            </Text>
            {data && (
              <Text size="xxSmall" className="text-gray-400">
                {formatDateShort(data.from_date)} – {formatDateShort(data.to_date)}
              </Text>
            )}
          </Box>
          <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 active:bg-blue-100" aria-label="Kỳ sau" onClick={handleNextPeriod}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </Box>

        {/* Status Badge */}
        {data?.provisional ? (
          <Box className="bg-yellow-50 rounded-xl px-3 py-2">
            <Text size="xSmall" className="text-yellow-700">
              Tạm tính đến {formatDateShort(data.as_of)}
            </Text>
          </Box>
        ) : data && (
          <Box className="bg-green-50 rounded-xl px-3 py-2">
            <Text size="xSmall" className="text-green-700">
              Đã chốt công
            </Text>
          </Box>
        )}

        {data && (
          <>
            {/* Main Stats */}
            <Box className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              {/* Payable Days */}
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-700 font-medium">
                  Công tính lương
                </Text>
                <Text size="small" className="font-bold text-[#006AF5]">
                  {formatDecimal(data.payable_days.value)}{" "}
                  <Text
                    size="xxSmall"
                    className="font-normal text-gray-400"
                    style={{ display: "inline" }}
                  >
                    / {formatDecimal(data.payable_days.standard)} công chuẩn
                  </Text>
                </Text>
              </Box>

              <Box className="border-t border-gray-50 pt-3 space-y-2">
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">
                    Ngày có mặt
                  </Text>
                  <Text size="small" className="text-gray-900">
                    {formatDecimal(data.present_days)}
                  </Text>
                </Box>
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">
                    Nghỉ phép có lương
                  </Text>
                  <Text size="small" className="text-gray-900">
                    {formatDecimal(data.paid_leave_days)}
                  </Text>
                </Box>
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">
                    Ngày lễ
                  </Text>
                  <Text size="small" className="text-gray-900">
                    {formatDecimal(data.holiday_days)}
                  </Text>
                </Box>
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">
                    Vắng không phép
                  </Text>
                  <Text size="small" className="text-red-600 font-medium">
                    {formatDecimal(data.unpaid_absent_days)}
                  </Text>
                </Box>
              </Box>

              <Box className="border-t border-gray-50 pt-3 space-y-2">
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">
                    Đi muộn/về sớm
                  </Text>
                  <Text size="small" className="text-orange-600">
                    {data.late_early.count} lần · {data.late_early.minutes} phút
                  </Text>
                </Box>
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">
                    Tăng ca đã duyệt
                  </Text>
                  <Box className="text-right">
                    <Text size="small" className="text-gray-900">
                      {formatDecimal(data.overtime.hours)} giờ
                    </Text>
                    {data.overtime.pending_registrations > 0 && (
                      <Text size="xxSmall" className="text-yellow-600">
                        {data.overtime.pending_registrations} phiếu chờ duyệt
                      </Text>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Text size="xxSmall" className="text-gray-400 text-center">
              Số liệu chấm công. Số được trả lương xem ở phiếu lương.
            </Text>
          </>
        )}
      </Box>

      <BottomNav />
    </Page>
  );
};

export default AttendanceSummaryPage;
