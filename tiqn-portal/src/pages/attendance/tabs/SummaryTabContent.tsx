import React, { useEffect, useCallback, useState } from "react";
import { useAtom } from "jotai";
import { Box, Text, Spinner } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { AttendanceSummaryData } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { summaryCacheAtom } from "@/store/data";
import { formatDateShort, formatDecimal, formatPeriodLabel } from "@/utils/format";
import ErrorState from "@/components/ErrorState";

function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

function getCurrentPeriod(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${m}`;
}

interface SummaryTabContentProps {
  registerRefresh?: (fn: () => Promise<void>) => void;
}

const SummaryTabContent: React.FC<SummaryTabContentProps> = ({ registerRefresh }) => {
  const [cache, setCache] = useAtom(summaryCacheAtom);

  const [period, setPeriod] = useState<string | null>(cache?.period ?? null);
  const [data, setData] = useState<AttendanceSummaryData | null>(cache?.data ?? null);

  const { run: fetchSummary, loading, error } = useAsyncAction(api.getAttendanceSummary);

  const loadData = useCallback(
    async (p?: string) => {
      const params = p ? { period: p } : undefined;
      const result = await fetchSummary(params);
      if (result) {
        setData(result);
        const effectivePeriod = p || result.period;
        if (!p) setPeriod(result.period);
        setCache({ period: effectivePeriod, data: result });
      }
    },
    [fetchSummary, setCache],
  );

  useEffect(() => {
    registerRefresh?.(() => loadData(period || undefined));
  }, [registerRefresh, loadData, period]);

  // Load only if no cache
  useEffect(() => {
    if (!cache) loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevPeriod = () => {
    if (period) {
      const newPeriod = shiftPeriod(period, -1);
      setPeriod(newPeriod);
      loadData(newPeriod);
    }
  };
  const handleNextPeriod = () => {
    if (period && period < getCurrentPeriod()) {
      const newPeriod = shiftPeriod(period, 1);
      setPeriod(newPeriod);
      loadData(newPeriod);
    }
  };

  const isCurrentOrFuture = !period || period >= getCurrentPeriod();

  if (loading && !data) {
    return (
      <Box className="flex-1 flex items-center justify-center py-12">
        <Spinner visible />
      </Box>
    );
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => loadData(period || undefined)} />;
  }

  return (
    <>
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
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded-full ${isCurrentOrFuture ? "bg-gray-100 opacity-40" : "bg-blue-50 active:bg-blue-100"}`}
          onClick={handleNextPeriod}
          disabled={isCurrentOrFuture}
          aria-label="Kỳ sau"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isCurrentOrFuture ? "#9ca3af" : "#006AF5"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
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
            <Box className="flex items-center justify-between">
              <Text size="small" className="text-gray-700 font-medium">Công tính lương</Text>
              <Text size="small" className="font-bold text-[#006AF5]">
                {formatDecimal(data.payable_days.value)}{" "}
                <Text size="xxSmall" className="font-normal text-gray-400" style={{ display: "inline" }}>
                  / {formatDecimal(data.payable_days.standard)} công chuẩn
                </Text>
              </Text>
            </Box>

            <Box className="border-t border-gray-50 pt-3 space-y-2">
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">Ngày có mặt</Text>
                <Text size="small" className="text-gray-900">{formatDecimal(data.present_days)}</Text>
              </Box>
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">Nghỉ phép có lương</Text>
                <Text size="small" className="text-gray-900">{formatDecimal(data.paid_leave_days)}</Text>
              </Box>
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">Ngày lễ</Text>
                <Text size="small" className="text-gray-900">{formatDecimal(data.holiday_days)}</Text>
              </Box>
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">Vắng không phép</Text>
                <Text size="small" className="text-red-600 font-medium">{formatDecimal(data.unpaid_absent_days)}</Text>
              </Box>
            </Box>

            <Box className="border-t border-gray-50 pt-3 space-y-2">
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">Đi muộn/về sớm</Text>
                <Text size="small" className="text-orange-600">
                  {data.late_early.count} lần · {data.late_early.minutes} phút
                </Text>
              </Box>
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">Tăng ca đã duyệt</Text>
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
    </>
  );
};

export default SummaryTabContent;
