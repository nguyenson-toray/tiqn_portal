import React, { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { Page, Box, Text, Sheet, Button, Icon } from "zmp-ui";
import { openChat, followOA, getUserInfo, openWebview } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import { useAsyncAction } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useConfigRefresh } from "@/hooks/useConfigRefresh";
import { configAtom, employeeAtom, accessAtom, chatAtom, oaAtom, maskedPhoneAtom, isReadOnlyAtom } from "@/store/auth";
import { homeDataAtom, allDataAtoms, viewedPayslipPeriodsAtom } from "@/store/data";
import { clearPayslipCache } from "@/utils/payslipCache";
import { formatDate, formatDateShort, formatTime, formatDecimal } from "@/utils/format";
import BottomNav from "@/components/BottomNav";
import EmployeeAvatar from "@/components/EmployeeAvatar";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import ErrorState from "@/components/ErrorState";
import AppHeader from "@/components/AppHeader";
import { HomeSkeleton } from "@/components/Skeleton";

const STATE_COLORS: Record<string, string> = {
  WORKING: "text-green-600",
  DONE: "text-green-600",
  ON_LEAVE: "text-orange-500",
  NOT_CHECKED_IN: "text-gray-500",
  HOLIDAY: "text-blue-500",
  DAY_OFF: "text-blue-500",
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const employee = useAtomValue(employeeAtom);
  const access = useAtomValue(accessAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);
  const setChat = useSetAtom(chatAtom);
  const [oa, setOa] = useAtom(oaAtom);
  const maskedPhone = useAtomValue(maskedPhoneAtom);
  const { clearSession } = useAuth();
  const features = config?.features;
  const store = useStore();
  const needIdByOaSentRef = useRef(false);

  useConfigRefresh();

  const [home, setHome] = useAtom(homeDataAtom);
  const [followingOA, setFollowingOA] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const emp = home?.employee || employee;

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try { await api.logout(); } catch { /* ignore */ }
    await clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);
  const { run: fetchHome, loading, error } = useAsyncAction(api.getHome);

  const loadData = useCallback(async () => {
    const data = await fetchHome();
    if (data) {
      setHome(data);
      setChat(data.chat ?? null);
      setOa(data.oa);
      // Once per app open: sync OA follow status + id_by_oa
      if (!needIdByOaSentRef.current) {
        needIdByOaSentRef.current = true;
        try {
          const userInfo = await getUserInfo({});
          const ui = userInfo.userInfo as any;
          const followedOA = ui?.followedOA as boolean | undefined;
          const idByOA = ui?.idByOA as string | undefined;

          // Send idByOA if backend needs it
          if (idByOA && data.oa?.need_id_by_oa) {
            api.setIdByOA(idByOA).catch(() => {});
          }

          // Sync OA follow status: compare followedOA with oa.followed
          if (followedOA != null && followedOA !== data.oa?.followed) {
            try {
              const oaResult = followedOA
                ? await api.setOAFollow("FOLLOWED", idByOA || undefined)
                : await api.setOAFollow("UNFOLLOWED");
              setOa(oaResult);
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
    }
  }, [fetchHome, setHome, setChat, setOa]);

  useEffect(() => {
    if (!home) loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFollowOA = useCallback(async () => {
    const oaId = oa?.oa_id || config?.oa.oa_id;
    if (!oaId) return;
    setFollowingOA(true);
    try {
      // followOA resolves AFTER user taps "Quan tâm" on Zalo native dialog
      await followOA({ id: oaId });

      // Try getUserInfo up to 3 times to get idByOA (Zalo may need time to propagate)
      let idByOA: string | undefined;
      const delays = [0, 2000, 3000];
      for (let i = 0; i < delays.length; i++) {
        if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
        try {
          const ui = (await getUserInfo({})).userInfo as any;
          idByOA = ui?.idByOA as string | undefined;
          if (idByOA) break;
        } catch { /* ignore */ }
      }

      // Send follow status + idByOA (if available) to backend
      try {
        const oaResult = await api.setOAFollow("FOLLOWED", idByOA || undefined);
        setOa(oaResult);
      } catch { /* ignore */ }

      // Send idByOA separately if backend needs it
      if (idByOA) {
        api.setIdByOA(idByOA).catch(() => {});
      }
    } catch { /* user cancelled (code -201) */ }
    setFollowingOA(false);
  }, [oa, config, setOa]);

  const homeChat = home?.chat;
  const handleChat = useCallback(() => {
    if (!homeChat || isReadOnly) return;
    const msg = homeChat.message || undefined;
    openChat({ type: homeChat.type, id: homeChat.id, ...(msg ? { message: msg } : {}) });
  }, [homeChat, isReadOnly]);

  const [refreshing, setRefreshing] = useState(false);
  const lastRefreshRef = useRef(0);
  const REFRESH_COOLDOWN = 10_000; // 10 seconds

  const handleRefreshAll = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN) return;
    lastRefreshRef.current = now;
    setRefreshing(true);
    try {
      // Clear all in-memory data caches
      for (const a of allDataAtoms) {
        store.set(a, null as any);
      }
      // Reset viewedPayslipPeriods to empty Set (not null — it's a Set<string>)
      store.set(viewedPayslipPeriodsAtom, new Set<string>());
      // Clear persisted payslip cache
      await clearPayslipCache();
      // Re-fetch home data
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [store, loadData]);

  if (loading && !home) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Trang chủ" />
        <HomeSkeleton />
        <BottomNav />
      </Page>
    );
  }

  if (error && !home) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <ErrorState message={error} onRetry={loadData} />
        <BottomNav />
      </Page>
    );
  }

  const acc = home?.access || access;
  const today = home?.today;
  const unread = home?.notifications?.unread || 0;
  const latestNotif = home?.notifications?.latest;
  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      {/* Header with employee info */}
      <AppHeader title="">
        {emp ? (
          <Box className="flex items-center gap-3">
            <button type="button" onClick={() => setShowAccount(!showAccount)} className="flex-shrink-0">
              <EmployeeAvatar initials={emp.initials} avatarUrl={emp.avatar_url} size={44} />
            </button>
            <Box className="flex-1 min-w-0">
              <Text className="font-bold text-white truncate leading-tight">
                {emp.full_name}
              </Text>
              <Text size="xxSmall" className="text-white/70 truncate leading-tight mt-0.5">
                {emp.employee_id}{emp.section ? ` · ${emp.section}` : ""}{emp.group ? ` · ${emp.group}` : ""}
              </Text>
            </Box>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20"
              onClick={() => setShowAccount(!showAccount)}
              aria-label="Tài khoản"
            >
              <Icon icon="zi-user-circle" size={24} className="text-white" />
            </button>
          </Box>
        ) : (
          <Text className="font-semibold text-lg text-white">Trang chủ</Text>
        )}
      </AppHeader>

      {/* Account bottom sheet */}
      <Sheet
        visible={showAccount}
        onClose={() => setShowAccount(false)}
        autoHeight
        title="Tài khoản"
      >
        {emp && (
          <Box className="px-4 pb-6 space-y-3">
            {/* Employee header */}
            <Box className="flex items-center gap-3 pb-2">
              <EmployeeAvatar initials={emp.initials} avatarUrl={emp.avatar_url} size={48} />
              <Box className="flex-1 min-w-0">
                <Text className="font-bold text-gray-900 truncate">{emp.full_name}</Text>
                <Text size="xSmall" className="text-gray-500 truncate">
                  {emp.employee_id}{emp.section ? ` · ${emp.section}` : ""}
                </Text>
              </Box>
            </Box>

            {/* Info rows */}
            <Box className="bg-gray-50 rounded-xl divide-y divide-gray-100">
              <Box className="flex items-center justify-between px-4 py-2.5">
                <Text size="xSmall" className="text-gray-500">Chức vụ</Text>
                <Text size="xSmall" className="font-medium text-gray-900 text-right">
                  {emp.designation}{emp.group ? ` · ${emp.group}` : ""}
                </Text>
              </Box>
              <Box className="flex items-center justify-between px-4 py-2.5">
                <Text size="xSmall" className="text-gray-500">SĐT đăng nhập</Text>
                <Text size="xSmall" className="font-medium text-gray-900">{maskedPhone || ""}</Text>
              </Box>
              {emp.date_of_joining && (
                <Box className="flex items-center justify-between px-4 py-2.5">
                  <Text size="xSmall" className="text-gray-500">Ngày vào làm</Text>
                  <Text size="xSmall" className="font-medium text-gray-900">{formatDate(emp.date_of_joining)}</Text>
                </Box>
              )}
            </Box>

            {/* Legal links */}
            <Box className="flex gap-3 justify-center">
              {config?.legal.privacy_policy_url && (
                <button
                  type="button"
                  className="text-xs text-[#006AF5] underline"
                  onClick={() => openWebview({ url: config.legal.privacy_policy_url })}
                >
                  Chính sách dữ liệu
                </button>
              )}
              {config?.legal.terms_url && (
                <button
                  type="button"
                  className="text-xs text-[#006AF5] underline"
                  onClick={() => openWebview({ url: config.legal.terms_url })}
                >
                  Điều khoản
                </button>
              )}
            </Box>

            {/* Logout */}
            <Button
              fullWidth
              variant="secondary"
              loading={loggingOut}
              disabled={loggingOut}
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>

            <Text size="xxSmall" className="text-gray-400 text-center">
              Phiên bản 1.0.0 · Nhóm IT - TIQN
            </Text>
          </Box>
        )}
      </Sheet>

      {isReadOnly && <ReadOnlyBanner />}

      <div className="flex-1 overflow-auto px-4 pt-3 pb-20 space-y-3">
        {/* Read-only notice */}
        {acc?.mode === "READ_ONLY" && acc.read_only_until && (
          <Box className="bg-amber-50 rounded-xl px-4 py-2.5">
            <Text size="xxSmall" className="text-amber-700">
              Chỉ xem đến {formatDate(acc.read_only_until)}
            </Text>
          </Box>
        )}

        {/* HR Notice */}
        {home?.notice && (
          <Box className="bg-amber-50 border-l-4 border-amber-400 rounded-xl px-4 py-3 flex gap-3">
            <Text className="text-amber-600 text-base leading-none mt-0.5">⚠</Text>
            <Text size="small" className="text-amber-800 whitespace-pre-line flex-1">
              {home.notice}
            </Text>
          </Box>
        )}

        {/* OA Status + Follow */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <Icon icon="zi-chat" size={18} className={oa?.followed ? "text-green-600" : "text-gray-400"} />
              <Text size="small" className={oa?.followed ? "text-green-600 font-medium" : "text-gray-500"}>
                {oa?.followed ? "Đã quan tâm OA" : "Chưa quan tâm OA"}
              </Text>
            </Box>
            {!oa?.followed && (
              <Button
                size="small"
                variant="secondary"
                loading={followingOA}
                disabled={followingOA}
                onClick={handleFollowOA}
              >
                Quan tâm OA
              </Button>
            )}
          </Box>
          {!oa?.followed && oa?.intro && (
            <Text size="xxSmall" className="text-gray-400 mt-2 whitespace-pre-line">
              {oa.intro}
            </Text>
          )}
        </Box>

        {/* Chat with C&B */}
        {homeChat && !isReadOnly && (
          <button
            type="button"
            className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            onClick={handleChat}
          >
            <Box className="flex items-center gap-3">
              <Box className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon icon="zi-chat" size={20} className="text-[#006AF5]" />
              </Box>
              <Box className="flex-1 min-w-0">
                <Text size="small" className="font-medium text-[#006AF5]">
                  {homeChat.label || "Chat với nhân viên phụ trách công, lương"}
                </Text>
                {homeChat.name && (
                  <Text size="xxSmall" className="text-gray-400 truncate">
                    {homeChat.name}
                  </Text>
                )}
              </Box>
              <Icon icon="zi-chevron-right" size={16} className="text-gray-400" />
            </Box>
          </button>
        )}

        {/* Refresh all data */}
        <Button
          fullWidth
          variant="tertiary"
          size="small"
          loading={refreshing}
          disabled={refreshing}
          prefixIcon={<Icon icon="zi-retry" size={16} />}
          onClick={handleRefreshAll}
        >
          {refreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
        </Button>

        {/* Latest Payslip Card */}
        {features?.payslip && (
          <button
            type="button"
            className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            onClick={() => {
              if (home?.latest_payslip) {
                navigate(`/payslip/${home.latest_payslip.period}`, {
                  state: {
                    published_on: home.latest_payslip.published_at,
                    content_version: home.latest_payslip.content_version,
                  },
                });
              } else {
                navigate("/payslip");
              }
            }}
          >
            <Box className="flex items-center justify-between">
              <Text size="xSmall" className="text-gray-500 font-medium">Phiếu lương</Text>
              <Icon icon="zi-chevron-right" size={16} className="text-gray-400" />
            </Box>
            {home?.latest_payslip ? (
              <Box className="mt-1">
                <Text className="font-semibold text-gray-900">
                  {home.latest_payslip.label}
                </Text>
                <Text size="xxSmall" className="text-gray-400 mt-0.5">
                  Phát hành {formatDateShort(home.latest_payslip.published_on)}
                </Text>
              </Box>
            ) : (
              <Text size="small" className="text-gray-400 mt-1">
                Chưa có phiếu lương
              </Text>
            )}
          </button>
        )}

        {/* Today's Attendance */}
        {features?.attendance && today && (
          <button
            type="button"
            className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            onClick={() => navigate(`/attendance/day/${today.date}`)}
          >
            <Text size="small" className="text-gray-500 mb-2">
              Hôm nay · {today.weekday_label}, {formatDateShort(today.date)}
            </Text>
            <Text className={`font-semibold mb-3 ${STATE_COLORS[today.state] || "text-gray-700"}`}>
              {today.state_label}
            </Text>
            <Box className="flex gap-6">
              <Box>
                <Text size="xxSmall" className="text-gray-400 uppercase tracking-wide">Giờ vào</Text>
                <Text className="font-semibold text-gray-900 text-lg">
                  {today.check_in ? formatTime(today.check_in) : "--:--"}
                </Text>
              </Box>
              <Box>
                <Text size="xxSmall" className="text-gray-400 uppercase tracking-wide">Giờ ra</Text>
                <Text className="font-semibold text-gray-900 text-lg">
                  {today.check_out ? formatTime(today.check_out) : "--:--"}
                </Text>
              </Box>
            </Box>
            {today.shift && (
              <Text size="xSmall" className="text-gray-400 mt-2">
                {today.shift.label}: {today.shift.start} - {today.shift.end}
              </Text>
            )}
          </button>
        )}

        {/* Quick Stats Grid */}
        {(features?.leave_view || features?.attendance || features?.overtime) && (
          <Box className="grid grid-cols-2 gap-3">
            {features?.leave_view && home?.annual_leave && (
              <button
                type="button"
                className="w-full text-left bg-white rounded-xl p-3 shadow-sm active:bg-gray-50"
                onClick={() => navigate("/leave")}
              >
                <Text size="xxSmall" className="text-gray-500 mb-1">Phép năm còn lại</Text>
                <Text className="font-bold text-lg text-[#006AF5]">
                  {formatDecimal(home.annual_leave.remaining)}{" "}
                  <Text size="xSmall" className="font-normal text-gray-500" style={{ display: "inline" }}>ngày</Text>
                </Text>
              </button>
            )}

            {features?.attendance && home?.attendance && (
              <button
                type="button"
                className="w-full text-left bg-white rounded-xl p-3 shadow-sm active:bg-gray-50"
                onClick={() => navigate("/attendance")}
              >
                <Text size="xxSmall" className="text-gray-500 mb-1">
                  Công tháng {home.attendance.period.split("-")[1]}
                </Text>
                <Text className="font-bold text-lg text-gray-900">
                  {formatDecimal(home.attendance.payable_days)}{" "}
                  <Text size="xSmall" className="font-normal text-gray-500" style={{ display: "inline" }}>
                    / {formatDecimal(home.attendance.standard_days)}
                  </Text>
                </Text>
              </button>
            )}

            {features?.overtime && home?.overtime && (
              <button
                type="button"
                className="w-full text-left bg-white rounded-xl p-3 shadow-sm active:bg-gray-50"
                onClick={() => navigate("/attendance")}
              >
                <Text size="xxSmall" className="text-gray-500 mb-1">
                  Tăng ca T{home.overtime.period.split("-")[1]}
                </Text>
                <Text className="font-bold text-lg text-green-600">
                  {formatDecimal(home.overtime.hours)}{" "}
                  <Text size="xSmall" className="font-normal text-gray-500" style={{ display: "inline" }}>giờ</Text>
                </Text>
              </button>
            )}
          </Box>
        )}

        {/* Notifications */}
        {features?.notifications && latestNotif && (
          <button
            type="button"
            className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            onClick={() => navigate("/notifications")}
          >
            <Box className="flex items-center justify-between mb-2">
              <Text size="xSmall" className="text-gray-500 font-medium">Thông báo</Text>
              {unread > 0 && (
                <span className="min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </Box>
            <Text size="small" className="font-medium text-gray-900 line-clamp-1">
              {latestNotif.title}
            </Text>
            <Text size="xSmall" className="text-gray-500 line-clamp-1 mt-0.5">
              {latestNotif.body}
            </Text>
          </button>
        )}

      </div>

      <BottomNav />
    </Page>
  );
};

export default HomePage;
