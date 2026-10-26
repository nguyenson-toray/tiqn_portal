import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useSetAtom } from "jotai";
import { Page, Box, Text, Button } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { NotificationItem } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { notificationsCacheAtom, homeDataAtom } from "@/store/data";
import { formatDateTimeShort } from "@/utils/format";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import AppHeader from "@/components/AppHeader";
import { Skeleton } from "@/components/Skeleton";
import PullToRefresh from "@/components/PullToRefresh";
import BottomNav from "@/components/BottomNav";

const PAGE_SIZE = 20;

function navigateByTarget(
  target: { screen: string; id: string | null },
  navigate: (path: string) => void,
) {
  switch (target.screen) {
    case "PAYSLIP":
      if (target.id) navigate(`/payslip/${target.id}`);
      break;
    case "LEAVE":
      if (target.id) navigate(`/leave/${target.id}`);
      break;
    case "EXPLANATION":
      if (target.id) navigate(`/attendance/explanation/${target.id}`);
      break;
    case "OVERTIME":
      navigate("/attendance/overtime");
      break;
    default:
      break;
  }
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [cache, setCache] = useAtom(notificationsCacheAtom);
  const setHome = useSetAtom(homeDataAtom);

  const [items, setItems] = useState<NotificationItem[]>(cache?.items ?? []);
  const [hasMore, setHasMore] = useState(cache?.hasMore ?? false);
  const [page, setPage] = useState(1);
  const [initialLoaded, setInitialLoaded] = useState(!!cache);

  const { run: fetchNotifications, loading, error } = useAsyncAction(api.getNotifications);
  const { run: markRead } = useAsyncAction(api.markNotificationsRead);
  const loadingMoreRef = useRef(false);

  const loadData = useCallback(
    async (pageNum: number, append = false) => {
      const data = await fetchNotifications({ page: pageNum, page_size: PAGE_SIZE });
      if (data) {
        const newItems = append ? [...items, ...data.items] : data.items;
        setItems(newItems);
        setHasMore(data.has_more);
        setPage(pageNum);
        setInitialLoaded(true);
        setCache({ items: newItems, hasMore: data.has_more, unread: data.unread });
      }
      loadingMoreRef.current = false;
    },
    [fetchNotifications, items, setCache],
  );

  // Load only once on first mount (if no cached data)
  useEffect(() => {
    if (!cache) loadData(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(async () => {
    setPage(1);
    const data = await fetchNotifications({ page: 1, page_size: PAGE_SIZE });
    if (data) {
      setItems(data.items);
      setHasMore(data.has_more);
      setInitialLoaded(true);
      setCache({ items: data.items, hasMore: data.has_more, unread: data.unread });
    }
  }, [fetchNotifications, setCache]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    loadData(page + 1, true);
  }, [hasMore, page, loadData]);

  /** Sync unread count to homeDataAtom so HomePage badge updates */
  const syncUnreadToHome = (count: number) => {
    setHome((prev) => {
      if (!prev?.notifications) return prev;
      return { ...prev, notifications: { ...prev.notifications, unread: count } };
    });
  };

  const handleMarkAllRead = async () => {
    const result = await markRead({ all: 1 });
    if (result) {
      const updated = items.map((item) => ({ ...item, is_read: true }));
      setItems(updated);
      setCache({ items: updated, hasMore, unread: 0 });
      syncUnreadToHome(0);
    }
  };

  const handleTapItem = async (item: NotificationItem) => {
    if (!item.is_read) {
      const updated = items.map((n) => (n.id === item.id ? { ...n, is_read: true } : n));
      setItems(updated);
      const newUnread = Math.max(0, (cache?.unread ?? 1) - 1);
      setCache((prev) => prev ? { ...prev, items: updated, unread: newUnread } : prev);
      syncUnreadToHome(newUnread);
      markRead({ ids: [item.id] });
    }
    navigateByTarget(item.target, navigate);
  };

  const unreadItems = items.filter((n) => !n.is_read);
  const readItems = items.filter((n) => n.is_read);
  const hasUnread = unreadItems.length > 0;

  if (error && !initialLoaded) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Thông báo" />
        <ErrorState message={error} onRetry={() => loadData(1)} />
        <BottomNav />
      </Page>
    );
  }

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Thông báo" />

      {loading && !initialLoaded ? (
        <Box className="px-4 pt-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-20" />
            </Box>
          ))}
        </Box>
      ) : items.length === 0 ? (
        <EmptyState message="Không có thông báo" />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-4 pt-3 pb-20 space-y-3">
          {/* Mark all read */}
          {hasUnread && (
            <Box className="flex justify-end">
              <Button
                variant="tertiary"
                size="small"
                onClick={handleMarkAllRead}
              >
                Đánh dấu đã đọc
              </Button>
            </Box>
          )}

          {/* Unread */}
          {unreadItems.length > 0 && (
            <Box className="space-y-2">
              <Text size="xSmall" className="font-semibold text-gray-500 uppercase tracking-wide">
                Chưa đọc
              </Text>
              {unreadItems.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onClick={() => handleTapItem(item)}
                />
              ))}
            </Box>
          )}

          {/* Read */}
          {readItems.length > 0 && (
            <Box className="space-y-2">
              <Text size="xSmall" className="font-semibold text-gray-500 uppercase tracking-wide">
                Trước đó
              </Text>
              {readItems.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onClick={() => handleTapItem(item)}
                />
              ))}
            </Box>
          )}

          {hasMore && (
            <Box className="flex justify-center py-2">
              <Button
                variant="tertiary"
                size="small"
                loading={loading}
                onClick={handleLoadMore}
              >
                Xem thêm
              </Button>
            </Box>
          )}
        </PullToRefresh>
      )}

      <BottomNav />
    </Page>
  );
};

interface NotificationRowProps {
  item: NotificationItem;
  onClick: () => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ item, onClick }) => (
  <button
    type="button"
    className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
    onClick={onClick}
  >
    <Box className="flex items-start gap-2">
      {!item.is_read && (
        <span className="w-2 h-2 rounded-full bg-[#006AF5] mt-1.5 flex-shrink-0" />
      )}
      <Box className="flex-1 min-w-0">
        <Text
          size="small"
          className={`line-clamp-1 ${!item.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
        >
          {item.title}
        </Text>
        <Text size="xSmall" className="text-gray-500 line-clamp-2 mt-0.5">
          {item.body}
        </Text>
        <Text size="xxSmall" className="text-gray-400 mt-1">
          {formatDateTimeShort(item.created_at)}
        </Text>
      </Box>
    </Box>
  </button>
);

export default NotificationsPage;
