# Mobile_TS_ReactNative

# 1. Nguyên tắc commit & tạo nhánh (mục đích: tránh conflict và dễ merge):

## Commit Convention (Quy ước khi commit code lên GitHub):

- `feat:` thêm một feature mới
- `fix:` sửa lỗi trong hệ thống
- `refactor:` sửa code mà không thay đổi tính năng
- `docs:` cập nhật hoặc thêm tài liệu
- `chore:` thay đổi không ảnh hưởng đến logic code
- `style:` thay đổi về giao diện, CSS/UI
- `perf:` cải thiện hiệu năng xử lý
- `vendor:` cập nhật phiên bản dependencies, packages

## Branch Naming Conventions (Quy ước đặt tên nhánh):

- `feature/:` nhánh cho phát triển tính năng mới
- `bugfix/:` nhánh cho sửa lỗi

### Quy ước:
- Tên nhánh ngắn gọn, rõ ràng, khống chế ký tự dùng để đặt biệt hay viết hoa.
- Ví dụ: `feature/login`, `bugfix/chat-not-loading`

# 2. Standard response của API: 

## **Format Response**

### **1. Thành công**

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {
    "id": "12345",
    "name": "abc",
    "email": "abc@example.com"
  },
  "meta": {
    "timestamp": "2024-12-28T15:00:00Z",
    "instance": "/api/v1/auth/login"
  }
}
```

### **2. Lỗi từ Service**

```json
{
  "success": false,
  "errors": [
    {
      "code": 1002,
      "message": "Cannot update this record"
    }
  ],
  "meta": {
    "timestamp": "2025-01-26T03:50:52.555Z",
    "instance": "/api/v1/resource/123"
  }
}
```

### **Giải thích các trường trong response:**

- `success`: Boolean, xác định request thành công hay thất bại.
- `message`: Mô tả ngắn gọn khi `success = true`, dùng cho thông báo frontend.
- `data`: Payload trả về từ server khi request thành công.
- `errors`: Danh sách lỗi trả về khi request thất bại. Có thể là lỗi DTO hoặc lỗi service.
   - `resource`: Tên entity bị lỗi (chỉ áp dụng với lỗi DTO).
   - `field`: Tên trường cụ thể gây lỗi (chỉ áp dụng với lỗi DTO).
   - `code`: Mã lỗi nội bộ giúp frontend xử lý logic.
   - `message`: Mô tả chi tiết lỗi để hiển thị cho người dùng hoặc debug.
- `meta`: Thông tin bổ sung cho phản hồi.
   - `timestamp`: Thời điểm server xử lý response (ISO-8601).
   - `instance`: API endpoint tương ứng với request.

---


# 3. Các trạng thái trong REST API:
- `200 OK`: Yêu cầu thành công (ví dụ: GET users).
- `201 Created`: Tài nguyên được tạo (ví dụ: Tạo sự kiện mới - POST event).
- `400 Bad Request`: Dữ liệu đầu vào không hợp lệ (ví dụ: Thiếu email- missing email).
- `401 Unauthorized`: Xác thực thất bại (ví dụ: Token không hợp lệ - invalid token).
- `404 Not Found`: Không tìm thấy tài nguyên (ví dụ: Lấy người dùng theo ID - GET user by ID).
- `500 Internal Server Error`: Lỗi phía máy chủ (ví dụ: Lỗi cơ sở dữ liệu).
