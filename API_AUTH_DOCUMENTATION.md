# 🔌 API Authentication Documentation

Complete API documentation for authentication endpoints with testing examples.

---

## 📋 Table of Contents
1. [Base URL](#base-url)
2. [Authentication Flow](#authentication-flow)
3. [Endpoints](#endpoints)
4. [Testing Examples](#testing-examples)
5. [Error Codes](#error-codes)

---

## 🌐 Base URL

```
Development: http://localhost:8080
Production:  https://api.dashboard-bpk.go.id
```

All auth endpoints are under `/api/auth`

---

## 🔄 Authentication Flow

### Standard Flow
```
1. POST /api/auth/login
   → Returns: { access_token, user, expires_in }
   → Sets httpOnly cookie: refresh_token

2. Use access_token for API requests
   → Header: Authorization: Bearer <access_token>

3. When access_token expires (15 min):
   → POST /api/auth/refresh (cookie sent automatically)
   → Returns: { access_token, expires_in }

4. On logout:
   → POST /api/auth/logout
   → Blacklists refresh token, clears cookie
```

---

## 📡 Endpoints

### 1. POST `/api/auth/login`

**Description:** Authenticate user and receive token pair.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john@bpk.go.id",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@bpk.go.id",
    "role": "user",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-02-26T10:30:00Z"
  },
  "message": "Login berhasil"
}
```

**Set-Cookie Header:**
```
Set-Cookie: refresh_token=<jwt_token>; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax
```

**Error Responses:**

```json
// 401 Unauthorized - Invalid credentials
{
  "error": "Username/Email atau password salah"
}

// 401 Unauthorized - Inactive user
{
  "error": "Username/Email atau password salah"
}

// 503 Service Unavailable - JWT secret not set
{
  "error": "Server misconfiguration"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john@bpk.go.id","password":"password123"}' \
  -c cookies.txt
```

**Postman Setup:**
1. Method: POST
2. URL: `http://localhost:8080/api/auth/login`
3. Body → raw → JSON:
   ```json
   {
     "username": "john@bpk.go.id",
     "password": "password123"
   }
   ```
4. **Important:** In Tests tab, add:
   ```javascript
   // Save access token to environment
   if (pm.response.code === 200) {
     const response = pm.response.json();
     pm.environment.set("access_token", response.access_token);
     pm.environment.set("user", JSON.stringify(response.user));
   }
   ```

---

### 2. POST `/api/auth/refresh`

**Description:** Exchange refresh token for new access token.

**Request:**
```http
POST /api/auth/refresh
Cookie: refresh_token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "message": "Token berhasil di-refresh"
}
```

**Error Responses:**

```json
// 401 Unauthorized - No refresh token
{
  "error": "Refresh token tidak ditemukan"
}

// 401 Unauthorized - Invalid refresh token
{
  "error": "Refresh token tidak valid"
}

// 401 Unauthorized - Expired refresh token
{
  "error": "Refresh token telah expired, silakan login kembali"
}

// 401 Unauthorized - Blacklisted token
{
  "error": "Token telah di-revoke, silakan login kembali"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -b cookies.txt
```

**Postman Setup:**
1. Method: POST
2. URL: `http://localhost:8080/api/auth/refresh`
3. No body needed (cookie sent automatically)
4. In Tests tab:
   ```javascript
   if (pm.response.code === 200) {
     const response = pm.response.json();
     pm.environment.set("access_token", response.access_token);
   }
   ```

**JavaScript (Frontend):**
```javascript
const response = await axios.post(
  'http://localhost:8080/api/auth/refresh',
  {},
  { withCredentials: true }
);
setAccessToken(response.data.access_token);
```

---

### 3. POST `/api/auth/logout`

**Description:** Logout current session (blacklist refresh token).

**Request:**
```http
POST /api/auth/logout
Cookie: refresh_token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Logout berhasil"
}
```

**Side Effects:**
1. Refresh token JTI added to blacklist
2. Refresh token deleted from database
3. HttpOnly cookie cleared

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -b cookies.txt
```

**Postman Setup:**
1. Method: POST
2. URL: `http://localhost:8080/api/auth/logout`
3. No body needed

**JavaScript (Frontend):**
```javascript
await axios.post(
  'http://localhost:8080/api/auth/logout',
  {},
  { withCredentials: true }
);
clearAccessToken();
localStorage.removeItem('user');
```

---

### 4. POST `/api/auth/logout-all`

**Description:** Logout from all devices (requires access token).

**Request:**
```http
POST /api/auth/logout-all
Authorization: Bearer <access_token>
Cookie: refresh_token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Logout dari semua perangkat berhasil",
  "devices_logged_out": 3
}
```

**Side Effects:**
1. ALL user's refresh tokens added to blacklist (reason: `logout_all`)
2. ALL refresh tokens deleted from database
3. Current httpOnly cookie cleared

**Error Responses:**

```json
// 401 Unauthorized - No access token
{
  "error": "Token tidak ditemukan"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/auth/logout-all \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt
```

**Postman Setup:**
1. Method: POST
2. URL: `http://localhost:8080/api/auth/logout-all`
3. Authorization → Type: Bearer Token → Token: `{{access_token}}`
4. No body needed

---

### 5. GET `/api/auth/sessions`

**Description:** Get all active sessions for current user.

**Request:**
```http
GET /api/auth/sessions
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": 1,
      "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      "ip_address": "192.168.1.100",
      "created_at": "2024-02-26T10:00:00Z",
      "last_used_at": "2024-02-26T10:30:00Z",
      "is_active": true
    },
    {
      "id": 2,
      "device_info": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      "ip_address": "192.168.1.101",
      "created_at": "2024-02-25T08:00:00Z",
      "last_used_at": "2024-02-26T09:00:00Z",
      "is_active": true
    }
  ],
  "total": 2
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/auth/sessions \
  -H "Authorization: Bearer <access_token>"
```

**Postman Setup:**
1. Method: GET
2. URL: `http://localhost:8080/api/auth/sessions`
3. Authorization → Type: Bearer Token → Token: `{{access_token}}`

---

### 6. POST `/api/auth/register`

**Description:** Register new user (unchanged from previous version).

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@bpk.go.id",
  "password": "Password123!",
  "confirm_password": "Password123!",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "Akun berhasil dibuat",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@bpk.go.id",
    "role": "user",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2024-02-26T10:30:00Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid email domain
{
  "error": "Email harus menggunakan domain @bpk.go.id"
}

// 400 Bad Request - Password mismatch
{
  "error": "Password dan konfirmasi password tidak cocok"
}

// 409 Conflict - Username exists
{
  "error": "Username sudah digunakan"
}

// 409 Conflict - Email exists
{
  "error": "Email sudah digunakan"
}
```

---

### 7. POST `/api/auth/forgot-password`

**Description:** Reset password (now invalidates all sessions).

**Request:**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "username": "john",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password berhasil diperbarui. Silakan login kembali dari semua perangkat."
}
```

**Side Effects:**
1. Password hash updated
2. ALL user's refresh tokens blacklisted (reason: `password_change`)
3. ALL refresh tokens deleted
4. User must login again from all devices

---

## 🧪 Testing Examples

### Complete Test Flow (Postman)

#### Setup Environment Variables
1. Create environment "Dashboard BPK Dev"
2. Add variables:
   - `base_url`: `http://localhost:8080`
   - `access_token`: (will be set automatically)

#### Test Scenario 1: Full Login Flow

**Step 1: Login**
```
POST {{base_url}}/api/auth/login
Body:
{
  "username": "admin@bpk.go.id",
  "password": "admin123"
}

Test Script:
const response = pm.response.json();
pm.environment.set("access_token", response.access_token);
pm.test("Login successful", () => {
  pm.response.to.have.status(200);
  pm.expect(response).to.have.property("access_token");
  pm.expect(response).to.have.property("user");
});
```

**Step 2: Make Authenticated Request**
```
GET {{base_url}}/api/dashboard/stats
Authorization: Bearer {{access_token}}

Test Script:
pm.test("Request successful", () => {
  pm.response.to.have.status(200);
});
```

**Step 3: Test Refresh Token**
```
POST {{base_url}}/api/auth/refresh

Test Script:
const response = pm.response.json();
pm.environment.set("access_token", response.access_token);
pm.test("Refresh successful", () => {
  pm.response.to.have.status(200);
  pm.expect(response).to.have.property("access_token");
});
```

**Step 4: Logout**
```
POST {{base_url}}/api/auth/logout

Test Script:
pm.test("Logout successful", () => {
  pm.response.to.have.status(200);
});
```

**Step 5: Verify Token Blacklisted**
```
GET {{base_url}}/api/dashboard/stats
Authorization: Bearer {{access_token}}

Expected: 401 Unauthorized
```

#### Test Scenario 2: Logout All Devices

**Step 1: Login from Multiple Devices**
Login 3 times with same credentials to simulate 3 devices.

**Step 2: Get Sessions**
```
GET {{base_url}}/api/auth/sessions
Authorization: Bearer {{access_token}}

Expected:
{
  "sessions": [...],  // Should show 3 sessions
  "total": 3
}
```

**Step 3: Logout All**
```
POST {{base_url}}/api/auth/logout-all
Authorization: Bearer {{access_token}}

Expected:
{
  "message": "Logout dari semua perangkat berhasil",
  "devices_logged_out": 3
}
```

**Step 4: Verify All Sessions Invalid**
Try using any of the old access tokens → should get 401.

#### Test Scenario 3: Password Change Security

**Step 1: Login**
Normal login flow.

**Step 2: Change Password**
```
POST {{base_url}}/api/account/change-password
Authorization: Bearer {{access_token}}
Body:
{
  "old_password": "admin123",
  "new_password": "newadmin123",
  "confirm_password": "newadmin123"
}

Expected:
{
  "message": "Kata sandi berhasil diubah. Silakan login kembali dari semua perangkat."
}
```

**Step 3: Verify Old Token Invalid**
```
GET {{base_url}}/api/dashboard/stats
Authorization: Bearer {{access_token}}

Expected: 401 Unauthorized (token revoked)
```

**Step 4: Login with New Password**
Should succeed with new password.

---

## ❌ Error Codes

### 400 Bad Request
- Invalid request format
- Missing required fields
- Password mismatch
- Invalid email domain

### 401 Unauthorized
- Invalid credentials
- Missing authorization header
- Invalid token
- Expired token
- Blacklisted token
- Token type mismatch (refresh used as access, etc.)

### 403 Forbidden
- User not active
- Insufficient permissions (admin-only endpoint)

### 404 Not Found
- User not found (in forgot password)
- Resource not found

### 409 Conflict
- Username already exists
- Email already exists

### 500 Internal Server Error
- Database error
- Unexpected server error

### 503 Service Unavailable
- JWT_SECRET not configured

---

## 🔍 Debugging Tips

### Check If Token Is Blacklisted

```sql
SELECT * FROM token_blacklist WHERE jti = '<your-jti>';
```

### Check Refresh Tokens for User

```sql
SELECT * FROM refresh_tokens WHERE user_id = 1;
```

### Check Blacklist Stats

```sql
SELECT 
  reason,
  COUNT(*) as count
FROM token_blacklist
WHERE expires_at > NOW()
GROUP BY reason;
```

### Extract JTI from Token

Use [jwt.io](https://jwt.io) and paste your token. Look for the `jti` field in the payload.

---

## 📝 Notes

1. **Cookies in Postman:** Postman automatically handles cookies. When you login, the `refresh_token` cookie is saved and sent with subsequent requests to the same domain.

2. **CORS:** If testing from browser (fetch/axios), ensure:
   - Backend sets `Access-Control-Allow-Credentials: true`
   - Frontend sets `withCredentials: true`
   - `Access-Control-Allow-Origin` is NOT `*` (must be specific domain)

3. **Token Expiry Testing:** To test token refresh quickly, temporarily change `AccessTokenExpiry` to 30 seconds in `jwt.go`.

4. **Blacklist Growth:** In production, set up automated cleanup to delete expired blacklist entries.

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-26
