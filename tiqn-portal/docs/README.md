# TIQN Portal — Zalo Mini App

Cổng thông tin nhân viên cho Công ty TNHH Toray International Việt Nam (TIQN), chạy trên nền tảng Zalo Mini App. Khoảng 1.000 nhân viên sử dụng ứng dụng để xem phiếu lương, chấm công, nghỉ phép và các thông báo nội bộ.

## Tech Stack

| Lớp | Công nghệ |
|---|---|
| Nền tảng | Zalo Mini App (chạy trong ứng dụng Zalo) |
| UI | React 18 + ZaUI (`zmp-ui`) + Tailwind CSS 3 |
| SDK | `zmp-sdk` (auth, storage, OA, chat) |
| State | Jotai |
| Routing | react-router-dom |
| Build | Vite + `zmp-vite-plugin` |
| Ngôn ngữ | TypeScript (strict mode) |
| Backend | Frappe/ERPNext — API riêng qua endpoint `customize_erpnext.api.employee_portal` |

## Cài đặt & Chạy

```bash
npm install
npx zmp login          # Đăng nhập Zalo Mini App Center
npx zmp start          # Dev server (mặc định mock data)
npx zmp deploy         # Deploy lên Zalo
```

### Biến môi trường

| Biến | Mô tả |
|---|---|
| `APP_ID` | Zalo Mini App ID |
| `VITE_API_BASE` | URL gốc API backend ERPNext |
| `VITE_APP_VERSION` | Phiên bản app, gửi trong header `X-Portal-Client-Version` |
| `VITE_USE_MOCK` | `true` = bật mock data (cho trình duyệt) |
| `VITE_DEV_LOGIN` | `1` = bật dev login, `0` = tắt, bỏ trống = tự động |

## Cấu trúc dự án

```
src/
├── api/
│   ├── client.ts          # HTTP client, retry, error handling
│   ├── endpoints.ts       # 27 endpoint functions
│   ├── types.ts           # TypeScript types từ API Contract
│   └── mock/              # Mock data & handler
├── components/
│   ├── AppHeader.tsx       # Header với logo TORAY
│   ├── BottomNav.tsx       # Tab bar (ẩn/hiện theo features)
│   ├── EmployeeAvatar.tsx  # Avatar + initials fallback
│   ├── ErrorState.tsx      # Lỗi + nút thử lại
│   ├── EmptyState.tsx      # Danh sách trống
│   ├── PullToRefresh.tsx   # Kéo để làm mới
│   ├── ReadOnlyBanner.tsx  # Banner chế độ chỉ xem
│   └── StatusBadge.tsx     # Nhãn trạng thái
├── hooks/
│   ├── useAuth.ts          # Đăng nhập, lưu/xoá session
│   └── useApi.ts           # Error handler, useAsyncAction
├── pages/
│   ├── login/              # 6 màn đăng nhập
│   ├── home/               # Trang chủ + OA invite
│   ├── payslip/            # Danh sách & chi tiết phiếu lương
│   ├── attendance/         # Chấm công, giải trình, OT
│   ├── leave/              # Nghỉ phép: danh sách, tạo, chi tiết
│   ├── notifications/      # Thông báo
│   └── account/            # Tài khoản, đăng xuất
├── store/
│   ├── auth.ts             # Jotai atoms: token, employee, config...
│   └── data.ts             # Jotai atoms: cache dữ liệu các màn
├── utils/
│   ├── format.ts           # Định dạng tiền, ngày, số
│   └── payslipCache.ts     # Cache phiếu lương persistent
└── images/
    └── logo.png            # Logo TORAY
```

## Luồng đăng nhập

```
Mở app
  │
  ├─ Có token lưu? ──→ GET /me ──→ OK → Trang chủ
  │                                FAIL → Xoá token, về IntroPage
  │
  └─ Không có token → IntroPage
       │
       ├─ Bấm "Đăng nhập"
       │    ├─ authorize() → getAccessToken() → getPhoneNumber()
       │    └─ POST /login(access_token, phone_token?)
       │         ├─ ACTIVE / READ_ONLY → Lưu session → /home
       │         ├─ NOT_FOUND → /not-found (form yêu cầu tạo tài khoản)
       │         ├─ NO_PHONE → /no-phone (yêu cầu cấp SĐT)
       │         ├─ EXPIRED / DISABLED → /deactivated
       │         └─ Network error → fallback mock data
       │
       └─ Dev Login (chỉ ở simulator / mock mode)
            └─ POST /dev_login(zalo_user_id)
```

### Yêu cầu tạo tài khoản (NotFoundPage)

Khi SĐT Zalo chưa khớp hồ sơ nhân viên:
1. Nhập mã nhân viên (`TIQN-xxxx`, validate regex) + họ tên
2. Họ tên được normalize: viết hoa chữ cái đầu, xoá khoảng trắng thừa, hỗ trợ tiếng Việt có/không dấu
3. POST `link_employee_request` → trạng thái PENDING / REJECTED
4. Phòng NS duyệt → bấm "Thử lại" để đăng nhập

## Các tính năng chính

### Phiếu lương

