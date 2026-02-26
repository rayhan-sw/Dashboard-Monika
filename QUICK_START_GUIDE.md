# ⚡ Quick Start Guide - Refresh Token Implementation

Panduan cepat untuk test dan deploy implementasi Refresh Token Strategy.

---

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Run Migrations (1 min)

```powershell
# Windows PowerShell
cd C:\Kuliah\Project\Dashboard-BPK\backend
.\scripts\migrate.ps1
```

Expected output:
```
Running migrations...
✓ 009_create_refresh_tokens.up.sql
✓ 010_create_token_blacklist.up.sql
Migrations completed successfully
```

### Step 2: Install Frontend Dependencies (2 min)

```powershell
cd C:\Kuliah\Project\Dashboard-BPK\frontend
npm install axios
```

### Step 3: Start Backend (30 sec)

```powershell
cd C:\Kuliah\Project\Dashboard-BPK\backend\cmd\api
go run main.go
```

Expected output:
```
Starting Dashboard BPK API on :8080
JWT_SECRET is set ✓
Database connected ✓
```

### Step 4: Start Frontend (30 sec)

```powershell
cd C:\Kuliah\Project\Dashboard-BPK\frontend
npm run dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000
```

### Step 5: Test Login (1 min)

1. Open browser: http://localhost:3000/auth/login
2. Login dengan user existing (contoh: admin@bpk.go.id)
3. Buka DevTools (F12) → Application → Cookies
4. Verify `refresh_token` cookie ada dan httpOnly ✓

**✅ Deploy Complete!**

---

## 🧪 Quick Test (10 Minutes)

### Test 1: Login & Cookie (2 min)

**Steps:**
1. Login via UI
2. Check DevTools → Application → Cookies
3. Should see: `refresh_token` cookie with httpOnly flag

**Expected:**
```
Name: refresh_token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Path: /
HttpOnly: ✓
Expires: 7 days from now
```

**✅ Pass:** Cookie set correctly  
**❌ Fail:** No cookie → check CORS settings

### Test 2: Auto-Refresh (3 min)

**For Quick Testing:** Temporarily change token expiry to 30 seconds:

```go
// In backend/internal/auth/jwt.go
const AccessTokenExpiry = 30 * time.Second  // Temporary for testing
```

Restart backend, then:

1. Login
2. Wait 30 seconds
3. Click any dashboard menu (triggers API request)
4. Check DevTools → Network tab
5. Should see `/api/auth/refresh` request automatically

**Expected:**
```
POST /api/auth/refresh → 200 OK
Response: { "access_token": "...", "expires_in": 30 }
```

**✅ Pass:** Auto-refresh works  
**❌ Fail:** Logged out instead → check axios interceptor

**Remember:** Change back to 15 minutes for production!

```go
const AccessTokenExpiry = 15 * time.Minute  // Production
```

### Test 3: Logout (2 min)

1. Login
2. Note the `refresh_token` cookie value
3. Click Logout
4. Check cookies → `refresh_token` should be gone
5. Try accessing dashboard → should redirect to login

**Expected:** Token blacklisted, cookie cleared

**Verify in DB:**
```sql
-- Check token was blacklisted
SELECT * FROM token_blacklist ORDER BY blacklisted_at DESC LIMIT 1;
-- Should show your token with reason = 'logout'

-- Check token removed from active sessions
SELECT * FROM refresh_tokens WHERE user_id = YOUR_USER_ID;
-- Should return empty or not include the logged-out token
```

**✅ Pass:** Logout works correctly  
**❌ Fail:** Still logged in → check logout implementation

### Test 4: Logout Global Bug Fixed (2 min)

**Old Bug:** 1 user logout → semua user logout  
**Test Fix:**

1. Open browser window 1 (Chrome)
2. Login as User A (john@bpk.go.id)
3. Open browser window 2 (Firefox or Incognito)
4. Login as User B (jane@bpk.go.id)
5. In window 1: Logout User A
6. In window 2: Refresh page or click dashboard menu

**Expected:** User B still logged in ✅  
**Old Behavior:** User B logged out ❌

**✅ Pass:** Bug fixed!  
**❌ Fail:** User B logged out → check blacklist implementation

