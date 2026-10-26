import type {
  AppConfig,
  LoginData,
  MeData,
  HomeData,
  NotificationsData,
  LeaveBalance,
  LeaveApplicationsData,
  LeaveFormData,
  PreviewLeaveData,
  LeaveApplicationDetail,
  AttendanceCalendarData,
  AttendanceDayData,
  CalendarDay,
  ExplanationFormData,
  ExplanationDetail,
  Paginated,
  ExplanationItem,
  AttendanceSummaryData,
  OvertimeData,
  PayslipPeriodsData,
  PayslipData,
  PayslipRow,
} from "../types";

export const mockConfig: AppConfig = {
  api_version: "1.0",
  min_client_version: "1.0.0",
  company: {
    name: "Công ty TNHH TIQN",
    short_name: "TIQN",
    logo_url: null,
  },
  contacts: { hr_hotline: "0235 xxx xxxx", company_phone: "0235 xxx xxxx" },
  legal: {
    privacy_policy_url: "https://erp.tiqn.com.vn:8888/portal-policy",
    terms_url: "https://erp.tiqn.com.vn:8888/portal-terms",
    version: "2026-10-12",
  },
  oa: { oa_id: "1234567890123456789", chat_enabled: true },
  dev_login: true,
  uploads: {
    max_files: 5,
    max_size_mb: 5,
    accept: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
  read_only_days: 30,
  features: {
    payslip: true,
    attendance: false,
    overtime: false,
    leave_view: false,
    leave_create: false,
    explanation_create: false,
    notifications: true,
    oa_invite: false,
  },
};

const mockEmployee = {
  employee_id: "TIQN-0231",
  full_name: "Nguyễn Văn An",
  initials: "NA",
  designation: "Công nhân vận hành",
  department: "Production",
  section: "Sewing",
  group: "Sewing 05",
  date_of_joining: "2021-03-15",
  relieving_date: null,
  avatar_url: "/files/employee_photos/TIQN-0231 Nguyễn Văn An.jpg",
};

const mockApprover = {
  full_name: "Trần Thị Bình",
  initials: "TB",
  designation: "Trưởng phòng",
};

export const mockLoginActive: LoginData = {
  result: "ACTIVE",
  token: "mock_token_q7mJ0n9vZ4_for_development",
  expires_on: "2026-11-11 08:15:00",
  masked_phone: "09•• ••• 123",
  zalo_user_id: "8012345678901234567",
  employee: mockEmployee,
  access: { mode: "FULL", read_only_until: null },
  oa: { followed: false, show_invite: true },
  expired_on: null,
  message: null,
  link_request: null,
};

export const mockLoginNotFound: LoginData = {
  result: "NOT_FOUND",
  token: null,
  expires_on: null,
  masked_phone: "09•• ••• 456",
  zalo_user_id: "8012345678901234567",
  employee: null,
  access: null,
  oa: null,
  expired_on: null,
  message: null,
  link_request: null,
};

export const mockLoginExpired: LoginData = {
  result: "EXPIRED",
  token: null,
  expires_on: null,
  masked_phone: "09•• ••• 789",
  zalo_user_id: "8012345678901234567",
  employee: null,
  access: null,
  oa: null,
  expired_on: "2026-11-14",
  message: null,
  link_request: null,
};

export const mockLoginNoPhone: LoginData = {
  result: "NO_PHONE",
  token: null,
  expires_on: null,
  masked_phone: "",
  zalo_user_id: "8012345678901234567",
  employee: null,
  access: null,
  oa: null,
  expired_on: null,
  message: "Tài khoản chưa có số điện thoại. Liên hệ phòng Nhân sự.",
  link_request: null,
};

export const mockDevLoginNotAllowed: LoginData = {
  result: "DEV_NOT_ALLOWED",
  token: null,
  expires_on: null,
  masked_phone: "",
  zalo_user_id: "8012345678901234567",
  employee: null,
  access: null,
  oa: null,
  expired_on: null,
  message: "Tài khoản chưa được cấp quyền Dev Login.",
  link_request: null,
};

export const mockMe: MeData = {
  employee: mockEmployee,
  access: { mode: "FULL", read_only_until: null },
  masked_phone: "09•• ••• 123",
  zalo_user_id: "8012345678901234567",
  login_method: "ZALO_PHONE",
  session_expires_on: "2026-11-11 08:15:00",
  oa: { followed: false, show_invite: false },
  chat: { type: "user", id: "7664780689128284452", name: "Chị Lan - Tiền lương" },
};

export const mockHome: HomeData = {
  employee: mockEmployee,
  access: { mode: "FULL", read_only_until: null },
  today: null,
  annual_leave: null,
  attendance: null,
  overtime: null,
  latest_payslip: {
    period: "2026-08",
    label: "Phiếu lương 08/2026",
    published_on: "2026-09-05",
    published_at: "2026-09-05 08:00:00",
  },
  notifications: {
    unread: 2,
    latest: {
      id: "PN-2026-00031",
      type: "PAYSLIP_PUBLISHED",
      title: "Phiếu lương tháng 08/2026",
      body: "đã phát hành",
      created_at: "2026-09-05 08:00:00",
      is_read: false,
      target: { screen: "PAYSLIP", id: "2026-08" },
    },
  },
  oa: { followed: false, show_invite: false },
  chat: { type: "user", id: "7664780689128284452", name: "Chị Lan - Tiền lương" },
};

export const mockNotifications: NotificationsData = {
  unread: 2,
  items: [
    {
      id: "PN-2026-00031",
      type: "PAYSLIP_PUBLISHED",
      title: "Phiếu lương tháng 08/2026",
      body: "đã phát hành",
      created_at: "2026-09-05 08:00:00",
      is_read: false,
      target: { screen: "PAYSLIP", id: "2026-08" },
    },
    {
      id: "PN-2026-00040",
      type: "EXPLANATION_APPROVED",
      title: "Giải trình ngày 08/09",
      body: "đã được duyệt",
      created_at: "2026-09-10 16:20:00",
      is_read: false,
      target: { screen: "EXPLANATION", id: "HR-ARQ-26-09-00012" },
    },
    {
      id: "PN-2026-00022",
      type: "LEAVE_REJECTED",
      title: "Đơn nghỉ không lương 05/07",
      body: "bị từ chối",
      created_at: "2026-07-03 14:12:00",
      is_read: true,
      target: { screen: "LEAVE", id: "LA-2026-07-00981" },
    },
  ],
  page: 1,
  page_size: 20,
  has_more: false,
};

export const mockLeaveBalances: LeaveBalance = {
  year: 2026,
  annual: {
    leave_type: "Phép năm/ Annual leave",
    label: "Phép năm",
    allocated: 12,
    used: 3,
    pending: 2,
    remaining: 9,
    available: 7,
  },
  others: [
    {
      leave_type: "Nghỉ hưởng BHXH/ Social insurance leave - Ốm đau",
      label: "Nghỉ ốm (BHXH)",
      balance: null,
      note: "Theo chứng từ",
    },
  ],
};

export const mockLeaveApplications: LeaveApplicationsData = {
  years_available: [2026, 2025],
  counts: { ALL: 4, PENDING: 2, APPROVED: 2, REJECTED: 0, CANCELLED: 0 },
  items: [
    {
      id: "LA-2026-10-00418",
      leave_type: "Phép năm/ Annual leave",
      leave_type_label: "Phép năm",
      from_date: "2026-10-02",
      to_date: "2026-10-03",
      half_day: false,
      half_day_date: null,
      days: 2,
      status: "PENDING",
      status_label: "Chờ duyệt",
      needs_documents: false,
      document_count: 0,
      source: "MINI_APP",
      created_at: "2026-09-29 09:14:00",
    },
    {
      id: "LA-2026-08-00371",
      leave_type: "Nghỉ hưởng BHXH/ Social insurance leave - Ốm đau",
      leave_type_label: "Nghỉ ốm (BHXH)",
      from_date: "2026-08-25",
      to_date: "2026-08-25",
      half_day: false,
      half_day_date: null,
      days: 1,
      status: "PENDING",
      status_label: "Chờ duyệt",
      needs_documents: true,
      document_count: 2,
      source: "MINI_APP",
      created_at: "2026-08-25 08:40:00",
    },
    {
      id: "LA-2026-09-00390",
      leave_type: "Phép năm/ Annual leave",
      leave_type_label: "Phép năm",
      from_date: "2026-09-11",
      to_date: "2026-09-11",
      half_day: false,
      half_day_date: null,
      days: 1,
      status: "APPROVED",
      status_label: "Đã duyệt",
      needs_documents: false,
      document_count: 0,
      source: "MINI_APP",
      created_at: "2026-09-08 15:30:00",
    },
    {
      id: "LA-2026-08-00350",
      leave_type: "Phép năm/ Annual leave",
      leave_type_label: "Phép năm",
      from_date: "2026-08-18",
      to_date: "2026-08-18",
      half_day: false,
      half_day_date: null,
      days: 1,
      status: "APPROVED",
      status_label: "Đã duyệt",
      needs_documents: false,
      document_count: 0,
      source: "MINI_APP",
      created_at: "2026-08-15 08:00:00",
    },
  ],
  page: 1,
  page_size: 20,
  has_more: false,
};

export const mockLeaveForm: LeaveFormData = {
  blocked: null,
  approver: mockApprover,
  leave_types: [
    {
      leave_type: "Phép năm/ Annual leave",
      label: "Phép năm",
      abbr: "P",
      uses_balance: true,
      available: 7,
      allows_documents: false,
    },
    {
      leave_type: "Nghỉ hưởng BHXH/ Social insurance leave - Ốm đau",
      label: "Nghỉ ốm (BHXH)",
      abbr: "O",
      uses_balance: false,
      available: null,
      allows_documents: true,
    },
    {
      leave_type: "Nghỉ hưởng BHXH/ Social insurance leave - Con ốm",
      label: "Con ốm (BHXH)",
      abbr: "CO",
      uses_balance: false,
      available: null,
      allows_documents: true,
    },
    {
      leave_type: "Nghỉ không lương/ Unpaid leave",
      label: "Nghỉ không lương",
      abbr: "KL",
      uses_balance: false,
      available: null,
      allows_documents: false,
    },
    {
      leave_type: "Nghỉ hưởng lương/ Paid leave - Hỉ sự",
      label: "Hỉ sự",
      abbr: "HS",
      uses_balance: false,
      available: null,
      allows_documents: false,
    },
    {
      leave_type: "Nghỉ hưởng lương/ Paid leave - Ma chay",
      label: "Ma chay",
      abbr: "MC",
      uses_balance: false,
      available: null,
      allows_documents: false,
    },
  ],
  half_day_allowed: true,
  documents: {
    max_files: 5,
    max_size_mb: 5,
    accept: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
};

export const mockPreviewLeave: PreviewLeaveData = {
  days: 2,
  excluded_dates: [
    { date: "2026-10-04", reason: "WEEKLY_OFF", label: "Chủ nhật" },
  ],
  available_before: 9,
  available_after: 7,
  note: "Đã trừ Chủ nhật và ngày lễ theo lịch làm việc của bạn.",
};

export const mockLeaveDetail: LeaveApplicationDetail = {
  id: "LA-2026-08-00371",
  leave_type: "Nghỉ hưởng BHXH/ Social insurance leave - Ốm đau",
  leave_type_label: "Nghỉ ốm (BHXH)",
  from_date: "2026-08-25",
  to_date: "2026-08-25",
  half_day: false,
  half_day_date: null,
  days: 1,
  reason: "Sốt cao, đi khám",
  status: "PENDING",
  status_label: "Đang chờ duyệt",
  source: "MINI_APP",
  created_at: "2026-08-25 08:40:00",
  approver: mockApprover,
  needs_documents: true,
  documents_request_note: "Bổ sung giấy ra viện khi có nhé.",
  approver_note: null,
  timeline: [
    {
      event: "SUBMITTED",
      label: "Đã gửi đơn",
      at: "2026-08-25 08:40:00",
      by: null,
      note: null,
      done: true,
    },
    {
      event: "DOCUMENTS_REQUESTED",
      label: "Yêu cầu bổ sung giấy tờ",
      at: "2026-08-25 10:02:00",
      by: "Trần Thị Bình",
      note: "Bổ sung giấy ra viện khi có nhé.",
      done: true,
    },
    {
      event: "UNDER_REVIEW",
      label: "Trưởng phòng đang xem xét",
      at: null,
      by: "Trần Thị Bình",
      note: null,
      done: false,
    },
  ],
  documents: [
    {
      id: "a1b2c3d4e5",
      file_name: "giay-kham.jpg",
      mime_type: "image/jpeg",
      size_bytes: 482113,
      uploaded_at: "2026-08-25 08:41:10",
      uploaded_by: "EMPLOYEE",
      can_delete: true,
      url: "https://erp.tiqn.com.vn:8888/api/method/customize_erpnext.api.employee_portal.download_document?sig=mock",
      url_expires_at: "2026-08-25 08:51:10",
    },
  ],
  allows_documents: true,
  can_cancel: true,
  can_add_documents: true,
};

function generateCalendarDays(month: string) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = new Date().toISOString().split("T")[0];
  const days: CalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, d).getDay();
    let display: CalendarDay["display"];
    let label: string | null = null;

    if (date > today) {
      display = "FUTURE";
    } else if (date === today) {
      display = "TODAY";
    } else if (dow === 0) {
      display = "DAY_OFF";
      label = "Chủ nhật";
    } else if (d === 1 && m === 9) {
      display = "HOLIDAY";
      label = "Quốc khánh";
    } else if (d === 8) {
      display = "LATE_EARLY";
      label = "Đi muộn 12 phút";
    } else if (d === 11) {
      display = "LEAVE";
      label = "Phép năm";
    } else {
      display = "PRESENT";
      label = "Có mặt";
    }

    // Add OT hours to some weekdays
    const hasOt = display === "PRESENT" && (d === 3 || d === 5 || d === 10 || d === 15 || d === 22);
    days.push({
      date,
      display,
      label,
      leave_abbr: display === "LEAVE" ? "P" : null,
      late: display === "LATE_EARLY",
      early: false,
      has_explanation: d === 8,
      overtime_hours: hasOt ? (d % 3 === 0 ? 2 : 1.5) : undefined,
    });
  }
  return days;
}

