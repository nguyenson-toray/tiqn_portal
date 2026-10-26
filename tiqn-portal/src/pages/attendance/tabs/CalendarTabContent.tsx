import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { Box, Text, Spinner } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { AttendanceCalendarData, AttendanceDisplay, CalendarDay } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { calendarCacheAtom } from "@/store/data";
import { formatDateShort, formatTime, formatDecimal } from "@/utils/format";
import ErrorState from "@/components/ErrorState";

const WEEKDAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const DISPLAY_COLORS: Record<AttendanceDisplay, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE_EARLY: "bg-orange-100 text-orange-700",
  LEAVE: "bg-purple-100 text-purple-700",
  HALF_LEAVE: "bg-purple-50 text-purple-600",
  ABSENT: "bg-red-100 text-red-700",
  HOLIDAY: "bg-blue-100 text-blue-700",
  DAY_OFF: "bg-gray-100 text-gray-400",
  NO_DATA: "bg-gray-50 text-gray-300",
  TODAY: "bg-white text-gray-900 ring-2 ring-blue-500 font-bold",
  FUTURE: "bg-gray-50/50 text-gray-300",
};

const LEGEND = [
  { label: "Có mặt", color: "bg-green-100" },
  { label: "Đi muộn/về sớm", color: "bg-orange-100" },
  { label: "Nghỉ phép", color: "bg-purple-100" },
  { label: "Ngày lễ", color: "bg-blue-100" },
];

function parseMonth(monthStr: string): { year: number; month: number } {
  const [y, m] = monthStr.split("-").map(Number);
  return { year: y, month: m };
}

