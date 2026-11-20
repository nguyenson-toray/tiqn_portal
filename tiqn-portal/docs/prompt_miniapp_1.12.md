[TIQN Portal] Yêu cầu cập nhật Mini App theo API contract 1.12.0 (server đã chạy từ 19/11/2026)

Làm **tiếp theo** `prompt_miniapp_1.11.md` (cùng thư mục). Có thể gộp cả hai vào một bản phát hành.
Tài liệu: `customize_erpnext/employee_portal/API_CONTRACT.md`. Các mục cần đọc:
- §6 `get_config` (`history`);
- `set_oa_follow` (bảng "Đối tượng `oa`" → `intro`, "Đồng bộ trạng thái mỗi lần mở app");
- "Chat với C&B";
- các dòng *(từ 1.12.0)* ở từng endpoint;
- §13 dòng 1.12.0.

## 0. Nguyên tắc bắt buộc (giữ như 1.11)
- KHÔNG được làm hỏng bản Mini App đã phát hành. Server 1.12.0 chỉ THÊM field, bản cũ vẫn chạy.
- Field mới thiếu hoặc `null` (server cũ, Review Mode) thì giữ đúng hành vi hiện tại.
- Review Mode (reviewer Zalo, NV "Nguyễn Văn Mẫu") phải mở được mọi màn như hiện nay.

## 1. Kiểm tra trạng thái quan tâm OA mỗi lần mở app
Người dùng có thể quan tâm rồi bỏ quan tâm ngoài Mini App, nên ERP cần biết trạng thái thật.
- Sau khi đăng nhập thành công (mỗi lần mở app), gọi `getUserInfo()` và đọc `userInfo.followedOA`.
  - Field này chỉ có khi Mini App đã liên kết OA `540203620506122131`.
  - `followedOA` là `undefined` / `null`: không làm gì, không gọi API.
- So với `oa.followed` lấy từ `me` hoặc `get_home`:
  - `followedOA = true`, `oa.followed = false`: gọi `set_oa_follow({ action: "FOLLOWED", id_by_oa })`. Chỉ gửi `id_by_oa` khi `idByOA` khác rỗng.
  - `followedOA = false`, `oa.followed = true`: gọi `set_oa_follow({ action: "UNFOLLOWED" })`.
  - Giống nhau: không gọi.
- Cập nhật UI (trạng thái OA ở trang chủ, popup nhắc) theo object `oa` server trả về.
- **Gộp chung một lần `getUserInfo()`** với mục ID by OA của 1.11:
  - cùng lúc gửi `set_id_by_oa` nếu `oa.need_id_by_oa = true` và có `idByOA`;
  - tối đa 1 lần mỗi lần mở app, không lặp;
  - lỗi thì bỏ qua, không chặn app.
- Đồng bộ xong mà người dùng vừa bỏ quan tâm thì server trả `force_follow = true` (nếu ERP bật nhắc): popup nhắc ở mục 4 của prompt 1.11 hoạt động như cũ.
- Review Mode: vẫn được gọi, server chỉ ghi vào tài khoản reviewer.

## 2. Lời giới thiệu OA (`oa.intro`)
- `oa` (trong `login`, `me`, `get_home`, `set_oa_follow`) có thêm `intro`.
  - Là văn bản thường do phòng Nhân sự soạn, có xuống dòng `\n`, tối đa 1000 ký tự.
  - Hiện tại:
    ```
    OA: Toray International VN - CN Quảng Ngãi
    Là kênh chính thức của công ty trên Zalo.
    Bấm nút quan tâm để nhận các thông báo từ công ty.
    Đây cũng là kênh tiếp nhận, phản hồi ý kiến của toàn thể CNV.
    ```
- Hiện ở 3 chỗ, giữ nguyên xuống dòng (`white-space: pre-line`), không render HTML:
  - khối trạng thái OA ở trang chủ;
  - thẻ mời màn 07;
  - popup nhắc quan tâm.
- `intro = null` hoặc thiếu: dùng chữ hiện có của app.

## 3. Lời chào có nhóm
- `chat.message` giờ có thêm nhóm của NV, ví dụ "Xin chào!, Tôi là Nguyễn Thái Sơn - TIQN-0148 - IT".
- Một số NV không có nhóm: server đã tự bỏ phần "- [Nhóm]". **App không phải sửa gì**, cứ gửi `chat.message` như 1.11.

## 4. Chat chỉ còn OA
- Chat 1-1 với C&B tạm ẩn: hiện server chỉ trả `chat.type = "oa"` (hoặc `chat = null`). `link_request_chat` luôn `null`.
- **Không xoá** code xử lý `type: "user"`: ERP có thể bật lại mà không đổi contract.
- Nhãn nút vẫn lấy từ `chat.label` như 1.11.

## 5. Chỉ đọc dữ liệu n tháng gần nhất (`get_config().history`)
- `get_config()` có thêm `history: { months, from_month }`, ví dụ `{ "months": 12, "from_month": "2025-12" }`.
  - n do phòng Nhân sự đặt (mặc định 12), tính cả tháng này. Trên ERP vẫn xem được hết.
  - Cả hai `null` = không giới hạn.
- Giới hạn bộ chọn, không cho chọn trước `from_month`:
  - tháng ở màn chấm công (`get_attendance_calendar`, `get_attendance_day`);
  - kỳ ở màn tổng hợp (`get_attendance_summary`);
  - năm ở nghỉ phép (`get_leave_balances`, `get_leave_applications`) và phiếu lương (`get_payslip_periods`): năm nhỏ nhất = năm của `from_month`.
- Danh sách đơn nghỉ, giải trình, phiếu lương: server đã bỏ bản ghi cũ hơn. `years_available` cũng đã cắt.
- Lịch: nếu có nút "tháng trước", ẩn hoặc vô hiệu khi đang ở `from_month`.
- Nếu vẫn gọi tháng / ngày / kỳ / năm cũ: server trả `VALIDATION`, `message` dạng "Chỉ xem được dữ liệu 12 tháng gần nhất.". Hiện `message` như mọi lỗi VALIDATION.
- Mở chi tiết đơn / giải trình / phiếu cũ (ví dụ từ thông báo cũ) trả `NOT_FOUND`: quay lại danh sách như hiện nay.
- Thông báo không bị giới hạn.
- `history` thiếu (server cũ): không giới hạn gì, như hiện tại.

## 6. Cần test
- Server cũ hoặc thiếu field mới: app chạy như bản hiện tại.
- Review Mode: mọi màn mở được, không có popup, `getUserInfo` không gọi lặp.
- Quan tâm OA ngoài Mini App, mở app: ERP chuyển sang "Đã quan tâm" (TIQN Portal Account → Followed OA) và có ID by OA.
- Bỏ quan tâm ngoài Mini App, mở app: ERP chuyển sang chưa quan tâm. Popup nhắc hiện lại nếu ERP bật nhắc.
- `oa.intro` hiện đúng xuống dòng ở 3 chỗ; `null` thì dùng chữ cũ.
- Lời chào của NV có nhóm và NV không nhóm (không có " - " thừa ở cuối).
- Bộ chọn tháng / năm dừng ở `from_month`. Gọi tháng cũ thì hiện lỗi đẹp, không treo màn.
