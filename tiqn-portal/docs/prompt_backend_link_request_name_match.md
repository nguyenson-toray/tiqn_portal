[TIQN Portal Backend] Kiểm tra & hoàn thiện logic so sánh họ tên trong `link_employee_request`

## Bối cảnh

API `link_employee_request` (§6, từ 1.6.0) yêu cầu "Mã NV và họ tên phải khớp hồ sơ (không phân biệt dấu, hoa/thường, khoảng trắng thừa)". Không khớp → trả `NOT_FOUND`.

Mini App phía client đã cập nhật UI:
- Khuyến khích nhập tiếng Việt có dấu nhưng **không bắt buộc** (vì một số công nhân không biết gõ dấu).
- Cảnh báo rõ: mã NV và họ tên phải khớp nhau, mỗi tài khoản Zalo gán 1 nhân viên duy nhất.

## Yêu cầu kiểm tra

Xác nhận logic so sánh `full_name` trong `link_employee_request` đã đúng theo quy ước sau:

### Quy tắc so sánh

1. **Bỏ dấu tiếng Việt** (normalize NFD, loại combining marks):
   ```
   "Nguyễn Văn An" → "Nguyen Van An"
   "nguyen van an" → "Nguyen Van An"  (sau capitalize)
   ```

2. **Không phân biệt hoa/thường**: so sánh sau khi `.lower()` hoặc `.casefold()`.

3. **Trim và gom khoảng trắng thừa**: `"  Nguyễn   Văn  An  "` → `"Nguyen Van An"`.

4. **So sánh từng từ** (split by whitespace): đảm bảo đúng thứ tự và đủ số từ.

### Hàm tham khảo (Python)

```python
import unicodedata
import re

def normalize_name(name: str) -> str:
    """Chuẩn hóa tên: bỏ dấu, lowercase, gom khoảng trắng."""
    # Bỏ dấu tiếng Việt
    nfkd = unicodedata.normalize('NFD', name)
    without_diacritics = ''.join(
        c for c in nfkd
        if unicodedata.category(c) != 'Mn'
    )
    # Lowercase + gom khoảng trắng
    return re.sub(r'\s+', ' ', without_diacritics.strip().lower())

def names_match(input_name: str, db_name: str) -> bool:
    """So sánh tên user nhập với tên trong hồ sơ."""
    return normalize_name(input_name) == normalize_name(db_name)
```

### Ví dụ phải khớp

| User nhập | Hồ sơ | Kết quả |
|---|---|---|
| `Nguyễn Văn An` | `Nguyễn Văn An` | ✅ khớp |
| `nguyen van an` | `Nguyễn Văn An` | ✅ khớp (không dấu, không phân biệt hoa thường) |
| `NGUYEN VAN AN` | `Nguyễn Văn An` | ✅ khớp |
| `Nguyen  Van   An` | `Nguyễn Văn An` | ✅ khớp (khoảng trắng thừa) |
| `nguyễn văn an` | `Nguyễn Văn An` | ✅ khớp (có dấu, lowercase) |

### Ví dụ KHÔNG khớp

| User nhập | Hồ sơ | Kết quả |
|---|---|---|
| `Nguyễn An` | `Nguyễn Văn An` | ❌ thiếu từ |
| `Nguyễn Văn Bình` | `Nguyễn Văn An` | ❌ sai tên |
| `Văn An Nguyễn` | `Nguyễn Văn An` | ❌ sai thứ tự |

### Lưu ý bảo mật (đã có trong API CONTRACT)

- Sai mã hay sai tên đều trả **cùng một** `NOT_FOUND` "Mã nhân viên hoặc họ tên không đúng…".
- Server **không bao giờ** trả họ tên trong hồ sơ (chống dò mã/tên).
- Rate limit: tối đa 10 lần/ngày/tài khoản Zalo (tính cả lần lỗi).

## Hành động

1. Kiểm tra code hiện tại trong `link_employee_request` đã implement đúng các quy tắc trên chưa.
2. Nếu chưa có hàm bỏ dấu → thêm vào.
3. Viết test case cho các ví dụ ở bảng trên.
4. Ghi vào §13 nếu có thay đổi logic.
