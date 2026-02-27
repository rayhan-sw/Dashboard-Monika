# Panduan API Logout

## Perubahan Penting

Endpoint `/api/auth/logout` sekarang **MEMERLUKAN AUTENTIKASI** menggunakan access token di header Authorization.

## Cara Testing di Postman

### 1. Login Terlebih Dahulu

**Endpoint:** `POST http://localhost:8080/api/auth/login`

**Body (JSON):**
```json
{
    "username": "intancandra",
    "password": "12345678"
}
```

**Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "message": "Login berhasil",
    "user": {
        "id": 9,
        "username": "intancandra",
        "role": "user"
    }
}
```

**PENTING:** Salin nilai `access_token` dari response ini!

---

### 2. Logout dengan Access Token

**Endpoint:** `POST http://localhost:8080/api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:** Tidak perlu body

**Response Success:**
```json
{
    "message": "Logout berhasil",
    "user": {
        "id": 9,
        "username": "intancandra",
        "role": "user"
    }
}
```

**Response Error (tanpa token):**
```json
{
    "error": "Token tidak ditemukan"
}
```

**Response Error (token tidak valid):**
```json
{
    "error": "Token tidak valid"
}
```

**Response Error (token sudah expired):**
```json
{
    "error": "Token telah kedaluwarsa, silakan refresh token"
}
```

---

## Yang Terjadi Saat Logout

Ketika endpoint logout dipanggil:

1. ✅ **Access token di-blacklist** - Token yang digunakan untuk logout akan masuk blacklist dan tidak bisa digunakan lagi
2. ✅ **Refresh token di-blacklist** (jika ada di cookie) - Refresh token juga masuk blacklist
3. ✅ **Session dihapus dari database** - Data sesi di tabel `refresh_tokens` dihapus
4. ✅ **Cookie dibersihkan** - Refresh token cookie di-clear dari browser
5. ✅ **Informasi user yang logout** - Response menampilkan user mana yang logout

---

## Mengapa Perlu Authorization Header?

**Sebelumnya:**
- Logout hanya mengandalkan cookie
- Tidak jelas user mana yang logout
- Di Postman, cookie sering tidak terkirim
- Access token tidak di-blacklist (masih bisa dipakai sampai expired)

**Sekarang:**
- Logout memerlukan access token di header Authorization
- Jelas user mana yang logout (dari token)
- Access token langsung di-blacklist (tidak bisa dipakai lagi)
- Lebih aman dan sesuai standar REST API

---

## Endpoint Logout Lainnya

### Logout dari Semua Device

**Endpoint:** `POST http://localhost:8080/api/auth/logout-all`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
    "message": "Logout dari semua perangkat berhasil",
    "devices_logged_out": 3
}
```

Endpoint ini akan:
- Logout dari semua device/browser yang login dengan akun yang sama
- Blacklist semua refresh token user tersebut
- Hapus semua session dari database

### Lihat Session Aktif

**Endpoint:** `GET http://localhost:8080/api/auth/sessions`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
    "sessions": [
        {
            "jti": "uuid-1",
            "device_info": "PostmanRuntime/7.26.8",
            "ip_address": "127.0.0.1",
            "last_used_at": "2026-02-27T10:30:00Z",
            "created_at": "2026-02-27T09:00:00Z"
        },
        {
            "jti": "uuid-2",
            "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "ip_address": "192.168.1.100",
            "last_used_at": "2026-02-27T09:15:00Z",
            "created_at": "2026-02-26T15:30:00Z"
        }
    ],
    "total": 2
}
```

---

## Troubleshooting

### "Token tidak ditemukan"
- Pastikan menambahkan header `Authorization: Bearer <token>`
- Pastikan ada spasi antara "Bearer" dan token

### "Token tidak valid"
- Token mungkin salah atau rusak
- Lakukan login ulang untuk mendapatkan token baru

### "Token telah kedaluwarsa"
- Access token expired (15 menit)
- Gunakan endpoint `/api/auth/refresh` untuk mendapatkan access token baru
- Atau login ulang

### "Token telah di-revoke"
- Token sudah pernah digunakan untuk logout
- Token masuk blacklist
- Login ulang untuk mendapatkan token baru

---

## Testing Flow Lengkap di Postman

1. **POST** `/api/auth/login` → Dapat `access_token`
2. Copy `access_token` 
3. **POST** `/api/auth/logout` dengan header `Authorization: Bearer <access_token>` → Logout berhasil
4. Coba gunakan token yang sama lagi → Error "Token telah di-revoke"
5. Login lagi untuk mendapatkan token baru

---

## Referensi

- [API_AUTH_DOCUMENTATION.md](API_AUTH_DOCUMENTATION.md) - Dokumentasi lengkap autentikasi
- [REFRESH_TOKEN_IMPLEMENTATION.md](REFRESH_TOKEN_IMPLEMENTATION.md) - Detail implementasi refresh token
- [TOKEN_CLEANUP_GUIDE.md](TOKEN_CLEANUP_GUIDE.md) - Pembersihan token otomatis