### Test 5: Password Change Security (1 min)

1. Login with user
2. Change password via Profile → Change Password
3. Try accessing dashboard → should be logged out
4. Login with new password → should work

**Expected:** All sessions invalidated after password change

**Verify in DB:**
```sql
SELECT * FROM token_blacklist 
WHERE user_id = YOUR_USER_ID 
  AND reason = 'password_change';
-- Should show all tokens blacklisted
```

**✅ Pass:** Password change invalidates all sessions  
**❌ Fail:** Still logged in → check change password handler

---

## 🐛 Quick Troubleshooting

### Issue: Cookie Not Set

**Symptoms:** No `refresh_token` cookie in browser

**Quick Fixes:**
```javascript
// Check frontend api.ts
withCredentials: true  // Must be present in axios config

// Check backend router.go CORS
'Access-Control-Allow-Credentials': 'true'  // Must be set
'Access-Control-Allow-Origin': 'specific-domain'  // NOT '*'
```

**Test:** Open DevTools → Network → Login request → Check Response Headers:
```
Set-Cookie: refresh_token=...; HttpOnly; Path=/
Access-Control-Allow-Credentials: true
```

### Issue: Auto-Refresh Not Working

**Symptoms:** User logged out after 15 minutes instead of auto-refresh

**Quick Debug:**

1. Check axios interceptor is configured:
```javascript
// frontend/src/services/api.ts should have:
apiClient.interceptors.response.use(...)
```

2. Test refresh endpoint manually:
```bash
# After login, copy refresh_token cookie value
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Cookie: refresh_token=YOUR_COOKIE_VALUE"
```

Expected: `{ "access_token": "...", "expires_in": 900 }`

3. Check browser console for errors

### Issue: "Token telah di-revoke"

**Symptoms:** User gets this error unexpectedly

**Quick Fix:**
```sql
-- Check if token is blacklisted
SELECT * FROM token_blacklist WHERE jti = 'PASTE_JTI_HERE';

-- If wrongly blacklisted, remove (EMERGENCY ONLY):
DELETE FROM token_blacklist WHERE jti = 'PASTE_JTI_HERE';
```

**Better Fix:** Ask user to logout and login again.

### Issue: All Users Logged Out (Old Bug Returns)

**Symptoms:** Same token used by all users

**Quick Check:**
```sql
-- Check if JTIs are unique
SELECT jti, COUNT(*) 
FROM refresh_tokens 
GROUP BY jti 
HAVING COUNT(*) > 1;
-- Should return empty (no duplicates)

-- Check if different users have different tokens
SELECT user_id, jti FROM refresh_tokens ORDER BY created_at DESC LIMIT 10;
-- Each user_id should have different jti
```

**If JTI duplicates exist:** This is critical, JTI generation is broken.

---

## 📊 Quick Health Check

Run these queries to verify system health:

```sql
-- 1. Active sessions
SELECT 
  user_id,
  COUNT(*) as active_sessions,
  MAX(last_used_at) as last_activity
FROM refresh_tokens
WHERE expires_at > NOW()
GROUP BY user_id;

-- 2. Blacklist stats
SELECT 
  reason,
  COUNT(*) as count
FROM token_blacklist
WHERE expires_at > NOW()
GROUP BY reason;

-- 3. Cleanup needed?
SELECT 
  COUNT(*) as expired_tokens_to_cleanup
FROM token_blacklist
WHERE expires_at < NOW();
```

**Healthy System:**
- Active sessions: reasonable number per user (< 5)
- Blacklist: mostly logout reasons
- Expired tokens to cleanup: < 1000 (should be auto-cleaned)

---

## 🎯 Success Criteria Checklist

Run through this checklist to confirm implementation success:

### Functional Tests
- [x] Login sets httpOnly cookie
- [x] Login returns access_token (not token)
- [x] API requests work with access token
- [x] Access token auto-refreshes after expiry
- [x] Logout clears cookie and blacklists token
- [x] Multiple users can login simultaneously without interference
- [x] User A logout doesn't affect User B
- [x] Password change invalidates all sessions

