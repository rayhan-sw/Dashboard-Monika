# Cara Menghapus "Co-authored-by: Cursor" dan Mengganti Pesan Commit

## Opsi 1: Hanya mengubah commit terakhir (Merge)

Jika yang ingin diperbaiki hanya commit paling atas (Merge):

```powershell
cd c:\Users\Rayhansw\KULIAH\MagangBPK\Dashboard-BPK

# Ganti pesan commit terakhir (tanpa Co-authored-by)
git commit --amend -m "Merge origin/main: selesaikan konflik, pertahankan versi lokal (server, JWT, tabel normalized, report_repository)"
```

Lalu jika sudah pernah push: `git push --force-with-lease origin main`

---

## Opsi 2: Mengubah commit "backup" (6063c08) yang ada Co-authored-by

Commit "backup: state lengkap sebelum pull..." ada di bawah merge. Harus pakai rebase:

1. Buka PowerShell di folder project, lalu jalankan:
   ```powershell
   git rebase -i fa9b566
   ```
   (fa9b566 = commit sebelum backup)

2. Di editor yang terbuka (Notepad/Vim/VS Code) Anda akan lihat sesuatu seperti:
   ```
   pick 6063c08 backup: state lengkap sebelum pull...
   pick d2e3ee1 Merge origin/main: ...
   ```

3. Ubah baris **pertama** dari `pick` jadi `reword` (atau cukup `r`):
   ```
   reword 6063c08 backup: state lengkap sebelum pull...
   pick d2e3ee1 Merge origin/main: ...
   ```

4. Simpan dan tutup editor.

5. Editor akan terbuka lagi untuk mengedit **pesan** commit backup. Hapus baris:
   ```
   Co-authored-by: Cursor <cursoragent@cursor.com>
   ```
   (dan ubah teks pesan jika mau). Simpan dan tutup.

6. Jika ada commit lain yang perlu di-reword, editor akan terbuka lagi; selesaikan sampai selesai.

7. Jika sudah pernah push ke GitHub:
   ```powershell
   git push --force-with-lease origin main
   ```

---

## Agar ke depan tidak ada lagi "Cursor" di commit

- **Commit lewat terminal** (tanpa Co-authored-by):
  ```powershell
  git add .
  git commit -m "Pesan commit Anda"
  ```

- Atau di Cursor: saat commit, **edit pesan** dan hapus baris `Co-authored-by: Cursor ...` sebelum menyimpan.

- Cursor kadang menambah Co-authored-by otomatis; cara paling aman ya commit dari terminal kalau tidak mau baris itu.
