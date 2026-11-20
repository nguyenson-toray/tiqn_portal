[TIQN Portal] Yêu cầu cập nhật Mini App theo API contract 1.11.0 (server đã chạy từ 19/11/2026)

Tài liệu: `customize_erpnext/employee_portal/API_CONTRACT.md` — §6 `me`, `set_id_by_oa`, `set_oa_follow` (bảng "Đối tượng `oa`"), §7 `get_home`, "Chat với C&B", §9 chấm công, §13 dòng 1.11.0.

## 0. Nguyên tắc bắt buộc
- KHÔNG được làm hỏng bản Mini App đã phát hành. Server 1.11.0 chỉ THÊM field / tham số tuỳ chọn, bản cũ vẫn chạy đúng.
- Bản mới phải chạy đúng cả khi field mới bị thiếu hoặc `null` (server cũ, Review Mode): thiếu thì giữ đúng hành vi hiện tại.
- Review Mode (reviewer Zalo, NV "Nguyễn Văn Mẫu") phải chạy được mọi màn như hiện nay. Server luôn trả `force_follow = false` và `need_id_by_oa = false` cho reviewer.

## 1. Sửa lỗi: ERP chưa nhận được ID by OA của ai
- Log server cho thấy app **chưa từng gọi `set_id_by_oa`**. Kết quả: 0/8 tài khoản có ID by OA. Ví dụ tài khoản 4783463346819090791 đã quan tâm OA lúc 08:38 ngày 19/11 nhưng vẫn không có ID.
- `getUserInfo().idByOA` chỉ có giá trị khi Mini App đã liên kết OA (OA ID `540203620506122131`) và người dùng đã quan tâm OA. Nhờ kiểm tra lại phần liên kết OA trong Zalo Mini App console.
- Cần gọi ở 3 chỗ:
  1. Sau mỗi lần đăng nhập thành công: `getUserInfo()`. Nếu `idByOA` khác rỗng thì gọi `set_id_by_oa({ id_by_oa })`.
  2. Ngay sau `followOA()` thành công: `getUserInfo()`, rồi gọi `set_oa_follow({ action: "FOLLOWED", id_by_oa })`. Chỉ gửi `id_by_oa` khi khác rỗng: nếu gửi giá trị không phải số, server trả `VALIDATION` và không lưu FOLLOWED.
  3. Khi `me` / `get_home` trả `oa.need_id_by_oa = true`: `getUserInfo()`, rồi `set_id_by_oa` nếu có `idByOA`. Không lặp vô hạn, mỗi lần mở app tối đa 1 lần.
- Đừng gửi `id` (app-scoped) vào `id_by_oa`.

## 2. Nút "Chat với C&B": chữ trên nút + lời chào soạn sẵn
- `chat` (trong `me`, `get_home`) có thêm 2 field:
  - `label`: chữ trên nút do phòng Nhân sự đặt (hiện là "Chat với nhân viên phụ trách công lương"). Thay cho chữ đang viết cứng trong app. `null` hoặc thiếu thì giữ chữ hiện tại.
  - `message`: lời chào server đã điền sẵn họ tên và mã NV, ví dụ "Xin chào!, Tôi là Nguyễn Văn An - TIQN-0231".
- Mở chat:
  `openChat({ type: chat.type, id: chat.id, ...(chat.message ? { message: chat.message } : {}) })`.
  `message` là `null` thì mở chat như hiện nay. Áp dụng cho cả `type: "user"` lẫn `"oa"`.
- **Trang chủ (màn 06): thêm khối chat** dùng `get_home.chat`: nhãn = `chat.label` (fallback chữ cũ), dòng phụ = `chat.name` nếu có, bấm vào thì `openChat` như trên. `chat = null` hoặc `access.mode = READ_ONLY` thì ẩn khối, giống quy tắc nút chat hiện tại.
- Luồng chat sau khi gửi Yêu cầu liên kết (`link_request_chat`, 1.10.0) giữ nguyên.

## 3. Trang chủ: trạng thái quan tâm OA
- Hiện trạng thái theo `oa.followed`: "Đã quan tâm OA" hoặc "Chưa quan tâm OA".
- Khi chưa quan tâm, có nút "Quan tâm OA": `followOA({ id: oa.oa_id ?? get_config().oa.oa_id })`, rồi làm như mục 1.2. Thành công thì cập nhật UI theo `oa` server trả về.
- Thẻ mời màn 07 (`oa.show_invite`) và nút "Để sau" của thẻ (`set_oa_follow DISMISSED`) **giữ nguyên** như hiện tại.

## 4. Popup nhắc quan tâm OA (`oa.force_follow`)
- Khi `oa.force_follow = true`: sau `oa.force_follow_delay_seconds` giây (mặc định 10) kể từ lúc mở app, hiện popup / bottom sheet mời quan tâm OA, gồm 2 nút "Quan tâm" và "Để sau".
- Popup hiện **mỗi lần mở app** (một lần mỗi lần khởi động, không hiện lại khi chuyển màn). Server vẫn trả `force_follow = true` kể cả khi người dùng đã bấm "Để sau" ở thẻ màn 07.
- 🔴 Popup **không được khoá** chức năng nào và **phải đóng được**. "Để sau" chỉ đóng popup, **không** gọi `set_oa_follow` (gọi DISMISSED sẽ tắt luôn thẻ mời màn 07).
- "Quan tâm": làm như mục 1.2.
- Huỷ hẹn giờ nếu người dùng đã quan tâm OA trước lúc popup hiện (ví dụ bấm nút ở trang chủ).
- `force_follow` thiếu, `false` hoặc `null` thì không hiện popup.

## 5. Tăng ca final từng ngày
- Server đã trả sẵn, không đổi API. Giá trị là giờ tăng ca **thực tính** (giờ được trả tiền), từ `Attendance.custom_final_overtime_duration`:
  - Lịch chấm công (`get_attendance_calendar`): `days[].overtime_hours`. Hiện trên ô ngày hoặc trong danh sách tăng ca của tháng, ví dụ "TC 1.5h". `null` = không có tăng ca.
  - Chi tiết ngày (`get_attendance_day`): `overtime_hours` = giờ final, hiện cạnh `approved_overtime_hours` (giờ được duyệt) và danh sách phiếu đăng ký `overtime_registrations[]`. Nhãn gợi ý: "Tăng ca thực tính".
- `get_config().features.overtime = false` thì các giá trị này là `null`: ẩn phần tăng ca.

## 6. Cần test
- Server cũ hoặc thiếu field mới: app chạy như bản hiện tại.
- Review Mode: không có popup, không gọi `getUserInfo` lặp lại, mọi màn mở được.
- Quan tâm OA trong app → ERP có ID by OA (TIQN Portal Account → cột ID by OA) và `need_id_by_oa = false`.
- Chat có lời chào đúng họ tên và mã của người đang đăng nhập. `label` / `message` = `null` thì vẫn mở chat bình thường.
- Popup: hiện sau đúng số giây, đóng được, mở lại app thì hiện lại, đã quan tâm thì không hiện.
