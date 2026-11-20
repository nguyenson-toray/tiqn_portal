import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import { Box, Icon, Page, Text } from "zmp-ui";
import { openChat } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import type { PayslipPeriodsData, PayslipPeriodItem } from "@/api/types";
import { chatAtom, isReadOnlyAtom } from "@/store/auth";
import { payslipCacheAtom, viewedPayslipPeriodsAtom } from "@/store/data";
import { useAsyncAction } from "@/hooks/useApi";
import { formatDateShort, formatDate } from "@/utils/format";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { PayslipListSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import AppHeader from "@/components/AppHeader";

const PayslipListPage: React.FC = () => {
  const navigate = useNavigate();
  const chat = useAtomValue(chatAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  const [cache, setCache] = useAtom(payslipCacheAtom);
  const viewedPeriods = useAtomValue(viewedPayslipPeriodsAtom);

  const [data, setData] = useState<PayslipPeriodsData | null>(cache?.data ?? null);
  const [selectedYear, setSelectedYear] = useState<number | null>(cache?.year ?? null);

  const { run: loadPeriods, loading, error } = useAsyncAction(
    useCallback((year?: number) => api.getPayslipPeriods(year != null ? { year } : undefined), []),
  );

  // Load only once on first mount (if no cached data)
  useEffect(() => {
    if (!cache) {
      loadPeriods().then((result) => {
        if (result) {
          setData(result);
          setSelectedYear(result.year);
          setCache({ year: result.year, data: result });
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYearChange = (year: number) => {
    if (year === selectedYear) return;
    setSelectedYear(year);
    loadPeriods(year).then((result) => {
      if (result) {
        setData(result);
        setCache({ year, data: result });
      }
    });
  };

  const handleChat = () => {
    if (chat) {
      const msg = chat.message || undefined;
      openChat({ type: chat.type, id: chat.id, ...(msg ? { message: msg } : {}) });
    }
  };

  const chatEnabled = !!chat && !isReadOnly;

  return (
    <Page className="flex flex-col h-full bg-gray-50">
      <AppHeader title="Phiếu lương" />

      <div className="flex-1 overflow-auto pb-32">
        {/* Chat with payroll staff */}
        {chatEnabled && (
          <button
            type="button"
            className="w-full px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 active:bg-gray-50"
            onClick={handleChat}
          >
            <Box className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Icon icon="zi-chat" size={20} className="text-[#006AF5]" />
            </Box>
            <Box className="flex-1 text-left min-w-0">
              <Text size="small" className="font-medium text-[#006AF5]">
                {chat.label || "Chat với nhân viên phụ trách công, lương"}
              </Text>
              {chat.name && (
                <Text size="xxSmall" className="text-gray-400 truncate">
                  {chat.name}
                </Text>
              )}
            </Box>
            <Icon icon="zi-chevron-right" size={16} className="text-gray-400" />
          </button>
        )}

        {/* Year selector */}
        {data && data.years_available.length > 0 && (
          <Box className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto">
            {data.years_available.map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  year === selectedYear
                    ? "bg-[#006AF5] text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {year}
              </button>
            ))}
          </Box>
        )}

        {loading && !data && (
          <PayslipListSkeleton />
        )}

        {error && !loading && (
          <ErrorState
            message={error}
            onRetry={() => loadPeriods(selectedYear ?? undefined).then((r) => {
              if (r) {
                setData(r);
                setCache({ year: r.year, data: r });
              }
            })}
          />
        )}

        {!loading && !error && data && (
          <Box className="px-4 py-2 space-y-3">
            {data.upcoming && (
              <Box className="bg-white rounded-xl p-4 border border-gray-200 opacity-60">
                <Box className="flex items-center justify-between">
                  <Text size="small" className="font-medium text-gray-500">
                    {data.upcoming.label}
                  </Text>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    Chưa phát hành
                  </span>
                </Box>
                {data.upcoming.expected_pay_date && (
                  <Text size="xxSmall" className="text-gray-400 mt-1">
                    Dự kiến {formatDate(data.upcoming.expected_pay_date)}
                  </Text>
                )}
              </Box>
            )}

            {data.items.length === 0 && !data.upcoming && (
              <EmptyState message="Chưa có phiếu lương nào" />
            )}

            {data.items.map((item) => (
              <PeriodCard
                key={item.period}
                item={item}
                viewed={viewedPeriods.has(item.period)}
                onTap={() => navigate(`/payslip/${item.period}`, {
                  state: {
                    published_on: item.published_on,
                    content_version: item.content_version,
                  },
                })}
              />
            ))}
          </Box>
        )}

      </div>

      <BottomNav />
    </Page>
  );
};

// --- Period Card Component ---

interface PeriodCardProps {
  item: PayslipPeriodItem;
  viewed: boolean;
  onTap: () => void;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ item, viewed, onTap }) => {
  const month = item.period.split("-")[1];
  const showNew = item.is_new && !viewed;

  return (
    <Box
      className="bg-white rounded-xl p-4 border border-gray-100 active:bg-gray-50 cursor-pointer"
      onClick={onTap}
    >
      <Box className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Text size="large" className="font-bold text-[#006AF5]">
            {parseInt(month, 10)}
          </Text>
        </div>

        <Box className="flex-1 min-w-0">
          <Box className="flex items-center gap-2">
            <Text size="small" className="font-medium text-gray-900">
              {item.label}
            </Text>
            {showNew && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500 text-white">
                Mới
              </span>
            )}
          </Box>

          <Text size="xxSmall" className="text-gray-400 mt-0.5">
            {formatDateShort(item.period_from)} – {formatDate(item.period_to)}
          </Text>

          <Text size="xxSmall" className="text-gray-400 mt-1">
            Phát hành {formatDate(item.published_on)}
          </Text>
        </Box>

        <Icon icon="zi-chevron-right" size={16} className="text-gray-400" />
      </Box>
    </Box>
  );
};

export default PayslipListPage;
