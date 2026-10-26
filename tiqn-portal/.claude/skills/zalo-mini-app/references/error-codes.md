# Zalo Mini App Error Codes

Source: https://docs.zaloplatforms.com/docs/MA/api/errorCode

## Permission & Auth Errors

| Code | Name | Description |
|------|------|-------------|
| -201 | Permission Denied | Người dùng đã từ chối cấp quyền truy cập |
| -202 | Permission Denied (No Retry) | Người dùng từ chối cấp quyền và chọn không hỏi lại lần sau |
| -203 | Rate Limit Exceeded | Vượt quá số lần gọi API cho phép |
| -1400 | Bad Request | Tham số truyền vào API không hợp lệ |
| -1401 | Authentication Required | Người dùng chưa cấp thông tin xác thực |
| -1403 | Permission Required | Cần xin cấp quyền tại trang Quản lý ứng dụng |
| -1404 | API Not Supported | Cập nhật Zalo để sử dụng API mới |
| -1408 | Request Timeout | Yêu cầu mất quá nhiều thời gian để xử lý |
| -2000 | Unknown Error | Lỗi không xác định |
| -2001 | Invalid ID | Id truyền vào API không hợp lệ |
| -2002 | User Denied Previous | Người dùng đã từ chối cấp quyền trước đó |

## Biometric Errors

| Code | Name | Description |
|------|------|-------------|
| 100 | Biometric Unknown Error | Lỗi không xác định khi xác thực sinh trắc học |
| 101 | Biometric Failed (Android) | Xác thực thất bại 3 lần liên tiếp trên Android |
| 102 | Biometric Cancelled | Người dùng đã hủy quá trình xác thực |
| 103 | Biometric Failed (iOS) | Xác thực không thành công, chọn nhập mật khẩu trên iOS |
| 108 | Biometric Locked | Xác thực quá nhiều lần, chức năng bị khóa |

## Code/Secret Key Errors

| Code | Name | Description |
|------|------|-------------|
| 114 | Empty Code | Tham số code đang bị rỗng |
| 115 | Invalid Code | Tham số code không hợp lệ |
| 116 | Empty Secret Key | Tham số secret_key đang bị rỗng |
| 117 | Invalid Secret Key | Tham số secret_key không hợp lệ |
| 118 | Code Invalid (Wrong App) | Code thuộc về ứng dụng khác |
| 119 | Code Already Used | Code đã được sử dụng trước đó |

## File & Storage Errors

| Code | Name | Description |
|------|------|-------------|
| -301 | Storage Full | Thiết bị đã hết dung lượng lưu trữ |
| -302 | File Not Found | Không tìm thấy file |
| -303 | Download In Progress | File đang được tải xuống |
| -304 | No Internet Connection | Không có kết nối Internet |
| -305 | Download Failed | Tải file thất bại (mạng hoặc đường dẫn) |
| -306 | Unsupported File Type | Định dạng file không được hỗ trợ |

## Media Errors

| Code | Name | Description |
|------|------|-------------|
| -2003 | User Cancelled | Người dùng đã hủy thao tác chọn media |
| -2004 | Cannot Pick Media | Không thể chọn media |
| -2005 | Cannot Save Image | Không thể lưu media vào thư viện ảnh |
| -2006 | Cannot Save Video | Không thể lưu video vào thư viện |

## Document/URL Errors

| Code | Name | Description |
|------|------|-------------|
| -700 | Invalid URL | Đường dẫn URL không hợp lệ |
| -701 | Unsupported File Type | Định dạng file không được hỗ trợ |
| -702 | Download Failed | Tải file thất bại |
| -703 | Document Open Failed | Mở tài liệu thất bại |

## Common Handling Patterns

```js
// Permission denied → guide user to settings
if (err.code === -201 || err.code === -202) {
  // Show UI explaining why permission is needed
}

// User denied previously (-2002) → cannot re-ask automatically
if (err.code === -2002) {
  // Guide user to app settings to grant permission manually
}

// Rate limit (-203) → back off and retry
if (err.code === -203) {
  // Implement exponential backoff
}
```