### Security Tests
- [x] Access token NOT in localStorage (check DevTools → Application → Local Storage)
- [x] Refresh token IS in httpOnly cookie (check Cookies)
- [x] Refresh token NOT accessible via JavaScript (try `document.cookie` in console)
- [x] Old token after logout is rejected (401 error)
- [x] Blacklisted token cannot be used

### Database Tests
- [x] `refresh_tokens` table has entries after login
- [x] `token_blacklist` table has entries after logout
- [x] JTI values are unique (UUID format)
- [x] Expired tokens can be cleaned up

### Performance Tests
- [x] Login responds in < 500ms
- [x] Auth requests respond in < 200ms
- [x] Refresh responds in < 300ms
- [x] No memory leaks in frontend
- [x] Database queries are indexed (check EXPLAIN)

---

## 📱 Test with Postman

### Import Environment

Create environment `Dashboard BPK Local`:

```json
{
  "base_url": "http://localhost:8080",
  "access_token": ""
}
```

### Test Collection

**1. Login**
```
POST {{base_url}}/api/auth/login
Body (JSON):
{
  "username": "admin@bpk.go.id",
  "password": "admin123"
}

Tests:
pm.test("Login success", () => {
  pm.response.to.have.status(200);
  const response = pm.response.json();
  pm.environment.set("access_token", response.access_token);
  pm.expect(response).to.have.property("user");
});
```

**2. Get Dashboard Stats (Protected)**
```
GET {{base_url}}/api/dashboard/stats
Authorization: Bearer {{access_token}}

Tests:
pm.test("Request success", () => {
  pm.response.to.have.status(200);
});
```

**3. Refresh Token**
```
POST {{base_url}}/api/auth/refresh

Tests:
pm.test("Refresh success", () => {
  pm.response.to.have.status(200);
  const response = pm.response.json();
  pm.environment.set("access_token", response.access_token);
});
```

**4. Logout**
```
POST {{base_url}}/api/auth/logout

Tests:
pm.test("Logout success", () => {
  pm.response.to.have.status(200);
});
```

**5. Verify Token Blacklisted**
```
GET {{base_url}}/api/dashboard/stats
Authorization: Bearer {{access_token}}

Tests:
pm.test("Token revoked", () => {
  pm.response.to.have.status(401);
});
```

---

## 🔧 Quick Fixes for Common Errors

### Error: "JWT_SECRET not set"

**Fix:**
```powershell
# Windows PowerShell
$env:JWT_SECRET = "your-secret-key-minimum-32-characters"
cd backend/cmd/api
go run main.go
```

Or add to `.env` file:
```env
JWT_SECRET=your-secret-key-minimum-32-characters
```

### Error: "database connection failed"

**Fix:**
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Start if not running
Start-Service postgresql-x64-14  # or your version
```

### Error: "migration failed"

**Fix:**
```sql
-- Check current migration version
SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;

-- If stuck, manually run missing migrations:
-- Copy content from migrations/*.up.sql and run in pgAdmin or psql
```

### Error: "CORS blocked"

**Fix:**
```env
# In backend/.env
ALLOWED_ORIGINS=http://localhost:3000

# Restart backend
```

---

## 📚 Documentation Quick Links

- **Full Implementation Guide:** [REFRESH_TOKEN_IMPLEMENTATION.md](./REFRESH_TOKEN_IMPLEMENTATION.md)
- **API Testing Guide:** [API_AUTH_DOCUMENTATION.md](./API_AUTH_DOCUMENTATION.md)
- **Changes Summary:** [UPDATE_SUMMARY.md](./UPDATE_SUMMARY.md)

---

## 🎉 You're All Set!

If all tests pass, your refresh token implementation is complete and working correctly!

**What's Next?**
1. Test thoroughly in development
2. Deploy to staging environment
3. Monitor for issues
4. Deploy to production
5. Set up automated token cleanup (cronjob)

**Need Help?**
- Check troubleshooting section in [REFRESH_TOKEN_IMPLEMENTATION.md](./REFRESH_TOKEN_IMPLEMENTATION.md)
- Review API examples in [API_AUTH_DOCUMENTATION.md](./API_AUTH_DOCUMENTATION.md)
- Check database schema in migration files

---

**Last Updated:** 2026-02-26  
**Version:** 1.0
