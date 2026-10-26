import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Spinner, Button } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { AttendanceDayData, Punch } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { isReadOnlyAtom } from "@/store/auth";
import { formatDateShort, formatTime, formatDecimal } from "@/utils/format";
import ErrorState from "@/components/ErrorState";
import StatusBadge from "@/components/StatusBadge";
import AppHeader from "@/components/AppHeader";

const DISPLAY_COLORS: Record<string, string> = {
  PRESENT: "text-green-600",
  LATE_EARLY: "text-orange-600",
  LEAVE: "text-purple-600",
  HALF_LEAVE: "text-purple-600",
  ABSENT: "text-red-600",
  HOLIDAY: "text-[#006AF5]",
  DAY_OFF: "text-gray-500",
};

/** Check if device_name indicates a manual/HR-added record (forgot to check in) */
function isManualPunch(punch: Punch | undefined): boolean {
  if (!punch) return false;
  return !punch.device_name || punch.device_name === "0";
}

const AttendanceDayPage: React.FC = () => {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  const [data, setData] = useState<AttendanceDayData | null>(null);
  const mountedRef = useRef(true);

  const { run: fetchDay, loading, error } = useAsyncAction(api.getAttendanceDay);

  const loadData = useCallback(async () => {
    if (!date) return;
    const result = await fetchDay(date);
    if (result && mountedRef.current) {
      setData(result);
    }
  }, [date, fetchDay]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  if (loading && !data) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Chi tiết ngày" showBack />
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
      </Page>
    );
  }

  if (error && !data) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Chi tiết ngày" showBack />
        <ErrorState message={error} onRetry={loadData} />
      </Page>
    );
  }

  if (!data || !date) return null;

  const statusColor = DISPLAY_COLORS[data.display] || "text-gray-600";
  const hasLateEarly = data.late_minutes > 0 || data.early_minutes > 0;

  // Find IN/OUT punches for device info
  const inPunch = data.punches.find((p) => p.direction === "IN");
  const outPunch = [...data.punches].reverse().find((p) => p.direction === "OUT");

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Chi tiết ngày" showBack />

      <Box className="flex-1 overflow-auto px-4 pt-3 pb-24 space-y-3">
        {/* Date + Status + Shift */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Text size="small" className="text-gray-400 mb-1">
            {data.weekday_label}, {formatDateShort(date)}
          </Text>
          <Text className={`font-semibold text-lg ${statusColor}`}>
            {data.status_label}
          </Text>
          {data.shift && (
            <Text size="xSmall" className="text-gray-500 mt-1">
              {data.shift.label} · {data.shift.start} – {data.shift.end}
            </Text>
          )}
        </Box>

        {/* Check-in / Check-out */}
        <Box className="grid grid-cols-2 gap-3">
          <Box className="bg-white rounded-xl p-3 shadow-sm text-center">
            <Text size="xxSmall" className="text-gray-400 uppercase tracking-wide">
              Vào
            </Text>
            <Text className="font-bold text-2xl text-gray-900 mt-1">
              {data.check_in ? formatTime(data.check_in) : "--:--"}
            </Text>
            {inPunch && (
              <Text size="xxSmall" className={`mt-1 ${isManualPunch(inPunch) ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                {isManualPunch(inPunch) ? "Quên chấm công" : inPunch.device_name}
              </Text>
            )}
            {hasLateEarly && data.late_minutes > 0 && (
              <Text size="xxSmall" className="text-orange-600 mt-0.5">
                Muộn {data.late_minutes} phút
              </Text>
            )}
          </Box>
          <Box className="bg-white rounded-xl p-3 shadow-sm text-center">
            <Text size="xxSmall" className="text-gray-400 uppercase tracking-wide">
              Ra
            </Text>
            <Text className="font-bold text-2xl text-gray-900 mt-1">
              {data.check_out ? formatTime(data.check_out) : "--:--"}
            </Text>
            {outPunch && (
              <Text size="xxSmall" className={`mt-1 ${isManualPunch(outPunch) ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                {isManualPunch(outPunch) ? "Quên chấm công" : outPunch.device_name}
              </Text>
            )}
            {hasLateEarly && data.early_minutes > 0 && (
              <Text size="xxSmall" className="text-orange-600 mt-0.5">
                Sớm {data.early_minutes} phút
              </Text>
            )}
          </Box>
        </Box>

        {/* Summary: working hours + overtime */}
        <Box className="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <Box className="flex items-center justify-between">
            <Text size="small" className="text-gray-500">Giờ làm</Text>
            <Text size="small" className="font-semibold text-gray-900">
              {data.working_hours_label}
            </Text>
          </Box>
          <Box className="flex items-center justify-between">
            <Text size="small" className="text-gray-500">Tăng ca thực tế</Text>
            <Text size="small" className={`font-semibold ${data.overtime_hours > 0 ? "text-cyan-600" : "text-gray-900"}`}>
              {data.overtime_hours > 0 ? formatDecimal(data.overtime_hours) : "0"} giờ
            </Text>
          </Box>
          {data.approved_overtime_hours != null && (
            <Box className="flex items-center justify-between">
              <Text size="small" className="text-gray-500">Tăng ca đã duyệt</Text>
              <Text size="small" className={`font-semibold ${data.approved_overtime_hours > 0 ? "text-green-600" : "text-gray-900"}`}>
                {data.approved_overtime_hours > 0 ? formatDecimal(data.approved_overtime_hours) : "0"} giờ
              </Text>
            </Box>
          )}
        </Box>

        {/* OT Registrations */}
        {data.overtime_registrations && data.overtime_registrations.length > 0 && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Text size="xSmall" className="font-semibold text-gray-500 mb-2">
              Phiếu đăng ký tăng ca
            </Text>
            <Box className="space-y-2">
              {data.overtime_registrations.map((reg) => (
                <Box key={reg.id} className="flex items-center justify-between">
                  <Box>
                    <Text size="small" className="text-gray-900">
                      {reg.begin} – {reg.end} · {formatDecimal(reg.hours)} giờ
                    </Text>
                    {reg.reason && (
                      <Text size="xxSmall" className="text-gray-400">{reg.reason}</Text>
                    )}
                  </Box>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    reg.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    reg.status === "DRAFT" ? "bg-gray-100 text-gray-600" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {reg.status_label}
                  </span>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Leave Info */}
        {data.leave && (
          <button
            type="button"
            className="w-full text-left"
            onClick={() => navigate(`/leave/${data.leave!.application_id}`)}
          >
            <Box className="bg-purple-50 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <Text size="small" className="text-purple-700 font-medium">
                {data.leave.leave_type_label}
                {data.leave.half_day ? " (nửa ngày)" : ""}
              </Text>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Box>
          </button>
        )}

        {/* Explanations */}
        {data.explanations.length > 0 && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Text size="xSmall" className="font-semibold text-gray-500 mb-2">
              Giải trình
            </Text>
            <Box className="space-y-2">
              {data.explanations.map((exp) => (
                <Box
                  key={exp.id}
                  className="flex items-center justify-between"
                >
                  <Text size="small" className="text-gray-700">
                    {exp.reason_label}
                  </Text>
                  <StatusBadge status={exp.status} label={exp.status_label} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom Action - only show if can_explain is true */}
      {!isReadOnly && data.can_explain && !data.explain_blocked && (
        <Box className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-10">
          <Button
            fullWidth
            onClick={() => navigate(`/attendance/explain/${date}`)}
          >
            Gửi giải trình
          </Button>
        </Box>
      )}
    </Page>
  );
};

export default AttendanceDayPage;
