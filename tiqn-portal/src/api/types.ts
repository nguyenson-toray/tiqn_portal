// ==========================================
// API Contract Types — Zalo Mini App "Cổng nhân viên"
// Generated from API_CONTRACT.md v1.0-M1
// ==========================================

// --- Shared Objects (§5) ---

export interface Employee {
  employee_id: string;
  full_name: string;
  initials: string;
  designation: string;
  department: string;
  section: string;
  group: string;
  date_of_joining: string;
  relieving_date: string | null;
  avatar_url: string | null;
}

export interface Access {
  mode: "FULL" | "READ_ONLY";
  read_only_until: string | null;
}

export interface Person {
  full_name: string;
  initials: string;
  designation: string;
}

export interface Document {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by: "EMPLOYEE" | "HR";
  can_delete: boolean;
  url: string;
  url_expires_at: string;
}

// --- API Envelope (§3.1) ---

export interface ApiError {
  code: ErrorCode;
  message: string;
  field: string | null;
  details: Record<string, any>;
}

export type ApiResponse<T> =
  | { ok: true; data: T; server_time: string }
  | { ok: false; error: ApiError; server_time: string };

// --- Error Codes (§4) ---

export type ErrorCode =
  | "SESSION_REQUIRED"
  | "SESSION_INVALID"
  | "CLIENT_TOO_OLD"
  | "FEATURE_DISABLED"
  | "RATE_LIMITED"
  | "ZALO_TOKEN_INVALID"
  | "ZALO_TOKEN_USED"
  | "ZALO_PERMISSION"
  | "ZALO_SERVER_CONFIG"
  | "ZALO_UNAVAILABLE"
  | "READ_ONLY"
  | "NO_APPROVER"
  | "APPROVER_NO_USER"
  | "LEAVE_TYPE_NOT_ALLOWED"
  | "INSUFFICIENT_BALANCE"
  | "OVERLAP"
  | "VALIDATION"
  | "NOT_FOUND"
  | "NOT_ALLOWED_STATE"
  | "FILE_TOO_LARGE"
  | "FILE_TYPE"
  | "TOO_MANY_FILES"
  | "LOGIN_AGAIN"
  | "PENDING"
  | "DISABLED"
  | "REQUEST_LIMIT"
  | "EMPLOYEE_LINKED";

// --- Pagination (§3.4) ---

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  has_more: boolean;
}

// --- get_config (§6) ---

export interface AppConfig {
  api_version: string;
  min_client_version: string;
  company: { name: string; short_name: string; logo_url: string | null };
  contacts: { hr_hotline: string; company_phone: string };
  legal: { privacy_policy_url: string; terms_url: string; version: string };
  oa: { oa_id: string; chat_enabled: boolean };
  dev_login: boolean;
  uploads: { max_files: number; max_size_mb: number; accept: string[] };
  read_only_days: number;
  features: Features;
}

export interface Features {
  payslip: boolean;
  attendance: boolean;
  overtime: boolean;
  leave_view: boolean;
  leave_create: boolean;
  explanation_create: boolean;
  notifications: boolean;
  oa_invite: boolean;
}

// --- Link Employee Request ---

export interface LinkEmployeeRequestData {
  status: "PENDING";
  message: string;
  link_request: LinkRequestInfo;
}

export interface LinkRequestInfo {
  status: "PENDING" | "REJECTED";
  employee_id: string;
  created_at: string;
  reject_reason: string | null;
  /** @since 1.6.0 */
  requested_at: string;
  request_count: number;
  requests_today: number;
  max_per_day: number;
  remaining_today: number;
  can_resend: boolean;
}

// --- login (§6) ---

export type LoginResult = "ACTIVE" | "READ_ONLY" | "NOT_FOUND" | "EXPIRED" | "DISABLED" | "NO_PHONE" | "DEV_NOT_ALLOWED";

export interface LoginData {
  result: LoginResult;
  token: string | null;
  expires_on: string | null;
  masked_phone: string;
  zalo_user_id: string;
  employee: Employee | null;
  access: Access | null;
  oa: { followed: boolean; show_invite: boolean } | null;
  expired_on: string | null;
  message: string | null;
  link_request: LinkRequestInfo | null;
}

// --- Chat target (§10 Chat với C&B) ---

export interface ChatTarget {
  type: "user" | "oa";
  id: string;
  name: string | null;
}

// --- me (§6) ---

export interface MeData {
  employee: Employee;
  access: Access;
  masked_phone: string;
  zalo_user_id: string;
  login_method: "ZALO_PHONE" | "STORED_PHONE" | "DEV";
  session_expires_on: string;
  oa: { followed: boolean; show_invite: boolean };
  chat: ChatTarget | null;
}

// --- set_oa_follow (§6) ---

