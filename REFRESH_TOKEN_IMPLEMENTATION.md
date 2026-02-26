# 🔐 Refresh Token Implementation Documentation

## Overview
Implementasi **Refresh Token Strategy** dengan **HttpOnly Cookies** untuk Dashboard BPK. Sistem ini menggantikan strategi JWT token tunggal dengan dual-token system yang lebih aman.

---

## 📋 Table of Contents
1. [Architecture](#architecture)
2. [Security Features](#security-features)  
3. [Token Flow](#token-flow)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Implementation](#frontend-implementation)
7. [Deployment Guide](#deployment-guide)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Token Types

| Token Type | Duration | Storage | Usage Purpose |
|-----------|----------|---------|---------------|
| **Access Token** | 15 minutes | Memory (JavaScript variable) | API authentication |
| **Refresh Token** | 7 days | HttpOnly Cookie | Renew access token |

### Why This Approach?

#### Previous Problem
- ❌ Single JWT token stored in `localStorage` (24 hours)
- ❌ Vulnerable to XSS attacks
- ❌ Logout tidak invalidate token (logout global bug)
- ❌ No session management
- ❌ Large attack window (24 hours)

#### New Solution
- ✅ Short-lived access token (15 min) = smaller attack window
- ✅ Refresh token in httpOnly cookie = XSS protected
- ✅ Token blacklist = immediate revocation
- ✅ Session tracking per device
- ✅ Logout all devices capability
- ✅ Password change invalidates all sessions

---

## 🔒 Security Features

### 1. XSS Protection
- Access token di **memory** (tidak di localStorage)
- Refresh token di **httpOnly cookie** (tidak accessible via JavaScript)
- Jika XSS terjadi, attacker hanya dapat access token (valid 15 menit)

### 2. Token Blacklist
- Setiap token punya **JTI** (JWT ID) untuk tracking
- Logout → token masuk blacklist
- Middleware check blacklist sebelum authorize request
- Expired tokens auto-cleanup dari blacklist

### 3. Session Management
- Track device info, IP address, last used time
- User bisa lihat active sessions
- Logout specific session atau all devices
- Max 5 concurrent sessions per user (configurable)

### 4. Password Change Security
- Ganti password → invalidate ALL refresh tokens
- User harus login ulang dari semua devices
- Blacklist reason: `password_change`

### 5. Token Rotation
- Refresh token tidak di-rotate saat refresh access token
- Trade-off: simpler implementation vs replay attack risk
- Mitigated by: short refresh interval, session tracking

---

## 🔄 Token Flow

### Login Flow
```
1. User submit credentials
   ↓
2. Backend validate credentials
   ↓
3. Generate Access Token (15m) + Refresh Token (7d)
   ↓
4. Store Refresh Token in DB (with device info, IP)
   ↓
5. Set Refresh Token as httpOnly cookie
   ↓
6. Return Access Token to frontend
   ↓
7. Frontend stores Access Token in memory
   Frontend stores User info in localStorage (not sensitive)
```

### API Request Flow
```
1. Frontend sends request with Access Token in Authorization header
   ↓
2. Middleware validates Access Token
   ↓
3. Middleware checks JTI not in blacklist
   ↓
4. If valid → proceed to handler
   If expired → return 401
   If blacklisted → return 401 (token revoked)
```

### Auto-Refresh Flow
```
1. API request returns 401 (token expired)
   ↓
2. Axios interceptor catches 401
   ↓
3. Call /api/auth/refresh (sends httpOnly cookie automatically)
   ↓
4. Backend validates Refresh Token
   ↓
5. Backend checks Refresh Token not blacklisted
   ↓
6. Generate new Access Token
   ↓
7. Return new Access Token
   ↓
8. Retry original request with new Access Token
```

### Logout Flow
```
1. User clicks logout
   ↓
2. Frontend calls /api/auth/logout
   ↓
3. Backend extracts Refresh Token from cookie
   ↓
4. Add Refresh Token JTI to blacklist
   ↓
5. Delete Refresh Token from database
   ↓
6. Clear httpOnly cookie
   ↓
7. Frontend clears Access Token from memory
   Frontend clears User from localStorage
```

### Logout All Devices Flow
```
1. User calls /api/auth/logout-all
   ↓
2. Backend finds all user's Refresh Tokens
   ↓
3. Add all JTIs to blacklist (reason: logout_all)
   ↓
4. Delete all Refresh Tokens from database
   ↓
5. Clear current httpOnly cookie
   ↓
6. Return count of logged out devices
```

---

## 🗄️ Database Schema

### Table: `refresh_tokens`
Stores active refresh token sessions.

```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_jti ON refresh_tokens(jti);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Columns:**
- `jti`: JWT ID (UUID v4), unique identifier
- `user_id`: Owner of the token
- `device_info`: User-Agent string for session tracking
- `ip_address`: IP where token was issued
- `expires_at`: When token expires (7 days from creation)
- `last_used_at`: Last time token was used to refresh access token

### Table: `token_blacklist`
Stores invalidated tokens for immediate revocation.

```sql
CREATE TABLE token_blacklist (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    token_type VARCHAR(20) NOT NULL,
    reason VARCHAR(50),
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
```

**Columns:**
- `jti`: JWT ID to blacklist
- `user_id`: Token owner
- `token_type`: 'access' or 'refresh'
- `reason`: Why blacklisted (logout, password_change, security, etc.)
- `expires_at`: Original token expiry (for cleanup)

**Blacklist Reasons:**
- `logout`: User logged out normally
- `logout_all`: User logged out from all devices
- `password_change`: User changed password
- `security`: Admin/security action
- `expired`: Token expired (cleanup)

---

## 🔌 API Endpoints

See [API_AUTH_DOCUMENTATION.md](./API_AUTH_DOCUMENTATION.md) for complete API documentation with examples.

### Quick Reference

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/login` | POST | ❌ | Login and get tokens |
| `/api/auth/logout` | POST | ❌ | Logout current session |
| `/api/auth/logout-all` | POST | ✅ | Logout all devices |
| `/api/auth/refresh` | POST | ❌ | Refresh access token |
| `/api/auth/sessions` | GET | ✅ | Get active sessions |
| `/api/auth/register` | POST | ❌ | Register new user |
| `/api/auth/forgot-password` | POST | ❌ | Reset password |

---

## 💻 Frontend Implementation

### Access Token Management

```typescript
// Access token stored in memory (NOT localStorage)
let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}
```

### Axios Interceptor (Auto-Refresh)

```typescript
// Request interceptor - add access token
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - auto refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        // Refresh token
        const { access_token } = await refreshAccessToken();
        setAccessToken(access_token);
        
        // Retry original request
        return apiClient(originalRequest);
      } catch {
        // Refresh failed, logout
        clearAuthAndRedirectToLogin();
      }
    }
  }
);
```

### Login

```typescript
const response = await loginUser({ username, password });
// Access token automatically stored in memory
// Refresh token automatically stored in httpOnly cookie by backend
// User info stored in localStorage
```

### Logout

```typescript
await logoutUser();
// Blacklists refresh token
// Clears httpOnly cookie
// Clears access token from memory
// Clears user from localStorage
```

---

## 🚀 Deployment Guide

### 1. Run Migrations

```powershell
cd backend
.\scripts\migrate.ps1
```

This will run:
- `009_create_refresh_tokens.up.sql`
- `010_create_token_blacklist.up.sql`

### 2. Environment Variables

Ensure `.env` has:

```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=24h  # Not used, kept for backward compatibility
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 3. Install Dependencies

**Backend (Go):**
```powershell
cd backend
go mod download
```

**Frontend (Node.js):**
```powershell
cd frontend
npm install axios  # New dependency
```

### 4. Start Services

```powershell
# Backend
cd backend/cmd/api
go run main.go

# Frontend
cd frontend
npm run dev
```

### 5. CORS Configuration

For production, set `ALLOWED_ORIGINS` to your frontend domain:

```env
ALLOWED_ORIGINS=https://dashboard.bpk.go.id
```

### 6. HTTPS (Production Only)

**Important:** In production, set `secure: true` for cookies:

```go
// In auth_handler.go
c.SetCookie(
    RefreshTokenCookie,
    tokenPair.RefreshToken,
    CookieMaxAge,
    "/",
    "yourdomain.com",  // Set your domain
    true,              // secure = true (HTTPS only)
    true,              // httpOnly
)
```

---

## 🧪 Testing Guide

See [API_AUTH_DOCUMENTATION.md](./API_AUTH_DOCUMENTATION.md) for detailed API testing examples.

### Quick Test Checklist

- [ ] Login berhasil, dapat access token
- [ ] Login set httpOnly cookie (check browser DevTools > Network > Cookies)
- [ ] API request dengan access token berhasil
- [ ] Access token expired (tunggu 15 menit atau ubah expiry untuk testing)
- [ ] Auto-refresh berhasil tanpa logout
- [ ] Logout blacklist refresh token
- [ ] Logout clear cookie
- [ ] Login setelah logout blacklist → token lama tidak bisa dipakai
- [ ] Logout all devices → semua session invalidated
- [ ] Password change → semua session invalidated
- [ ] Max sessions limit works (login from 6 devices, device pertama ke-logout)

### Testing Auto-Refresh (Quick)

For testing, temporarily change access token expiry to 30 seconds:

```go
// In backend/internal/auth/jwt.go
const AccessTokenExpiry = 30 * time.Second  // Was: 15 * time.Minute
```

Then:
1. Login
2. Wait 30 seconds
3. Make any API request
4. Check Network tab: should see `/api/auth/refresh` call
5. Original API request should succeed

**Remember to change back to 15 minutes for production!**

---

## 🐛 Troubleshooting

### Issue: Cookie Not Set

**Symptoms:** httpOnly cookie not appearing in browser

**Solutions:**
1. Check CORS: `Access-Control-Allow-Credentials: true` must be set
2. Check frontend: `withCredentials: true` in axios config
3. Check cookie domain matches frontend domain
4. Check `secure` flag (should be `false` for localhost, `true` for HTTPS)

### Issue: Auto-Refresh Not Working

**Symptoms:** User logged out instead of token refreshing

**Solutions:**
1. Check axios interceptor is configured
2. Check `/api/auth/refresh` endpoint returns 200
3. Check refresh token cookie is sent with request
4. Check refresh token not blacklisted
5. Check refresh token not expired

### Issue: Logout Global (Old Problem Returns)

**Symptoms:** One user logout, all users logged out

**Solutions:**
1. Check blacklist is working: query `token_blacklist` table
2. Check middleware checks blacklist
3. Check JTI is unique per token (should be UUID)
4. Check each user gets different refresh token

###

 Issue: Token Blacklist Growing Too Large

**Symptoms:** `token_blacklist` table has millions of rows

**Solutions:**
1. Run cleanup: delete expired tokens
   ```sql
   DELETE FROM token_blacklist WHERE expires_at < NOW();
   ```
2. Set up automated cleanup (cron job or scheduled task)
3. Verify that old entries are being cleaned up

### Issue: "Token telah di-revoke" Error

**Symptoms:** User gets revoked token error unexpectedly

**Solutions:**
1. Check if user changed password (expected behavior)
2. Check if admin blacklisted token
3. Check if database cleanup accidentally deleted refresh token
4. Ask user to logout and login again

---

## 📊 Migration Path

### From Old System to New System

**Old System:**
- Single JWT token (24h) in localStorage
- No token revocation
- Logout only clears localStorage

**Migration Steps:**

1. **Deploy Backend Changes**
   - Run migrations
   - Start new backend
   - Old tokens still work (backward compatible)

2. **Deploy Frontend Changes**
   - Users with old tokens will be logged out
   - Users must login again to get new token pair

3. **Cleanup (Optional)**
   - After all users migrated (1-2 days), remove legacy `GenerateToken` function
   - Remove legacy `ValidateToken` that doesn't check blacklist

4. **Monitor**
   - Check `refresh_tokens` table growth
   - Check `token_blacklist` table growth
   - Set up alerts if tables grow too large

---

## 📚 Additional Resources

- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HttpOnly Cookie Security](https://owasp.org/www-community/HttpOnly)

---

## 📝 Change Log

### Version 2.0.0 (Current)
- ✅ Implemented refresh token strategy
- ✅ Added httpOnly cookie support
- ✅ Added token blacklist
- ✅ Added session management
- ✅ Added logout all devices
- ✅ Added auto-refresh mechanism
- ✅ Fixed logout global bug

### Version 1.0.0 (Previous)
- Single JWT token (24h)
- Token in localStorage
- No token revocation
- Logout global bug

---

## 👥 Support

For questions or issues:
1. Check this documentation
2. Check API documentation
3. Check troubleshooting section
4. Contact development team

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-26  
**Author:** Dashboard BPK Development Team
