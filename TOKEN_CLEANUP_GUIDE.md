# Testing Guide - Token Cleanup & Verification

## 🧹 Cleanup Token Lama dari localStorage

### Opsi 1: Auto-Cleanup (Sudah Implemented) ✅

Token lama akan otomatis dibersihkan saat:
1. **Refresh browser** (AuthCleanup component akan jalan)
2. **Logout** (akan hapus token lama)
3. **Login baru** (akan cleanup dulu sebelum login)

**Test:** 
- Refresh halaman http://localhost:3000
- Check DevTools → Application → Local Storage
- Token `token` key seharusnya sudah hilang

---

### Opsi 2: Manual Cleanup via DevTools Console

Jika auto-cleanup belum jalan, buka **Console** di DevTools dan run:

```javascript
// Hapus token lama dari localStorage
localStorage.removeItem('token');
console.log('Old token removed!');

// Verify - seharusnya return null
console.log('Token:', localStorage.getItem('token'));
```

---

### Opsi 3: Clear All localStorage

**Di DevTools:**
1. Application → Local Storage → http://localhost:3000
2. Klik kanan → **"Clear"**
3. Refresh halaman
4. Login lagi

---

## ✅ Verification Checklist

Setelah cleanup, verifikasi ini:

### 1. Check localStorage (Sebelum Login)
```javascript
// Di Console
console.log('localStorage keys:', Object.keys(localStorage));
// Expected: [] atau keys lain (TIDAK ADA 'token')
```

### 2. Login Baru

1. Buka http://localhost:3000/auth/login
2. Login dengan kredensial valid
3. Check DevTools → Application

### 3. Verify Token Storage (Setelah Login)

**✅ Expected di localStorage:**
```json
{
  "user": "{\"id\":1,\"username\":\"admin\",\"role\":\"admin\",...}"
  // ❌ TIDAK ADA key "token" atau "access_token"
}
```

**✅ Expected di Cookies:**
```
Name: refresh_token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
HttpOnly: ✓
Secure: - (localhost jadi false, production true)
Path: /
Expires: ~7 days
```

**✅ Expected di Memory (tidak terlihat di DevTools):**
```javascript
// Token disimpan di variable `accessToken` di api.ts
// Tidak bisa diakses via console atau XSS
// AMAN dari serangan XSS ✓
```

### 4. Verify Token Tidak di localStorage

Run di Console:
```javascript
// Harus return null
console.log('Token in localStorage:', localStorage.getItem('token'));

// Harus return null
console.log('Access token in localStorage:', localStorage.getItem('access_token'));

// Harus return user object (ini safe)
console.log('User in localStorage:', localStorage.getItem('user'));
```

Expected output:
```
Token in localStorage: null ✅
Access token in localStorage: null ✅
User in localStorage: "{...}" ✅
```

---

## 🎯 Test Scenarios

### Scenario 1: First Time Clean Install
1. Clear all localStorage
2. Refresh page → AuthCleanup runs
3. Login → Token in memory, cookie set, NO localStorage token
4. ✅ Pass if localStorage only has "user"

### Scenario 2: Upgrade from Old Version
1. Old token exists in localStorage
2. Refresh page → AuthCleanup removes old token
3. Login → New implementation (token in memory)
4. ✅ Pass if old token removed, new system working

### Scenario 3: Logout & Login Again
1. Login with new system
2. Logout → clears memory, removes old token
3. Login again → Token in memory
4. ✅ Pass if no token in localStorage after login

---

## 🐛 Troubleshooting

### Problem: Token masih ada di localStorage setelah refresh

**Solution:**
```javascript
// Force remove via console
localStorage.removeItem('token');
localStorage.removeItem('access_token');

// Verify
console.log(Object.keys(localStorage));
// Should NOT include 'token' or 'access_token'
```

### Problem: Tidak bisa login setelah cleanup

**Solution:**
1. Clear all cookies (terutama refresh_token)
2. Clear localStorage
3. Restart browser tab (Ctrl+Shift+T)
4. Login lagi

### Problem: Auto-cleanup tidak jalan

**Check:**
```javascript
// Di Console, check if AuthCleanup component loaded
console.log('[Auth] Cleaning up old token from localStorage');
// Should appear in console on page load
```

If not appearing:
- Hard refresh: Ctrl+Shift+R
- Clear browser cache
- Restart dev server

---

## 📊 Security Comparison

| Item | Old Implementation | New Implementation |
|------|-------------------|-------------------|
| Access Token Storage | ❌ localStorage (XSS vulnerable) | ✅ Memory (XSS safe) |
| Refresh Token Storage | ❌ Not implemented | ✅ httpOnly cookie (XSS safe) |
| Token Lifetime | ❌ 24 hours | ✅ Access: 15min, Refresh: 7 days |
| Token Revocation | ❌ Not possible | ✅ Blacklist enabled |
| Session Tracking | ❌ No tracking | ✅ Device + IP tracking |
| Auto Refresh | ❌ Manual refresh | ✅ Auto refresh on expiry |

---

## ✅ Success Criteria

Implementasi berhasil jika:
- [x] localStorage TIDAK ada key `token` atau `access_token`
- [x] localStorage ada key `user` (ini safe, bukan sensitive data)
- [x] Cookies ada `refresh_token` dengan **httpOnly** flag
- [x] Login berhasil dan redirect ke dashboard
- [x] API requests berhasil (token dikirim via Authorization header)
- [x] Auto-refresh bekerja setelah 15 menit
- [x] Logout menghapus token dari memory dan cookie

---

## 🚀 Next Steps

Setelah verification berhasil:
1. Test auto-refresh (lihat QUICK_START_GUIDE.md)
2. Test logout all devices
3. Test password change invalidation
4. Deploy ke production dengan HTTPS

