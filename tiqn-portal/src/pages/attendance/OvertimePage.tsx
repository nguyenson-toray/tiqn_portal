import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Box, Text, Spinner, Icon } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { OvertimeData, OvertimeItem } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { formatDecimal, formatDateShort, formatPeriodLabel } from "@/utils/format";
import BottomNav from "@/components/BottomNav";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useAtomValue } from "jotai";
import { isReadOnlyAtom } from "@/store/auth";

const TAB_ITEMS = [
  { key: "calendar", label: "Lịch tháng", path: "/attendance" },
  { key: "summary", label: "Tổng hợp", path: "/attendance/summary" },
  { key: "overtime", label: "Tăng ca", path: "/attendance/overtime" },
];

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

const OvertimePage: React.FC = () => {
  const navigate = useNavigate();
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  const [period, setPeriod] = useState<string | null>(null);
  const [data, setData] = useState<OvertimeData | null>(null);
  const mountedRef = useRef(true);

  const { run: fetchOvertime, loading, error } = useAsyncAction(api.getOvertime);

  const loadData = useCallback(
    async (p?: string) => {
      const params = p ? { period: p } : undefined;
      const result = await fetchOvertime(params);
      if (result && mountedRef.current) {
        setData(result);
        if (!p) setPeriod(result.period);
      }
    },
    [fetchOvertime],
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
                tab.key === "overtime"
                  ? "text-[#006AF5] border-b-2 border-[#006AF5]"
                  : "text-gray-500"
              }`}
              onClick={() => {
                if (tab.path !== "/attendance/overtime") navigate(tab.path);
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

        {data && (
          <>
            {/* Summary Cards */}
            <Box className="grid grid-cols-2 gap-3">
              <Box className="bg-white rounded-xl p-3 shadow-sm text-center">
                <Text size="xxSmall" className="text-gray-500">
                  Đã duyệt
                </Text>
                <Text className="font-bold text-lg text-green-600">
                  {formatDecimal(data.registered_approved_hours)}{" "}
                  <Text
                    size="xxSmall"
                    className="font-normal text-gray-400"
                    style={{ display: "inline" }}
                  >
                    giờ
                  </Text>
                </Text>
              </Box>
              <Box className="bg-white rounded-xl p-3 shadow-sm text-center">
                <Text size="xxSmall" className="text-gray-500">
                  Chờ duyệt
                </Text>
                <Text className="font-bold text-lg text-yellow-600">
                  {formatDecimal(data.registered_pending_hours)}{" "}
                  <Text
                    size="xxSmall"
                    className="font-normal text-gray-400"
                    style={{ display: "inline" }}
                  >
                    giờ
                  </Text>
                </Text>
              </Box>
            </Box>

            {/* Actual Hours */}
            <Box className="bg-white rounded-xl p-3 shadow-sm">
              <Box className="flex items-center justify-between">
                <Text size="small" className="text-gray-500">
                  Thực tính
                </Text>
                <Text size="small" className="font-semibold text-gray-900">
                  {formatDecimal(data.actual_hours)} giờ
                </Text>
              </Box>
            </Box>

            {/* Overtime Items */}
            {data.items.length === 0 ? (
              <EmptyState message="Không có phiếu tăng ca" />
            ) : (
              <Box className="space-y-2">
                {data.items.map((item) => (
                  <Box
                    key={item.registration_id}
                    className="bg-white rounded-xl p-3 shadow-sm"
                  >
                    <Box className="flex items-start justify-between mb-1">
                      <Box>
                        <Text size="small" className="font-medium text-gray-900">
                          {parseInt(item.date.split("-")[2], 10)}{" "}
                          <Text
                            size="xSmall"
                            className="text-gray-500"
                            style={{ display: "inline" }}
                          >
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
                      <Text size="xxSmall" className="text-gray-400 mt-1">
                        {item.reason}
                      </Text>
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
      </Box>

      <BottomNav />
    </Page>
  );
};

export default OvertimePage;