function shiftMonth(monthStr: string, delta: number): string {
  const { year, month } = parseMonth(monthStr);
  const d = new Date(year, month - 1 + delta, 1);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${m}`;
}

function buildCalendarGrid(days: CalendarDay[], monthStr: string): (CalendarDay | null)[][] {
  const { year, month } = parseMonth(monthStr);
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const cells: (CalendarDay | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (const day of days) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

interface CalendarTabContentProps {
  registerRefresh?: (fn: () => Promise<void>) => void;
}

const CalendarTabContent: React.FC<CalendarTabContentProps> = ({ registerRefresh }) => {
  const navigate = useNavigate();
  const [cache, setCache] = useAtom(calendarCacheAtom);

  const [month, setMonth] = useState(() => cache?.month || getCurrentMonth());
  const [data, setData] = useState<AttendanceCalendarData | null>(cache?.data ?? null);

  const { run: fetchCalendar, loading, error } = useAsyncAction(api.getAttendanceCalendar);

  const loadData = useCallback(
    async (m: string) => {
      const result = await fetchCalendar({ month: m });
      if (result) {
        setData(result);
        setCache({ month: m, data: result });
      }
    },
    [fetchCalendar, setCache],
  );

  // Register refresh callback for parent PullToRefresh
  useEffect(() => {
    registerRefresh?.(() => loadData(month));
  }, [registerRefresh, loadData, month]);

  // Load only if no cache
  useEffect(() => {
    if (!cache) loadData(month);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevMonth = () => {
    const newMonth = shiftMonth(month, -1);
    setMonth(newMonth);
    loadData(newMonth);
  };
  const handleNextMonth = () => {
    if (month >= getCurrentMonth()) return; // block future
    const newMonth = shiftMonth(month, 1);
    setMonth(newMonth);
    loadData(newMonth);
  };

  const weeks = useMemo(() => {
    if (!data) return [];
    return buildCalendarGrid(data.days, data.month);
  }, [data]);

  const { year: displayYear, month: displayMonth } = parseMonth(month);
  const isCurrentOrFuture = month >= getCurrentMonth();

  if (loading && !data) {
    return (
      <Box className="flex-1 flex items-center justify-center py-12">
        <Spinner visible />
      </Box>
    );
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => loadData(month)} />;
  }

  const summary = data?.summary;
  const otSummary = data?.overtime_summary;
  const today = data?.today;

  return (
    <>
      {/* Month Selector */}
      <Box className="flex items-center justify-center gap-4">
        <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 active:bg-blue-100" aria-label="Tháng trước" onClick={handlePrevMonth}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <Text className="font-semibold text-gray-900 min-w-[120px] text-center">
          Tháng {String(displayMonth).padStart(2, "0")}/{displayYear}
        </Text>
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded-full ${isCurrentOrFuture ? "bg-gray-100 opacity-40" : "bg-blue-50 active:bg-blue-100"}`}
          onClick={handleNextMonth}
          disabled={isCurrentOrFuture}
          aria-label="Tháng sau"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isCurrentOrFuture ? "#9ca3af" : "#006AF5"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </Box>

      {/* Summary Row */}
      {summary && (
        <Box className="bg-white rounded-xl px-3 py-2 shadow-sm">
          <Box className="flex justify-between">
            <Box className="text-center">
              <Text size="small" className="font-semibold text-green-600">{summary.present}</Text>
              <Text size="xxSmall" className="text-gray-500">Có mặt</Text>
            </Box>
            <Box className="text-center">
              <Text size="small" className="font-semibold text-purple-600">{summary.leave}</Text>
              <Text size="xxSmall" className="text-gray-500">Nghỉ phép</Text>
            </Box>
            <Box className="text-center">
              <Text size="small" className="font-semibold text-red-600">{summary.absent}</Text>
              <Text size="xxSmall" className="text-gray-500">Vắng</Text>
            </Box>
            <Box className="text-center">
              <Text size="small" className="font-semibold text-orange-600">{summary.late_early}</Text>
              <Text size="xxSmall" className="text-gray-500">Đi muộn</Text>
            </Box>
          </Box>
          {/* Overtime summary */}
          {otSummary && (
            <Box className="flex justify-between border-t border-gray-100 mt-2 pt-2">
              <Box className="text-center flex-1">
                <Text size="small" className="font-semibold text-cyan-600">{formatDecimal(otSummary.actual_hours)}</Text>
                <Text size="xxSmall" className="text-gray-500">Tăng ca (giờ)</Text>
              </Box>
              <Box className="text-center flex-1">
                <Text size="small" className="font-semibold text-green-600">{formatDecimal(otSummary.approved_hours)}</Text>
                <Text size="xxSmall" className="text-gray-500">Đã duyệt (giờ)</Text>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Calendar Grid */}
      <Box className="bg-white rounded-xl p-3 shadow-sm">
        <Box className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_HEADERS.map((wd) => (
            <Text key={wd} size="xxSmall" className="text-center text-gray-400 font-medium py-1">{wd}</Text>
          ))}
        </Box>
        {weeks.map((week, wi) => (
          <Box key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <Box key={di} className="aspect-square" />;
              const dayNum = day.date.split("-")[2];
              const colorClass = DISPLAY_COLORS[day.display] || "bg-gray-50 text-gray-400";
              return (
                <button
                  key={day.date}
                  type="button"
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${colorClass}`}
                  onClick={() => navigate(`/attendance/day/${day.date}`)}
                >
                  <span>{parseInt(dayNum, 10)}</span>
                  {day.display === "NO_DATA" && <span className="text-[8px]">?</span>}
                  {day.leave_abbr && <span className="text-[8px] leading-none">{day.leave_abbr}</span>}
                  {day.has_explanation && <span className="text-[6px] text-blue-500 leading-none">GT</span>}
                  {day.overtime_hours != null && day.overtime_hours > 0 && <span className="text-[6px] text-cyan-600 leading-none font-semibold">TC</span>}
                </button>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Today Info */}
      {today && (
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Text size="small" className="text-gray-500 mb-2">
            Hôm nay · {formatDateShort(today.date)}
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
        </Box>
      )}

      {/* Hint */}
      <Text size="xxSmall" className="text-gray-400 text-center">
        Bấm vào từng ngày để xem chi tiết chấm công & tăng ca
      </Text>

      {/* Legend */}
      <Box className="flex flex-wrap gap-3 justify-center">
        {LEGEND.map((item) => (
          <Box key={item.label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded ${item.color}`} />
            <Text size="xxSmall" className="text-gray-500">{item.label}</Text>
          </Box>
        ))}
        <Box className="flex items-center gap-1.5">
          <Text size="xxSmall" className="text-cyan-600 font-semibold">TC</Text>
          <Text size="xxSmall" className="text-gray-500">Tăng ca</Text>
        </Box>
      </Box>
    </>
  );
};

export default CalendarTabContent;