export type OAFollowAction = "FOLLOWED" | "DISMISSED" | "UNFOLLOWED";

export interface OAFollowData {
  followed: boolean;
  show_invite: boolean;
}

// --- get_home (§7) ---

export interface TodayInfo {
  date: string;
  weekday_label: string;
  state: "NOT_CHECKED_IN" | "WORKING" | "DONE" | "ON_LEAVE" | "HOLIDAY" | "DAY_OFF";
  state_label: string;
  check_in: string | null;
  check_out: string | null;
  shift: { label: string; start: string; end: string } | null;
  updated_at: string;
}

export interface HomeData {
  employee: Employee;
  access: Access;
  today: TodayInfo | null;
  annual_leave: { year: number; remaining: number; available: number } | null;
  attendance: {
    period: string;
    period_label: string;
    payable_days: number;
    standard_days: number;
    source: "ERP";
    provisional: boolean;
  } | null;
  overtime: { period: string; hours: number; source: "ERP" } | null;
  latest_payslip: { period: string; label: string; published_on: string; published_at: string } | null;
  notifications: {
    unread: number;
    latest: NotificationItem | null;
  } | null;
  oa: { followed: boolean; show_invite: boolean };
  chat: ChatTarget | null;
}

// --- get_notifications (§7) ---

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  target: { screen: string; id: string | null };
}

export interface NotificationsData extends Paginated<NotificationItem> {
  unread: number;
}

// --- Leave (§8) ---

export interface LeaveBalance {
  year: number;
  annual: {
    leave_type: string;
    label: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
    available: number;
  };
  others: Array<{
    leave_type: string;
    label: string;
    balance: number | null;
    note: string;
  }>;
}

export interface LeaveApplicationItem {
  id: string;
  leave_type: string;
  leave_type_label: string;
  from_date: string;
  to_date: string;
  half_day: boolean;
  half_day_date: string | null;
  days: number;
  status: LeaveStatus;
  status_label: string;
  needs_documents: boolean;
  document_count: number;
  source: "MINI_APP" | "DESK";
  created_at: string;
}

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveApplicationsData extends Paginated<LeaveApplicationItem> {
  years_available: number[];
  counts: Record<string, number>;
}

export interface LeaveFormData {
  blocked: { code: string; message: string } | null;
  approver: Person | null;
  leave_types: Array<{
    leave_type: string;
    label: string;
    abbr: string;
    uses_balance: boolean;
    available: number | null;
    allows_documents: boolean;
  }>;
  half_day_allowed: boolean;
  documents: { max_files: number; max_size_mb: number; accept: string[] } | null;
}

export interface PreviewLeaveData {
  days: number;
  excluded_dates: Array<{ date: string; reason: string; label: string }>;
  available_before: number | null;
  available_after: number | null;
  note: string;
}

export interface TimelineEvent {
  event: string;
  label: string;
  at: string | null;
  by: string | null;
  note: string | null;
  done: boolean;
}

export interface LeaveApplicationDetail {
  id: string;
  leave_type: string;
  leave_type_label: string;
  from_date: string;
  to_date: string;
  half_day: boolean;
  half_day_date: string | null;
  days: number;
  reason: string;
  status: LeaveStatus;
  status_label: string;
  source: "MINI_APP" | "DESK";
  created_at: string;
  approver: Person | null;
  needs_documents: boolean;
  documents_request_note: string | null;
  approver_note: string | null;
  timeline: TimelineEvent[];
  documents: Document[];
  allows_documents: boolean;
  can_cancel: boolean;
  can_add_documents: boolean;
}

// --- Attendance (§9) ---

export type AttendanceDisplay =
  | "PRESENT"
  | "LATE_EARLY"
  | "LEAVE"
  | "HALF_LEAVE"
  | "ABSENT"
  | "HOLIDAY"
  | "DAY_OFF"
  | "NO_DATA"
  | "TODAY"
  | "FUTURE";

export interface CalendarDay {
  date: string;
  display: AttendanceDisplay;
  label: string | null;
  leave_abbr: string | null;
  late: boolean;
  early: boolean;
  has_explanation: boolean;
  /** Overtime hours from attendance (custom_final_overtime_duration) */
  overtime_hours?: number;
  /** Has OT registration for this day */
  has_ot_registration?: boolean;
}

export interface AttendanceCalendarData {
  month: string;
  summary: {
    present: number;
    leave: number;
    absent: number;
    late_early: number;
    holiday: number;
  };
  /** Overtime summary for the month */
  overtime_summary?: {
    actual_hours: number;
    approved_hours: number;
  };
  today: { date: string; check_in: string | null; check_out: string | null };
  days: CalendarDay[];
}

export interface Punch {
  time: string;
  direction: "IN" | "OUT" | null;
  device_name: string | null;
}