export const mockAttendanceCalendar: AttendanceCalendarData = {
  month: "2026-09",
  summary: { present: 22, leave: 1, absent: 0, late_early: 2, holiday: 1 },
  overtime_summary: { actual_hours: 12.5, approved_hours: 10 },
  today: { date: "2026-09-29", check_in: "07:52", check_out: null },
  days: generateCalendarDays("2026-09"),
};

export const mockAttendanceDay: AttendanceDayData = {
  date: "2026-09-08",
  weekday_label: "Thứ Ba",
  display: "LATE_EARLY",
  status_label: "Có mặt",
  late_minutes: 12,
  early_minutes: 0,
  check_in: "08:12",
  check_out: "17:35",
  shift: { label: "Day", start: "08:00", end: "17:00" },
  working_hours: 8.38,
  working_hours_label: "8 giờ 23",
  overtime_hours: 1.5,
  approved_overtime_hours: 1.5,
  leave: null,
  punches: [
    { time: "08:12", direction: "IN", device_name: "Machine 7" },
    { time: "12:01", direction: "OUT", device_name: "Machine 3" },
    { time: "12:58", direction: "IN", device_name: "Machine 3" },
    { time: "17:35", direction: "OUT", device_name: "Machine 7" },
  ],
  explanations: [
    {
      id: "HR-ARQ-26-09-00012",
      reason_label: "Đi công tác / làm việc bên ngoài",
      status: "APPROVED",
      status_label: "Đã duyệt",
    },
  ],
  overtime_registrations: [
    {
      id: "HR-OTR-26-09-00003",
      date: "2026-09-08",
      weekday_label: "Thứ Ba",
      begin: "17:00",
      end: "18:30",
      hours: 1.5,
      reason: "Hoàn thành đơn hàng gấp",
      status: "APPROVED" as const,
      status_label: "Đã duyệt",
    },
  ],
  can_explain: true,
  explain_blocked: null,
};

