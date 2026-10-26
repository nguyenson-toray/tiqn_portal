import React, { useEffect, useCallback, useState } from "react";
import { useAtom } from "jotai";
import { Box, Text, Spinner } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { OvertimeData } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
// NOTE: This tab is no longer used (merged into CalendarTabContent)
import { atom } from "jotai";
const overtimeCacheAtom = atom<{ period: string; data: any } | null>(null);
import { formatDecimal, formatDateShort, formatPeriodLabel } from "@/utils/format";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Đã duyệt",
  PENDING: "Chờ duyệt",
  REGISTERED: "Đã đăng ký",
};

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

interface OvertimeTabContentProps {
  registerRefresh?: (fn: () => Promise<void>) => void;
}

const OvertimeTabContent: React.FC<OvertimeTabContentProps> = ({ registerRefresh }) => {
  const [cache, setCache] = useAtom(overtimeCacheAtom);

  const [period, setPeriod] = useState<string | null>(cache?.period ?? null);
  const [data, setData] = useState<OvertimeData | null>(cache?.data ?? null);

  const { run: fetchOvertime, loading, error } = useAsyncAction(api.getOvertime);

  const loadData = useCallback(
    async (p?: string) => {
      const params = p ? { period: p } : undefined;
      const result = await fetchOvertime(params);
      if (result) {
        setData(result);
        const effectivePeriod = p || result.period;
        if (!p) setPeriod(result.period);
        setCache({ period: effectivePeriod, data: result });
      }
    },
    [fetchOvertime, setCache],
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

      {data && (
        <>
          {/* Summary */}
          <Box className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <Box className="flex items-center justify-between">
              <Text size="small" className="text-gray-500">Thực tính từ chấm công</Text>
              <Text size="small" className="font-bold text-gray-900">
                {formatDecimal(data.actual_hours)} giờ
              </Text>
            </Box>
            {(data.registered_approved_hours > 0 || data.registered_pending_hours > 0) && (
              <>
                <Box className="border-t border-gray-50 pt-2 flex items-center justify-between">
                  <Text size="small" className="text-gray-500">Phiếu đã duyệt</Text>
                  <Text size="small" className="font-semibold text-green-600">
                    {formatDecimal(data.registered_approved_hours)} giờ
                  </Text>
                </Box>
                <Box className="flex items-center justify-between">
                  <Text size="small" className="text-gray-500">Phiếu chờ duyệt</Text>
                  <Text size="small" className="font-semibold text-yellow-600">
                    {formatDecimal(data.registered_pending_hours)} giờ
                  </Text>
                </Box>
              </>
            )}
          </Box>

          {/* Overtime Items */}
          {data.items.length === 0 ? (
            data.actual_hours > 0 ? (
              <Box className="bg-blue-50 rounded-xl p-3">
                <Text size="xxSmall" className="text-blue-700">
                  Tăng ca được tính trực tiếp từ giờ chấm công, không có phiếu đăng ký riêng.
                </Text>
              </Box>
            ) : (
              <EmptyState message="Không có tăng ca trong kỳ này" />
            )
          ) : (
            <Box className="space-y-2">
              {data.items.map((item) => (
                <Box key={item.registration_id} className="bg-white rounded-xl p-3 shadow-sm">
                  <Box className="flex items-start justify-between mb-1">
                    <Box>
                      <Text size="small" className="font-medium text-gray-900">
                        {parseInt(item.date.split("-")[2], 10)}{" "}
                        <Text size="xSmall" className="text-gray-500" style={{ display: "inline" }}>
                          {item.weekday_label}
                        </Text>
                      </Text>
                      <Text size="xSmall" className="text-gray-600">
                        {item.begin} - {item.end} · {formatDecimal(item.hours)} giờ
                      </Text>
                    </Box>
                    <StatusBadge
                      status={item.status}
                      label={STATUS_LABELS[item.status] || item.status_label}
                    />
                  </Box>
                  {item.reason && (
                    <Text size="xxSmall" className="text-gray-400 mt-1">{item.reason}</Text>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Footer Note */}
          <Box className="bg-gray-50 rounded-xl p-3">
            <Text size="xxSmall" className="text-gray-500 text-center">
              Chỉ xem. Phiếu đăng ký tăng ca được tạo và duyệt trên hệ thống ERPNext.
            </Text>
          </Box>
        </>
      )}
    </>
  );
};

export default OvertimeTabContent;
