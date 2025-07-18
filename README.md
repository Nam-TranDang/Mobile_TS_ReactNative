# 📚 MERN BOOKSTORE APP

A full-stack bookstore application using MERN stack with mobile (Expo), web admin panel, and socket integration.

---

## 🚀 Manual Project Run Guide

> ⚠️ **Note:** Expo CLI works best on Windows OS.

<details>
<summary><strong>🔧 Run Backend Server</strong></summary>

```bash
cd backend
npm install
npm run dev
```

</details>

<details>
<summary><strong>📱 Run Frontend (Mobile App)</strong></summary>

```bash
cd FE
npm install
# Optional: Install this if socket-related errors occur
npm install socket.io-client

# Update API endpoint:
# Edit FE/constants/api.js and replace the base URL with your local IP address

npx expo
```

</details>

<details>
<summary><strong>📡 Run Socket Server</strong></summary>

```bash
cd socket
npm install
npm run dev
```

</details>

<details>
<summary><strong>🖥️ Run Admin Web</strong></summary>

```bash
cd admin
npm install
npm run dev
```

</details>

---

## 🌐 Deployment

- **Frontend (Admin website):** using **Vercel** & **Jamstack** [Admin Panel Website](https://mobile-ts-react-native.vercel.app)  
- **Mobile App:** Developed using **Expo Application Services (EAS Build)**  
- **APK for Android:** using **Render** [Download APK](https://drive.google.com/drive/u/0/folders/1vkefZtDQg6AyEZWCnVEFv7sa0YBBGEVG)
- **Storing:** using  **Mongo DB Atlas** & **Cloudinary**

---

## 👥 User Roles

| Role    | Access via Mobile | Access via Admin Web |
|---------|------------------ |----------------------|
| Admin   | ✅ Yes            | ✅ Yes              |
| User    | ✅ Yes            | ❌ No               |
| Guest   | ✅ Yes            | ❌ No               |

---

## 🧑‍💻 Developed By

- Trần Đăng Nam  
- Huỳnh Nguyễn Quốc Bảo  
- Nguyễn Hoàng Gia Huy  
- Phạm Vũ Minh Huy  
- Phan Ngọc Thạch  
**From UTH - Vietnam**

---

## 🔁 API Response Standard


<details>
<summary><strong>🖥️ Run Admin Web</strong></summary>

## 📝 Git Commit & Branching Guidelines

### ✅ Commit Message Convention

| Type       | Description                             |
|------------|-----------------------------------------|
| `feat:`    | New feature                             |
| `fix:`     | Bug fix                                 |
| `refactor:`| Code restructuring (no feature changes) |
| `docs:`    | Documentation updates                   |
| `chore:`   | Routine tasks (no logic impact)         |
| `style:`   | UI/CSS changes                          |
| `perf:`    | Performance improvements                |
| `vendor:`  | Dependency/package version updates      |

### 🌿 Branch Naming Convention

- Use lowercase and hyphens. Avoid special characters or uppercase.
- Examples:  
  - `feature/login`  
  - `bugfix/chat-not-loading`

---

### ✅ Success Response

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

### ❌ Error Response

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

#### 📌 Field Explanation

| Field     | Description                        |
|-----------|------------------------------------|
| `success` | Boolean indicating request success |
| `message` | Short message (used on frontend)   |
| `data`    | Data payload (on success)          |
| `errors`  | List of error details (on failure) |
| `code`    | Internal error code                |
| `meta`    | Metadata (timestamp, endpoint info)|

---

## 📊 REST API Status Codes

| Status | Meaning                           |
|--------|-----------------------------------|
| `200`  | OK – Request succeeded            |
| `201`  | Created – New resource added      |
| `400`  | Bad Request – Invalid input       |
| `401`  | Unauthorized – Invalid token      |
| `404`  | Not Found – Resource not found    |
| `500`  | Internal Server Error             |

</details>