export const mockExplanationForm: ExplanationFormData = {
  blocked: null,
  date: "2026-09-08",
  context_label: "Thứ Ba, 08/09 · Vào 08:12 (muộn 12 phút) · Ra 17:35",
  existing: { check_in: "08:12", check_out: "17:35" },
  shift: { label: "Day", start: "08:00", end: "17:00" },
  approver: mockApprover,
  reasons: [
    { value: "On Duty", label: "Đi công tác / làm việc bên ngoài", requires_times: false },
    { value: "Work From Home", label: "Làm việc từ xa", requires_times: false },
    { value: "Forget Check In/Out", label: "Quên chấm công", requires_times: true },
    { value: "Machine Error", label: "Máy chấm công lỗi", requires_times: true },
    { value: "First Working Day", label: "Ngày đầu đi làm", requires_times: true },
    { value: "Other", label: "Lý do khác", requires_times: true },
  ],
  max_days: 31,
};

export const mockExplanationDetail: ExplanationDetail = {
  id: "HR-ARQ-26-09-00012",
  reason: "Forget Check In/Out",
  reason_label: "Quên chấm công",
  from_date: "2026-09-08",
  to_date: "2026-09-08",
  explanation: "Quên quẹt thẻ buổi sáng, vào lúc 08:00.",
  times: [{ date: "2026-09-08", check_in: "08:00", check_out: null }],
  status: "PENDING",
  status_label: "Chờ duyệt",
  approver: mockApprover,
  approver_note: null,
  source: "MINI_APP",
  created_at: "2026-09-08 18:02:00",
  decided_at: null,
  can_cancel: true,
};

