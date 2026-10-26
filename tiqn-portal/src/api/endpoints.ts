import { request } from "./client";
import type {
  AppConfig,
  LoginData,
  LinkEmployeeRequestData,
  MeData,
  OAFollowAction,
  OAFollowData,
  HomeData,
  NotificationsData,
  LeaveBalance,
  LeaveApplicationsData,
  LeaveFormData,
  PreviewLeaveData,
  LeaveApplicationDetail,
  AttendanceCalendarData,
  AttendanceDayData,
  ExplanationFormData,
  ExplanationDetail,
  ExplanationItem,
  Paginated,
  AttendanceSummaryData,
  OvertimeData,
  PayslipPeriodsData,
  PayslipData,
} from "./types";

// §6 — Config & Auth

export function getConfig() {
  return request<AppConfig>({ method: "GET", endpoint: "get_config", noToken: true });
}

export function login(access_token: string, phone_token?: string) {
  return request<LoginData>({
    method: "POST",
    endpoint: "login",
    params: { access_token, ...(phone_token ? { phone_token } : {}) },
    noToken: true,
  });
}

export function devLogin(zalo_user_id: string) {
  return request<LoginData>({
    method: "POST",
    endpoint: "dev_login",
    params: { zalo_user_id },
    noToken: true,
  });
}

export function me() {
  return request<MeData>({ method: "GET", endpoint: "me" });
}

export function logout() {
  return request<null>({ method: "POST", endpoint: "logout" });
}

export function setIdByOA(id_by_oa: string) {
  return request<{ saved: boolean }>({
    method: "POST",
    endpoint: "set_id_by_oa",
    params: { id_by_oa },
  });
}

export function linkEmployeeRequest(params: {
  access_token: string;
  employee_id: string;
  full_name: string;
}) {
  return request<LinkEmployeeRequestData>({
    method: "POST",
    endpoint: "link_employee_request",
    params,
    noToken: true,
  });
}

export function setOAFollow(action: OAFollowAction) {
  return request<OAFollowData>({
    method: "POST",
    endpoint: "set_oa_follow",
    params: { action },
  });
}

// §7 — Home & Notifications

export function getHome() {
  return request<HomeData>({ method: "GET", endpoint: "get_home" });
}

export function getNotifications(params?: {
  page?: number;
  page_size?: number;
  unread_only?: 0 | 1;
}) {
  return request<NotificationsData>({
    method: "GET",
    endpoint: "get_notifications",
    params,
  });
}

export function markNotificationsRead(params: {
  ids?: string[];
  all?: 0 | 1;
}) {
  return request<{ unread: number }>({
    method: "POST",
    endpoint: "mark_notifications_read",
    params: {
      ids: params.ids ? JSON.stringify(params.ids) : undefined,
      all: params.all,
    },
  });
}

// §8 — Leave

export function getLeaveBalances(params?: { year?: number }) {
  return request<LeaveBalance>({
    method: "GET",
    endpoint: "get_leave_balances",
    params,
  });
}

export function getLeaveApplications(params?: {
  year?: number;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return request<LeaveApplicationsData>({
    method: "GET",
    endpoint: "get_leave_applications",
    params,
  });
}

export function getLeaveForm() {
  return request<LeaveFormData>({
    method: "GET",
    endpoint: "get_leave_form",
  });
}

export function previewLeave(params: {
  leave_type: string;
  from_date: string;
  to_date: string;
  half_day?: 0 | 1;
  half_day_date?: string;
}) {
  return request<PreviewLeaveData>({
    method: "GET",
    endpoint: "preview_leave",
    params,
  });
}

export function createLeaveApplication(params: {
  leave_type: string;
  from_date: string;
  to_date: string;
  half_day?: 0 | 1;
  half_day_date?: string;
  reason: string;
  client_request_id: string;
}) {
  return request<LeaveApplicationDetail>({
    method: "POST",
    endpoint: "create_leave_application",
    params,
  });
}

export function getLeaveApplication(id: string) {
  return request<LeaveApplicationDetail>({
    method: "GET",
    endpoint: "get_leave_application",
    params: { id },
  });
}

export function cancelLeaveApplication(id: string) {
  return request<LeaveApplicationDetail>({
    method: "POST",
    endpoint: "cancel_leave_application",
    params: { id },
  });
}

export function uploadLeaveDocument(
  leave_application: string,
  client_request_id: string,
  file: File,
) {
  const fd = new FormData();
  fd.append("leave_application", leave_application);
  fd.append("client_request_id", client_request_id);
  fd.append("file", file);
  return request<{ document: any; document_count: number }>({
    method: "POST",
    endpoint: "upload_leave_document",
    isUpload: true,
    body: fd,
  });
}

export function deleteLeaveDocument(document_id: string) {
  return request<{ document_count: number }>({
    method: "POST",
    endpoint: "delete_leave_document",
    params: { document_id },
  });
}

// §9 — Attendance

export function getAttendanceCalendar(params?: { month?: string }) {
  return request<AttendanceCalendarData>({
    method: "GET",
    endpoint: "get_attendance_calendar",
    params,
  });
}

export function getAttendanceDay(date: string) {
  return request<AttendanceDayData>({
    method: "GET",
    endpoint: "get_attendance_day",
    params: { date },
  });
}

export function getExplanationForm(date: string) {
  return request<ExplanationFormData>({
    method: "GET",
    endpoint: "get_explanation_form",
    params: { date },
  });
}

export function createAttendanceRequest(params: {
  from_date: string;
  to_date: string;
  reason: string;
  explanation: string;
  times?: Array<{ date: string; check_in: string | null; check_out: string | null }>;
  client_request_id: string;
}) {
  return request<ExplanationDetail>({
    method: "POST",
    endpoint: "create_attendance_request",
    params: {
      ...params,
      times: params.times ? JSON.stringify(params.times) : undefined,
    },
  });
}

export function getAttendanceRequests(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return request<Paginated<ExplanationItem>>({
    method: "GET",
    endpoint: "get_attendance_requests",
    params,
  });
}

export function getAttendanceRequest(id: string) {
  return request<ExplanationDetail>({
    method: "GET",
    endpoint: "get_attendance_request",
    params: { id },
  });
}

export function cancelAttendanceRequest(id: string) {
  return request<ExplanationDetail>({
    method: "POST",
    endpoint: "cancel_attendance_request",
    params: { id },
  });
}

// §9 — Attendance Summary & Overtime

export function getAttendanceSummary(params?: { period?: string }) {
  return request<AttendanceSummaryData>({
    method: "GET",
    endpoint: "get_attendance_summary",
    params,
  });
}

export function getOvertime(params?: { period?: string }) {
  return request<OvertimeData>({
    method: "GET",
    endpoint: "get_overtime",
    params,
  });
}

// §10 — Payslip

export function getPayslipPeriods(params?: { year?: number }) {
  return request<PayslipPeriodsData>({
    method: "GET",
    endpoint: "get_payslip_periods",
    params,
  });
}

export function getPayslip(period: string, include_zero: 0 | 1 = 1) {
  return request<PayslipData>({
    method: "POST",
    endpoint: "get_payslip",
    params: { period, include_zero },
  });
}