export interface AttendanceDayData {
  date: string;
  weekday_label: string;
  display: AttendanceDisplay;
  status_label: string;
  late_minutes: number;
  early_minutes: number;
  check_in: string | null;
  check_out: string | null;
  shift: { label: string; start: string; end: string } | null;
  working_hours: number;
  working_hours_label: string;
  overtime_hours: number;
  /** Approved OT hours from attendance (custom_approved_overtime_duration) */
  approved_overtime_hours?: number;
  /** OT registrations for this day (including draft) */
  overtime_registrations?: Array<{
    id: string;
    date: string;
    weekday_label: string;
    begin: string;
    end: string;
    hours: number;
    reason: string | null;
    status: "DRAFT" | "APPROVED" | "PENDING" | "REGISTERED";
    status_label: string;
  }>;
  leave: {
    leave_type_label: string;
    abbr: string;
    half_day: boolean;
    application_id: string;
  } | null;
  punches: Punch[];
  explanations: Array<{
    id: string;
    reason_label: string;
    status: string;
    status_label: string;
  }>;
  can_explain: boolean;
  explain_blocked: { code: string; message: string } | null;
}

export interface ExplanationFormData {
  blocked: { code: string; message: string } | null;
  date: string;
  context_label: string;
  existing: { check_in: string | null; check_out: string | null };
  shift: { label: string; start: string; end: string };
  approver: Person;
  reasons: Array<{
    value: string;
    label: string;
    requires_times: boolean;
  }>;
  max_days: number;
}

export interface ExplanationTime {
  date: string;
  check_in: string | null;
  check_out: string | null;
}

export interface ExplanationDetail {
  id: string;
  reason: string;
  reason_label: string;
  from_date: string;
  to_date: string;
  explanation: string;
  times: ExplanationTime[] | null;
  status: string;
  status_label: string;
  approver: Person;
  approver_note: string | null;
  source: "MINI_APP" | "DESK";
  created_at: string;
  decided_at: string | null;
  can_cancel: boolean;
}

export interface ExplanationItem {
  id: string;
  reason_label: string;
  from_date: string;
  to_date: string;
  status: string;
  status_label: string;
  created_at: string;
}

export interface AttendanceSummaryData {
  period: string;
  period_label: string;
  from_date: string;
  to_date: string;
  provisional: boolean;
  as_of: string;
  cutoff_date: string;
  adjust_until: string;
  payable_days: { value: number; standard: number; source: "ERP" };
  present_days: number;
  paid_leave_days: number;
  holiday_days: number;
  unpaid_absent_days: number;
  late_early: { count: number; minutes: number };
  overtime: { hours: number; source: "ERP"; pending_registrations: number };
}

export interface OvertimeItem {
  date: string;
  weekday_label: string;
  begin: string;
  end: string;
  hours: number;
  reason: string;
  status: "APPROVED" | "PENDING" | "REGISTERED";
  status_label: string;
  registration_id: string;
}

export interface OvertimeData {
  period: string;
  from_date: string;
  to_date: string;
  registered_approved_hours: number;
  registered_pending_hours: number;
  actual_hours: number;
  items: OvertimeItem[];
}

// --- Payslip (§10) ---

export interface PayslipPeriodItem {
  period: string;
  label: string;
  status: "PUBLISHED";
  period_from: string;
  period_to: string;
  pay_date: string;
  published_on: string;
  is_new: boolean;
}

export interface PayslipPeriodsData {
  year: number;
  years_available: number[];
  upcoming: {
    period: string;
    label: string;
    status: "NOT_PUBLISHED";
    expected_pay_date: string | null;
  } | null;
  items: PayslipPeriodItem[];
}

export interface PayslipLine {
  code: string;
  label: string;
  amount: number;
  unit: "VND" | "DAY" | "HOUR";
  is_total: boolean;
  children: PayslipLine[];
}

export interface PayslipSection {
  key: string;
  label: string;
  sign: -1 | 0 | 1;
  total: number | null;
  unit: "VND" | null;
  lines: PayslipLine[];
}

export interface PayslipRow {
  no: string;
  label: string;
  formula: string | null;
  /** @since 1.7.0 — full display text from ERP, includes no + formula */
  display_label?: string;
  quantity: number | null;
  quantity_unit: "DAY" | "HOUR" | null;
  amount: number | null;
  level: 0 | 1;
  is_header: boolean;
}

export interface PayslipData {
  period: string;
  label: string;
  period_from: string;
  period_to: string;
  pay_date: string;
  published_on: string;
  currency: string;
  net_pay: number;
  include_zero: boolean;
  employee: Pick<Employee, "employee_id" | "full_name" | "department" | "section" | "group">;
  rows?: PayslipRow[];
  /** @deprecated Use rows instead (from 1.3.0) */
  sections: PayslipSection[];
}