export const mockAttendanceRequests: Paginated<ExplanationItem> = {
  items: [
    {
      id: "HR-ARQ-26-09-00012",
      reason_label: "Quên chấm công",
      from_date: "2026-09-08",
      to_date: "2026-09-08",
      status: "PENDING",
      status_label: "Chờ duyệt",
      created_at: "2026-09-08 18:02:00",
    },
  ],
  page: 1,
  page_size: 20,
  has_more: false,
};

export const mockAttendanceSummary: AttendanceSummaryData = {
  period: "2026-09",
  period_label: "Tháng 09/2026",
  from_date: "2026-08-26",
  to_date: "2026-09-25",
  provisional: true,
  as_of: "2026-09-28",
  cutoff_date: "2026-09-25",
  adjust_until: "2026-10-04",
  payable_days: { value: 24, standard: 25, source: "ERP" },
  present_days: 22,
  paid_leave_days: 1,
  holiday_days: 1,
  unpaid_absent_days: 0,
  late_early: { count: 2, minutes: 23 },
  overtime: { hours: 12.5, source: "ERP", pending_registrations: 1 },
};

export const mockOvertime: OvertimeData = {
  period: "2026-09",
  from_date: "2026-08-26",
  to_date: "2026-09-25",
  registered_approved_hours: 12.5,
  registered_pending_hours: 2,
  actual_hours: 12.0,
  items: [
    {
      date: "2026-09-29",
      weekday_label: "T3",
      begin: "17:30",
      end: "19:30",
      hours: 2,
      reason: "Hoàn thành đơn hàng gấp",
      status: "PENDING",
      status_label: "Chờ duyệt",
      registration_id: "OTR-26-09-29-0003",
    },
    {
      date: "2026-09-26",
      weekday_label: "T7",
      begin: "08:00",
      end: "12:30",
      hours: 4.5,
      reason: "Kiểm kê kho",
      status: "APPROVED",
      status_label: "Đã duyệt",
      registration_id: "OTR-26-09-25-0001",
    },
    {
      date: "2026-09-23",
      weekday_label: "T4",
      begin: "17:30",
      end: "20:30",
      hours: 3,
      reason: "Bảo trì máy",
      status: "REGISTERED",
      status_label: "Đã đăng ký",
      registration_id: "OTR-26-09-23-0001",
    },
    {
      date: "2026-09-16",
      weekday_label: "T4",
      begin: "17:30",
      end: "20:00",
      hours: 2.5,
      reason: "Đơn hàng xuất khẩu",
      status: "REGISTERED",
      status_label: "Đã đăng ký",
      registration_id: "OTR-26-09-16-0001",
    },
    {
      date: "2026-09-10",
      weekday_label: "T5",
      begin: "17:30",
      end: "20:00",
      hours: 2.5,
      reason: "Đơn hàng xuất khẩu",
      status: "REGISTERED",
      status_label: "Đã đăng ký",
      registration_id: "OTR-26-09-10-0001",
    },
  ],
};

