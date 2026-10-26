import { atom, type WritableAtom } from "jotai";
import type {
  HomeData,
  LeaveBalance,
  LeaveApplicationsData,
  LeaveApplicationItem,
  AttendanceCalendarData,
  AttendanceSummaryData,
  PayslipPeriodsData,
  NotificationItem,
} from "@/api/types";

// ── Home ──
export const homeDataAtom = atom<HomeData | null>(null);

// ── Leave ──
export const leaveBalanceAtom = atom<LeaveBalance | null>(null);
export const leaveAppsAtom = atom<{
  data: LeaveApplicationsData;
  items: LeaveApplicationItem[];
} | null>(null);

// ── Attendance tabs ──
export const calendarCacheAtom = atom<{
  month: string;
  data: AttendanceCalendarData;
} | null>(null);

export const summaryCacheAtom = atom<{
  period: string;
  data: AttendanceSummaryData;
} | null>(null);

// ── Payslip ──
export const payslipCacheAtom = atom<{
  year: number;
  data: PayslipPeriodsData;
} | null>(null);

/** Periods the user has viewed this session (to clear "Mới" badge locally) */
export const viewedPayslipPeriodsAtom = atom<Set<string>>(new Set<string>());

// ── Notifications ──
export const notificationsCacheAtom = atom<{
  items: NotificationItem[];
  hasMore: boolean;
  unread: number;
} | null>(null);

// ── Reset all data atoms (on logout / SESSION_INVALID) ──
export const allDataAtoms: Array<WritableAtom<any, [any], void>> = [
  homeDataAtom,
  leaveBalanceAtom,
  leaveAppsAtom,
  calendarCacheAtom,
  summaryCacheAtom,
  payslipCacheAtom,
  viewedPayslipPeriodsAtom,
  notificationsCacheAtom,
];
