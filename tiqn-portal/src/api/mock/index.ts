import * as data from "./data";

/**
 * Mock mode — runtime toggle.
 *
 * Priority:
 * 1. VITE_USE_MOCK=true/false → manual override
 * 2. Auto: start with mock OFF → try real API first
 *    - get_config / login succeeds → stay OFF (real data)
 *    - login fails (NOT_FOUND/NO_PHONE) or network error → enableMock()
 *    This works on: browser (server unreachable → mock), simulator (server
 *    reachable → real if phone mapped, mock if not), real phone (always real).
 */
let _useMock: boolean = (() => {
  const envVal = import.meta.env.VITE_USE_MOCK;
  if (envVal === "true") { console.log("[Mock] forced ON via env"); return true; }
  if (envVal === "false") { console.log("[Mock] forced OFF via env"); return false; }
  // Default OFF — try real API first, fallback to mock on failure
  console.log("[Mock] starting OFF — will try real API first");
  return false;
})();

/** Switch to mock mode at runtime (e.g. after login fails on simulator) */
export function enableMock() {
  console.log("[Mock] fallback → mock mode ON");
  _useMock = true;
}

export function isMockEnabled(): boolean {
  return _useMock;
}

// Per-endpoint mock toggle
function shouldMock(endpoint: string): boolean {
  if (!_useMock) return false;
  const envKey = `VITE_MOCK_${endpoint.toUpperCase()}`;
  const perEndpoint = import.meta.env[envKey];
  if (perEndpoint === "false") return false;
  return true;
}

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getMockResponse(
  endpoint: string,
  params?: Record<string, any>,
): Promise<any | null> {
  if (!shouldMock(endpoint)) return null;

  await delay();

  switch (endpoint) {
    case "get_config":
      return data.mockConfig;
    case "login":
      return data.mockLoginActive;
    case "dev_login":
      return data.mockLoginActive;
    case "me":
      return data.mockMe;
    case "logout":
      return null;
    case "set_oa_follow":
      return { followed: params?.action === "FOLLOWED", show_invite: false };
    case "set_id_by_oa":
      return { saved: true };
    case "link_employee_request": {
      const now = new Date().toISOString().replace("T", " ").substring(0, 19);
      return {
        status: "PENDING",
        message: "Yêu cầu đã được gửi. Phòng Nhân sự sẽ kiểm tra.",
        link_request: {
          status: "PENDING",
          employee_id: params?.employee_id || "TIQN-0001",
          created_at: now,
          requested_at: now,
          reject_reason: null,
          request_count: 1,
          requests_today: 1,
          max_per_day: 2,
          remaining_today: 1,
          can_resend: true,
        },
      };
    }
    case "get_home":
      return data.mockHome;
    case "get_notifications":
      return data.mockNotifications;
    case "mark_notifications_read":
      return { unread: 0 };
    case "get_leave_balances":
      return data.mockLeaveBalances;
    case "get_leave_applications":
      return data.mockLeaveApplications;
    case "get_leave_form":
      return data.mockLeaveForm;
    case "preview_leave":
      return data.mockPreviewLeave;
    case "create_leave_application":
      return data.mockLeaveDetail;
    case "get_leave_application":
      return data.mockLeaveDetail;
    case "cancel_leave_application":
      return { ...data.mockLeaveDetail, status: "CANCELLED", status_label: "Đã hủy", can_cancel: false };
    case "upload_leave_document":
      return { document: data.mockLeaveDetail.documents[0], document_count: 1 };
    case "delete_leave_document":
      return { document_count: 0 };
    case "get_attendance_calendar":
      return data.mockAttendanceCalendar;
    case "get_attendance_day":
      return data.mockAttendanceDay;
    case "get_explanation_form":
      return data.mockExplanationForm;
    case "create_attendance_request":
      return data.mockExplanationDetail;
    case "get_attendance_requests":
      return data.mockAttendanceRequests;
    case "get_attendance_request":
      return data.mockExplanationDetail;
    case "cancel_attendance_request":
      return { ...data.mockExplanationDetail, status: "CANCELLED", status_label: "Đã hủy", can_cancel: false };
    case "get_attendance_summary":
      return data.mockAttendanceSummary;
    case "get_overtime":
      return data.mockOvertime;
    case "get_payslip_periods":
      return data.mockPayslipPeriods;
    case "get_payslip":
      return data.mockPayslip;
    default:
      return null;
  }
}