export const mockPayslipPeriods: PayslipPeriodsData = {
  year: 2026,
  years_available: [2026, 2025],
  upcoming: {
    period: "2026-09",
    label: "Tháng 09/2026",
    status: "NOT_PUBLISHED",
    expected_pay_date: "2026-10-05",
  },
  items: [
    {
      period: "2026-08",
      label: "Tháng 08/2026",
      status: "PUBLISHED",
      period_from: "2026-07-26",
      period_to: "2026-08-25",
      pay_date: "2026-09-05",
      published_on: "2026-09-05 08:00:00",
      is_new: true,
    },
    {
      period: "2026-07",
      label: "Tháng 07/2026",
      status: "PUBLISHED",
      period_from: "2026-06-26",
      period_to: "2026-07-25",
      pay_date: "2026-08-05",
      published_on: "2026-08-05 08:00:00",
      is_new: false,
    },
  ],
};

// --- Mock rows (paper payslip format, 1→9) ---

const mockPayslipRows: PayslipRow[] = [
  // 1. Lương cơ bản
  { no: "1",   label: "Lương cơ bản",                                        formula: "a",     quantity: null, quantity_unit: null,   amount: 17214001, level: 0, is_header: true },
  { no: "1.1", label: "Số ngày công chuẩn trong tháng",                      formula: null,    quantity: 27,   quantity_unit: "DAY",  amount: null,     level: 1, is_header: false },
  { no: "1.2", label: "Số ngày công thực tế làm việc",                       formula: null,    quantity: 27,   quantity_unit: "DAY",  amount: 17214001, level: 1, is_header: false },
  // 2. Làm thêm giờ
  { no: "2",   label: "Tiền làm thêm giờ",                                  formula: "b",     quantity: null, quantity_unit: null,   amount: 1586396,  level: 0, is_header: true },
  { no: "2.1", label: "Số giờ làm thêm ngày thường",                        formula: null,    quantity: 8.5,  quantity_unit: "HOUR", amount: 1000000,  level: 1, is_header: false },
  { no: "2.2", label: "Số giờ làm thêm ngày nghỉ hàng tuần",               formula: null,    quantity: 4,    quantity_unit: "HOUR", amount: 586396,   level: 1, is_header: false },
  { no: "2.3", label: "Số giờ làm thêm ngày lễ, tết, ngày nghỉ có hưởng lương", formula: null, quantity: 0, quantity_unit: "HOUR", amount: 0,        level: 1, is_header: false },
  // 3. Lương tháng
  { no: "3",   label: "Tổng tiền lương trong tháng",                        formula: "c=a+b", quantity: null, quantity_unit: null,   amount: 18800397, level: 0, is_header: true },
  // 3.1–3.10. Phụ cấp
  { no: "3.1", label: "Tổng phụ cấp lương",                                 formula: "d",     quantity: null, quantity_unit: null,   amount: 3700000,  level: 0, is_header: true },
  { no: "3.2", label: "Phụ cấp trách nhiệm, chức vụ",                      formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "3.3", label: "Phụ cấp kỹ thuật, chuyên môn",                      formula: null,    quantity: null, quantity_unit: null,   amount: 500000,   level: 1, is_header: false },
  { no: "3.4", label: "Phụ cấp thâm niên công tác",                        formula: null,    quantity: null, quantity_unit: null,   amount: 200000,   level: 1, is_header: false },
  { no: "3.5", label: "Phụ cấp tiền xăng xe đi lại",                       formula: null,    quantity: null, quantity_unit: null,   amount: 1300000,  level: 1, is_header: false },
  { no: "3.6", label: "Phụ cấp tiền nhà ở",                                formula: null,    quantity: null, quantity_unit: null,   amount: 500000,   level: 1, is_header: false },
  { no: "3.7", label: "Phụ cấp tiền điện thoại liên lạc",                  formula: null,    quantity: null, quantity_unit: null,   amount: 200000,   level: 1, is_header: false },
  { no: "3.8", label: "Phụ cấp nuôi con nhỏ dưới 6 tuổi",                  formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "3.9", label: "Phụ cấp độc hại, nguy hiểm",                        formula: null,    quantity: null, quantity_unit: null,   amount: 1000000,  level: 1, is_header: false },
  { no: "3.10", label: "Phụ cấp khác (nếu có)",                             formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  // 4. Thưởng
  { no: "4",   label: "Tiền thưởng",                                        formula: "e",     quantity: null, quantity_unit: null,   amount: 1000000,  level: 0, is_header: true },
  { no: "4.1", label: "Thưởng chuyên cần",                                  formula: null,    quantity: null, quantity_unit: null,   amount: 1000000,  level: 1, is_header: false },
  { no: "4.2", label: "Thưởng năng suất lao động",                          formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "4.3", label: "Thưởng sáng kiến cải tiến",                          formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "4.4", label: "Thưởng khác (nếu có)",                               formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  // 5. Tổng thu nhập
  { no: "5",   label: "Tổng",                                               formula: "f=c+d+e", quantity: null, quantity_unit: null, amount: 23500397, level: 0, is_header: true },
  // 6. Tổng khấu trừ
  { no: "6",   label: "Tổng các khoản giảm trừ",                            formula: "g",     quantity: null, quantity_unit: null,   amount: 2021445,  level: 0, is_header: true },
  { no: "6.1", label: "Bảo hiểm xã hội (8%)",                              formula: null,    quantity: null, quantity_unit: null,   amount: 1473120,  level: 1, is_header: false },
  { no: "6.2", label: "Bảo hiểm y tế (1,5%)",                              formula: null,    quantity: null, quantity_unit: null,   amount: 276210,   level: 1, is_header: false },
  { no: "6.3", label: "Bảo hiểm thất nghiệp (1%)",                         formula: null,    quantity: null, quantity_unit: null,   amount: 184140,   level: 1, is_header: false },
  { no: "6.4", label: "Thuế thu nhập cá nhân",                              formula: null,    quantity: null, quantity_unit: null,   amount: 37975,    level: 1, is_header: false },
  { no: "6.5", label: "Phí công đoàn (1%)",                                 formula: null,    quantity: null, quantity_unit: null,   amount: 50000,    level: 1, is_header: false },
  { no: "6.6", label: "Các khoản khấu trừ khác (nếu có)",                   formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  // 7. Khoản khác
  { no: "7",   label: "Các khoản phúc lợi, hỗ trợ khác",                   formula: "h",     quantity: null, quantity_unit: null,   amount: 1563604,  level: 0, is_header: true },
  { no: "7.1", label: "Hỗ trợ tiền cơm giữa ca",                           formula: null,    quantity: null, quantity_unit: null,   amount: 1100000,  level: 1, is_header: false },
  { no: "7.2", label: "Hỗ trợ tiền gửi xe",                                formula: null,    quantity: null, quantity_unit: null,   amount: 150000,   level: 1, is_header: false },
  { no: "7.3", label: "Tiền thưởng hiện vật",                               formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "7.4", label: "Công tác phí, phụ cấp đi công tác",                  formula: null,    quantity: 2,    quantity_unit: "DAY",  amount: 300000,   level: 1, is_header: false },
  { no: "7.5", label: "Tiền đào tạo, huấn luyện ngoài giờ",                formula: null,    quantity: 1.5,  quantity_unit: "HOUR", amount: 13604,    level: 1, is_header: false },
  // 8. Điều chỉnh tháng trước
  { no: "8",   label: "Điều chỉnh lương tháng trước (nếu có)",              formula: "i",     quantity: null, quantity_unit: null,   amount: 0,        level: 0, is_header: true },
  { no: "8.1", label: "Truy lĩnh lương",                                    formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "8.2", label: "Truy thu bảo hiểm",                                  formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  { no: "8.3", label: "Điều chỉnh khác",                                    formula: null,    quantity: null, quantity_unit: null,   amount: 0,        level: 1, is_header: false },
  // 9. Thực lĩnh
  { no: "9",   label: "Thực lĩnh",                                          formula: "j=f-g+h+i", quantity: null, quantity_unit: null, amount: 23042556, level: 0, is_header: true },
];

// Full payslip data (always include_zero=1, client-side filtering)
export const mockPayslip: PayslipData = {
  period: "2026-08",
  label: "Phiếu lương 08/2026",
  period_from: "2026-07-26",
  period_to: "2026-08-25",
  pay_date: "2026-09-05",
  published_on: "2026-09-05 08:00:00",
  currency: "VND",
  net_pay: 23042556,
  include_zero: true,
  employee: {
    employee_id: "TIQN-0231",
    full_name: "Nguyễn Văn An",
    department: "Production",
    section: "Sewing",
    group: "Sewing 05",
  },
  rows: mockPayslipRows,
  sections: [],
};

