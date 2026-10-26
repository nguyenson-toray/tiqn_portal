import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import { Page, Box, Text, Spinner, Button, Icon } from "zmp-ui";

import * as api from "@/api/endpoints";
import type {
  LeaveBalance,
  LeaveApplicationsData,
  LeaveApplicationItem,
} from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { configAtom, isReadOnlyAtom } from "@/store/auth";
import { leaveBalanceAtom, leaveAppsAtom } from "@/store/data";
import { formatDateShort, formatDecimal } from "@/utils/format";
import BottomNav from "@/components/BottomNav";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import AppHeader from "@/components/AppHeader";
import PullToRefresh from "@/components/PullToRefresh";

type FilterTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const FILTER_TABS: { key: FilterTab; label: string; status?: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt", status: "PENDING" },
  { key: "APPROVED", label: "Đã duyệt", status: "APPROVED" },
  { key: "REJECTED", label: "Từ chối", status: "REJECTED" },
];

function formatDateRange(from: string, to: string): string {
  if (from === to) return formatDateShort(from);
  return `${formatDateShort(from)} – ${formatDateShort(to)}`;
}

const LeavePage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);
  const features = config?.features;

  const [balanceCache, setBalanceCache] = useAtom(leaveBalanceAtom);
  const [appsCache, setAppsCache] = useAtom(leaveAppsAtom);

  const [balance, setBalance] = useState<LeaveBalance | null>(balanceCache);
  const [appData, setAppData] = useState<LeaveApplicationsData | null>(appsCache?.data ?? null);
  const [items, setItems] = useState<LeaveApplicationItem[]>(appsCache?.items ?? []);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const { run: fetchBalance, loading: balLoading, error: balError } = useAsyncAction(
    api.getLeaveBalances,
  );
  const { run: fetchApps, loading: appsLoading, error: appsError } = useAsyncAction(
    api.getLeaveApplications,
  );

  const loadBalance = useCallback(async () => {
    const data = await fetchBalance();
    if (data) {
      setBalance(data);
      setBalanceCache(data);
    }
  }, [fetchBalance, setBalanceCache]);

  const loadApplications = useCallback(
    async (yr?: number, status?: string, pg = 1, append = false) => {
      if (append) setLoadingMore(true);
      const params: Record<string, any> = { page: pg, page_size: 10 };
      if (yr) params.year = yr;
      if (status) params.status = status;
      const data = await fetchApps(params);
      if (data) {
        setAppData(data);
        setItems((prev) => {
          const newItems = append ? [...prev, ...data.items] : data.items;
          setAppsCache({ data, items: newItems });
          return newItems;
        });
        setPage(pg);
      }
      if (append) setLoadingMore(false);
    },
    [fetchApps, setAppsCache],
  );

  // Load only once on first mount (if no cached data)
  useEffect(() => {
    if (!balanceCache) loadBalance();
    if (!appsCache) loadApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(async () => {
    setActiveFilter("ALL");
    setSelectedYear(undefined);
    setPage(1);
    await Promise.all([
      loadBalance(),
      (async () => {
        const data = await fetchApps({ page: 1, page_size: 10 });
        if (data) {
          setAppData(data);
          setItems(data.items);
          setAppsCache({ data, items: data.items });
        }
      })(),
    ]);
  }, [loadBalance, fetchApps, setAppsCache]);

  const handleYearChange = (yr: number) => {
    setSelectedYear(yr);
    const status = FILTER_TABS.find((t) => t.key === activeFilter)?.status;
    loadApplications(yr, status, 1);
  };

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    const status = FILTER_TABS.find((t) => t.key === filter)?.status;
    loadApplications(selectedYear, status, 1);
  };

  const handleLoadMore = () => {
    if (!appData?.has_more || loadingMore) return;
    const status = FILTER_TABS.find((t) => t.key === activeFilter)?.status;
    loadApplications(selectedYear, status, page + 1, true);
  };

  const loading = balLoading || appsLoading;
  const error = balError || appsError;
  const isFirstLoad = loading && !balance && !appData;

  if (isFirstLoad) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
        <BottomNav />
      </Page>
    );
  }

  if (error && !balance && !appData) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <ErrorState
          message={error}
          onRetry={() => {
            loadBalance();
            loadApplications();
          }}
        />
        <BottomNav />
      </Page>
    );
  }

  const annual = balance?.annual;
  const others = balance?.others || [];
  const yearsAvailable = appData?.years_available || [];
  const counts = appData?.counts || {};
  const canCreate = !isReadOnly && features?.leave_create === true;

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      {isReadOnly && <ReadOnlyBanner />}

      <AppHeader title="Nghỉ phép" />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-4 pt-3 pb-24 space-y-3">
        {/* Annual Leave Balance Card */}
        {annual && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Text size="small" className="text-gray-500 mb-1">
              Phép năm {balance?.year} · còn lại
            </Text>
            <Text className="font-bold text-3xl text-[#006AF5] mb-3">
              {formatDecimal(annual.remaining)}{" "}
              <Text
                size="small"
                className="font-normal text-gray-500"
                style={{ display: "inline" }}
              >
                ngày
              </Text>
            </Text>
            <Box className="grid grid-cols-4 gap-2 text-center">
              <Box>
                <Text size="xxSmall" className="text-gray-400">Cấp</Text>
                <Text size="small" className="font-semibold text-gray-700">
                  {formatDecimal(annual.allocated)}
                </Text>
              </Box>
              <Box>
                <Text size="xxSmall" className="text-gray-400">Đã dùng</Text>
                <Text size="small" className="font-semibold text-gray-700">
                  {formatDecimal(annual.used)}
                </Text>
              </Box>
              <Box>
                <Text size="xxSmall" className="text-gray-400">Chờ duyệt</Text>
                <Text size="small" className="font-semibold text-yellow-600">
                  {formatDecimal(annual.pending)}
                </Text>
              </Box>
              <Box>
                <Text size="xxSmall" className="text-gray-400">Khả dụng</Text>
                <Text size="small" className="font-semibold text-green-600">
                  {formatDecimal(annual.available)}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Other Leave Types */}
        {others.length > 0 && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Text size="small" className="text-gray-500 font-medium mb-2">
              Các loại nghỉ khác
            </Text>
            <Box className="space-y-2">
              {others.map((item) => (
                <Box
                  key={item.leave_type}
                  className="flex items-center justify-between py-1"
                >
                  <Text size="small" className="text-gray-700">{item.label}</Text>
                  <Text size="small" className="font-medium text-gray-900">
                    {item.balance !== null
                      ? `${formatDecimal(item.balance)} ngày`
                      : item.note}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* My Applications */}
        <Box>
          <Box className="flex items-center justify-between mb-2">
            <Text className="font-semibold text-gray-900">Đơn của tôi</Text>
            {yearsAvailable.length > 1 && (
              <select
                value={selectedYear || yearsAvailable[0]}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700"
              >
                {yearsAvailable.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            )}
          </Box>

          {/* Filter Tabs */}
          <Box className="flex gap-2 mb-3 overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? undefined
                  : counts[tab.status as string] ?? 0;
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#006AF5] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => handleFilterChange(tab.key)}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className="ml-1">({count})</span>
                  )}
                </button>
              );
            })}
          </Box>

          {/* Application List */}
          {appsLoading && items.length === 0 ? (
            <Box className="flex justify-center py-8">
              <Spinner visible />
            </Box>
          ) : items.length === 0 ? (
            <EmptyState message="Không có đơn nghỉ nào" />
          ) : (
            <Box className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => navigate(`/leave/${item.id}`)}
                >
                  <Box className="bg-white rounded-xl p-3 shadow-sm">
                    <Box className="flex items-start justify-between mb-1">
                      <Text size="small" className="font-medium text-gray-900">
                        {formatDateRange(item.from_date, item.to_date)}
                      </Text>
                      <StatusBadge status={item.status} label={item.status_label} />
                    </Box>
                    <Box className="flex items-center gap-2">
                      <Text size="xSmall" className="text-gray-600">
                        {item.leave_type_label}
                      </Text>
                      <Text size="xSmall" className="text-gray-400">
                        · {formatDecimal(item.days)} ngày
                      </Text>
                    </Box>
                    {item.needs_documents && (
                      <Text size="xxSmall" className="text-orange-600 font-medium mt-1">
                        Cần bổ sung giấy tờ
                      </Text>
                    )}
                  </Box>
                </button>
              ))}

              {/* Load More */}
              {appData?.has_more && (
                <Box className="flex justify-center pt-2">
                  <Button
                    size="small"
                    variant="tertiary"
                    loading={loadingMore}
                    onClick={handleLoadMore}
                  >
                    Xem thêm
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </PullToRefresh>

      {/* FAB */}
      {canCreate && (
        <button
          type="button"
          className="fixed bottom-20 right-4 z-50 bg-[#006AF5] text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 active:bg-blue-700"
          onClick={() => navigate("/leave/create")}
        >
          <Icon icon="zi-add-story" size={20} />
          <span className="text-sm font-medium">Tạo đơn nghỉ</span>
        </button>
      )}

      <BottomNav />
    </Page>
  );
};

export default LeavePage;
