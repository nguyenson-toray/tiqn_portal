# TIQN Portal — Zalo Mini App

Cổng thông tin nhân viên dành cho Toray International Quảng Ngãi, chạy trên nền tảng Zalo Mini App.

## Changelog

### v1.12.0 (19/11/2026)

- **Đồng bộ OA**: kiểm tra trạng thái quan tâm OA mỗi lần mở app qua `getUserInfo().followedOA`, tự động gọi `set_oa_follow` khi khác trạng thái trên ERP (FOLLOWED/UNFOLLOWED)
- **OA intro**: hiển thị lời giới thiệu OA (`oa.intro`) từ ERP tại OA card trang chủ và popup nhắc quan tâm, giữ xuống dòng
- **Chat message**: bỏ logic append nhóm phía client — server 1.12.0 đã include group trong `chat.message`
- **History limit**: thêm `get_config().history` (`months`, `from_month`). Chấm công: disable nút tháng trước khi đang ở `from_month`. Phiếu lương, nghỉ phép: server đã cắt `years_available`
- **Làm mới dữ liệu**: thêm cooldown 10 giây chống spam, di chuyển nút lên ngay dưới khối chat
- **UI**: thay thế custom bottom sheet, SVG icon bằng zmp-ui Sheet, Button, Icon
- **Account**: chuyển thông tin tài khoản vào bottom sheet trên trang chủ (nút user-circle trên header), bỏ tab Tài khoản khỏi BottomNav
- **OA popup**: hiển thị 1 lần duy nhất mỗi phiên app (không lặp khi chuyển tab)
- **Bỏ OAInvitePage**: chức năng quan tâm OA đã tích hợp vào trang chủ

### v1.11.0

- **Chat label & message**: nút chat dùng `chat.label` từ server, tin nhắn soạn sẵn `chat.message`
- **OA force-follow**: popup nhắc quan tâm OA sau N giây, có nút "Để sau"
- **set_id_by_oa**: gọi `getUserInfo()` lấy `idByOA` sau `followOA()` và khi `need_id_by_oa=true`
- **Overtime trên calendar**: hiển thị tổng tăng ca tháng và chỉ báo "TC" trên từng ngày

### v1.10.0

- **Link request chat**: sau khi gửi yêu cầu liên kết, mở chat Zalo với C&B kèm link duyệt trên ERP

## Development

### Using Zalo Mini App Extension

1. Install [Visual Studio Code](https://code.visualstudio.com/download) and [Zalo Mini App Extension](https://mini.zalo.me/docs/dev-tools).
1. In the **Home** tab, process **Config App ID** and **Install Dependencies**.
1. Navigate to the **Run** tab, select the suitable launcher, and click **Start**.

### Using Zalo Mini App CLI

1. [Install Node JS](https://nodejs.org/en/download/).
1. [Install Zalo Mini App CLI](https://mini.zalo.me/docs/dev-tools/cli/intro/).
1. **Install dependencies**:
   ```bash
   npm install
   ```
1. **Start** the dev server:
   ```bash
   zmp start
   ```
1. **Open** `localhost:3000` in your browser.

## Deployment

1. **Create** a mini program. For instructions on how to create a mini program, please refer to the [Coffee Shop Tutorial](https://mini.zalo.me/tutorial/coffee-shop/step-1/)

1. **Deploy** your mini program to Zalo using the mini app ID created.

   - **Using Zalo Mini App Extension**: navigate to the **Deploy** panel > **Login** > **Deploy**.
   - **Using Zalo Mini App CLI**:
     ```bash
     zmp login
     zmp deploy
     ```

1. Open the mini app in Zalo by scanning the QR code.

## Resources

- [Zalo Mini App Official Website](https://mini.zalo.me/)
- [ZaUI Documentation](https://mini.zalo.me/documents/zaui/)
- [ZMP SDK Documentation](https://mini.zalo.me/documents/api/)
- [DevTools Documentation](https://mini.zalo.me/docs/dev-tools/)
- [Ready-made Mini App Templates](https://mini.zalo.me/zaui-templates)
- [Community Support](https://mini.zalo.me/community)
