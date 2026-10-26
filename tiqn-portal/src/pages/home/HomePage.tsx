import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Page, Box, Text, Spinner } from "zmp-ui";

import * as api from "@/api/endpoints";
import { useAsyncAction } from "@/hooks/useApi";
import { useConfigRefresh } from "@/hooks/useConfigRefresh";
import { configAtom, employeeAtom, accessAtom, chatAtom, isReadOnlyAtom } from "@/store/auth";
import { homeDataAtom } from "@/store/data";
import { formatDate, formatDateShort, formatTime, formatDecimal } from "@/utils/format";
import BottomNav from "@/components/BottomNav";
import EmployeeAvatar from "@/components/EmployeeAvatar";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import ErrorState from "@/components/ErrorState";
import AppHeader from "@/components/AppHeader";
import PullToRefresh from "@/components/PullToRefresh";

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
  const features = config?.features;

  useConfigRefresh();

  const [home, setHome] = useAtom(homeDataAtom);
  const { run: fetchHome, loading, error } = useAsyncAction(api.getHome);

  const loadData = useCallback(async () => {
    const data = await fetchHome();
    if (data) {
      setHome(data);
      setChat(data.chat ?? null);
    }
  }, [fetchHome, setHome, setChat]);

  useEffect(() => {
    if (!home) loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  if (loading && !home) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
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

  const emp = home?.employee || employee;
  const acc = home?.access || access;
  const today = home?.today;
  const unread = home?.notifications?.unread || 0;
  const latestNotif = home?.notifications?.latest;
  const oa = home?.oa;
  const showOABanner = oa?.show_invite && !isReadOnly;

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Trang chủ" />

      {isReadOnly && <ReadOnlyBanner />}

      <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-4 pt-3 pb-20 space-y-3">
        {/* Employee Card */}
        {emp && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Box className="flex items-center gap-3">
              <EmployeeAvatar
                initials={emp.initials}
                avatarUrl={emp.avatar_url}
                size={56}
              />
              <Box className="flex-1 min-w-0">
                <Text className="font-bold text-lg text-gray-900 truncate leading-tight">
                  {emp.full_name}
                </Text>
                <Text size="xSmall" className="text-gray-500 truncate leading-tight mt-0.5">
                  {emp.employee_id}
                </Text>
              </Box>
            </Box>
            <Box className="mt-3 space-y-1">
              {emp.section && (
                <Text size="xSmall" className="text-gray-500">
                  {emp.section}{emp.group ? ` · ${emp.group}` : ""}
                </Text>
              )}
              {!emp.section && emp.group && (
                <Text size="xSmall" className="text-gray-500">{emp.group}</Text>
              )}
              {emp.date_of_joining && (
                <Text size="xSmall" className="text-gray-400">
                  Ngày vào làm: {formatDate(emp.date_of_joining)}
                </Text>
              )}
            </Box>
            {acc?.mode === "READ_ONLY" && acc.read_only_until && (
              <Box className="mt-2 bg-amber-50 rounded-lg px-3 py-1.5">
                <Text size="xxSmall" className="text-amber-700">
                  Chỉ xem đến {formatDate(acc.read_only_until)}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* OA Banner */}
        {showOABanner && (
          <button
            type="button"
            className="w-full text-left"
            onClick={() => navigate("/oa-invite")}
          >
            <Box className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <Text size="xSmall" className="text-blue-700 flex-1">
                Quan tâm OA để nhận tin
              </Text>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Box>
          </button>
        )}

        {/* Latest Payslip Card */}
        {features?.payslip && (
          <button
            type="button"
            className="w-full text-left bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
            onClick={() => {
              if (home?.latest_payslip) {
                navigate(`/payslip/${home.latest_payslip.period}`, {
                  state: { published_on: home.latest_payslip.published_at },
                });
              } else {
                navigate("/payslip");
              }
            }}
          >
            <Box className="flex items-center justify-between">
              <Text size="xSmall" className="text-gray-500 font-medium">Phiếu lương</Text>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
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
      </PullToRefresh>

      <BottomNav />
    </Page>
  );
};

export default HomePage;