- **Danh sách kỳ lương** — theo năm, badge "Mới" cho phiếu chưa xem
- **Chi tiết phiếu** — bảng 3 cột (STT | Nội dung | Số tiền), dòng Thực lĩnh highlight xanh
- **Cache persistent** — lưu vào Zalo storage, khoá = `(period, published_on)`, tối đa 12 kỳ
- **"Ẩn khoản 0đ"** — lọc client-side, không gọi lại server
- **Chat C&B** — mở chat Zalo với nhân viên phụ trách công lương

### Chấm công

- **Lịch tháng** — hiển thị trạng thái từng ngày (đi làm, trễ, nghỉ, vắng...)
- **Chi tiết ngày** — giờ vào/ra, ca làm, giờ tăng ca, danh sách giải trình
- **Tổng hợp kỳ** — ngày công thực tế, nghỉ phép, vắng, trễ/sớm, OT
- **Giải trình chấm công** — form tạo giải trình với lý do, thời gian sửa
- **Tăng ca** — danh sách đăng ký OT trong kỳ

### Nghỉ phép

- **Số dư phép** — phép năm (đã dùng / còn lại), các loại phép khác
- **Danh sách đơn** — lọc theo năm, trạng thái
- **Tạo đơn nghỉ** — chọn loại phép, ngày, nửa ngày, lý do, preview ngày trừ, đính kèm tài liệu
- **Chi tiết đơn** — timeline duyệt, tài liệu đính kèm, huỷ đơn

### Thông báo

- **Danh sách** — phân trang, badge số chưa đọc
- **Đánh dấu đã đọc** — từng thông báo hoặc tất cả
- **Điều hướng** — bấm thông báo mở đúng màn liên quan

### Tài khoản

- Thông tin nhân viên, mã NV, chức vụ, SĐT đăng nhập
- Quan tâm OA công ty
- Chính sách dữ liệu & điều khoản sử dụng
- Đăng xuất (xoá token + toàn bộ cache)

## Tính năng do server điều khiển

Tất cả tab và nút hành động ẩn/hiện theo `get_config.features`:

| Flag | Điều khiển |
|---|---|
| `payslip` | Tab Phiếu lương, card phiếu lương trên trang chủ |
| `attendance` | Tab Chấm công |
| `overtime` | Sub-tab Tăng ca trong Chấm công |
| `leave_view` | Tab Nghỉ phép |
| `leave_create` | Nút "Tạo đơn nghỉ" |
| `explanation_create` | Nút "Giải trình" |
| `notifications` | Tab Thông báo, icon chuông trên trang chủ |
| `oa_invite` | Banner mời quan tâm OA |

## API Client

### Retry tự động

- **Lỗi mạng / HTTP 5xx** — thử lại tối đa 3 lần, chờ 1s → 2s → 4s + 0-1s jitter ngẫu nhiên
- **HTTP 403** — không thử lại (lỗi cấu hình)
- **`RATE_LIMITED`** — chờ `retry_after` giây rồi thử 1 lần

### Xử lý lỗi tập trung

| Error Code | Hành vi |
|---|---|
| `SESSION_REQUIRED` / `SESSION_INVALID` | Xoá token + toàn bộ cache data → về đăng nhập |
| `CLIENT_TOO_OLD` | Chuyển màn yêu cầu cập nhật |
| `FEATURE_DISABLED` | Ẩn tính năng |
| `RATE_LIMITED` | Hiện thời gian chờ |

### Mock mode

Khi `VITE_USE_MOCK=true` hoặc khi real API không khả dụng (trình duyệt), toàn bộ endpoint trả mock data. Cho phép phát triển UI mà không cần server.

## Cache & Storage

| Dữ liệu | Lưu trữ | Thời hạn |
|---|---|---|
| Session token | Zalo `setStorage` | Đến khi logout |
| App config | Zalo `setStorage` | 1 giờ TTL |
| Phiếu lương chi tiết | Zalo `setStorage` + memory | Tối đa 12 kỳ, xoá khi logout |
| Danh sách kỳ lương | Jotai atom (memory) | Xoá khi logout hoặc SESSION_INVALID |
| Dữ liệu các màn khác | Jotai atom (memory) | Xoá khi logout hoặc SESSION_INVALID |

## Chế độ truy cập

| Mode | Mô tả |
|---|---|
| `FULL` | Đầy đủ quyền đọc/ghi |
| `READ_ONLY` | Chỉ xem (nhân viên đã nghỉ), hiện banner cảnh báo, ẩn các nút hành động. Mặc định 30 ngày sau ngày nghỉ. |

## Contract versions

| Version | Nội dung chính |
|---|---|
| 1.0 M1 | API gốc: login, home, leave, attendance, payslip |
| 1.1 | Đăng nhập bằng Zalo User ID, `phone_token` tuỳ chọn |
| 1.3 | Phiếu lương dạng bảng (`rows[]` thay `sections[]`) |
| 1.4 | Yêu cầu tạo tài khoản (`link_employee_request`) |
| 1.5 | Cache phiếu lương persistent, lọc 0đ client-side, retry, `logo_url` → null |
