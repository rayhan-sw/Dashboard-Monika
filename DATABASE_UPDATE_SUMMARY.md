# Database Update Summary - February 2026

## 📋 Overview

Updated database seeder and migrations to support team synchronization workflow. Now semua anggota tim bisa setup database dengan data yang **sama persis**.

## 🎯 What's New

### 1. New Export Script ⭐
- **File**: `backend/scripts/export_current_data.ps1`
- **Purpose**: Export database terbaru dari DBeaver untuk sharing ke tim
- **Output**: `backend/seeds/actlog_data_new.sql`

### 2. Updated Setup Script
- **File**: `backend/scripts/setup_database.ps1`
- **Changes**:
  - Default database name: `actlog` → `dashboard_bpk`
  - Now runs migrations: 002, 003, 004 (instead of 001)
  - Automatically loads `actlog_data.sql` seed file
  - Added column verification
  - Better progress reporting

### 3. New Migration
- **File**: `backend/migrations/004_add_status_detail.up.sql`
- **Purpose**: Add missing columns `status` and `detail_aktifitas`
- **Reason**: Seed file memiliki kolom ini tapi migration sebelumnya tidak

### 4. Documentation
- **DATABASE_SYNC_WORKFLOW.md**: Complete workflow untuk sync data
- **QUICK_REFERENCE.md**: Cheat sheet untuk common commands
- **Updated README.md**: Link ke workflow documentation
- **Updated scripts/README.md**: Added export_current_data.ps1 docs

## 📂 Files Modified

```
Dashboard-BPK/
├── backend/
│   ├── migrations/
│   │   ├── 004_add_status_detail.up.sql      ✨ NEW
│   │   └── 004_add_status_detail.down.sql    ✨ NEW
│   └── scripts/
│       ├── export_current_data.ps1            ✨ NEW
│       ├── setup_database.ps1                 📝 UPDATED
│       └── README.md                          📝 UPDATED
├── DATABASE_SYNC_WORKFLOW.md                  ✨ NEW
├── QUICK_REFERENCE.md                         ✨ NEW
└── README.md                                  📝 UPDATED
```

## 🔄 Workflow Changes

### Before (Old Way)
```powershell
# Manual export di DBeaver
# Manual edit SQL file
# Manual share via chat/email
# Team members import manually
```

### After (New Way - Automated)
```powershell
# Owner:
.\scripts\export_current_data.ps1
git commit && git push

# Team:
git pull
.\scripts\setup_database.ps1
# Done! Data sama persis
```

## 🗃️ Database Schema Changes

### Migration 004: New Columns
```sql
ALTER TABLE activity_logs 
ADD COLUMN status VARCHAR(50);
ADD COLUMN detail_aktifitas TEXT;
```

**Why?** Seed file `actlog_data.sql` contains these columns:
```sql
INSERT INTO public.activity_logs 
  (id_trans,nama,satker,aktifitas,scope,lokasi,
   detail_aktifitas,cluster,tanggal,token,status,created_at)
VALUES (...)
```

## ✅ Testing Checklist

### For Owner (yang update data):
- [ ] Export data: `.\scripts\export_current_data.ps1`
- [ ] File generated: `seeds/actlog_data_new.sql`
- [ ] Review file content
- [ ] Replace seed: `Move-Item seeds\actlog_data_new.sql seeds\actlog_data.sql -Force`
- [ ] Test locally: `.\scripts\setup_database.ps1`
- [ ] Verify row count matches
- [ ] Commit and push

### For Team (yang terima update):
- [ ] Pull latest: `git pull`
- [ ] Run setup: `.\scripts\setup_database.ps1`
- [ ] Verify database name: `dashboard_bpk`
- [ ] Check row count: `SELECT COUNT(*) FROM activity_logs`
- [ ] Test backend API
- [ ] Test frontend display

## 🔧 Migration Path

If you already have database setup, you can apply new migration only:

```powershell
# Apply migration 004 only
psql -U postgres -d dashboard_bpk -f backend\migrations\004_add_status_detail.up.sql

# Verify
psql -U postgres -d dashboard_bpk -c "\d activity_logs"
```

## 📊 Data Statistics

Current seed file (`actlog_data.sql`):
- **Size**: ~15-20 MB (depending on data volume)
- **Rows**: ~70,000+ records (from actLog CSV)
- **Columns**: 16 (after migration 004)
  - Core: id, id_trans, nama, satker, aktifitas
  - Details: scope, lokasi, detail_aktifitas, cluster
  - Timestamps: tanggal, created_at, updated_at
  - Metadata: token, status, province, region

## 🚨 Breaking Changes

### Database Name Change
**Old**: `actlog`
**New**: `dashboard_bpk`

**Action Required**: Update your `.env` file
```env
DB_NAME=dashboard_bpk
```

### Migration Order
**Old**: Only 001_create_tables.up.sql
**New**: 002, 003, 004 in sequence

**Why?** Migration 001 was initial schema, 002 is the correct activity_logs structure from CSV import.

## 💡 Best Practices

### For Owner:
1. Always export after making significant data changes
2. Test locally before pushing
3. Use descriptive commit messages
4. Notify team in chat after push

### For Team:
1. Pull updates daily before starting work
2. Always use setup script for consistency
3. Never manually edit seed files
4. Report data discrepancies immediately

## 📚 Documentation References

- **Full Workflow**: [DATABASE_SYNC_WORKFLOW.md](DATABASE_SYNC_WORKFLOW.md)
- **Quick Commands**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Team Setup**: [TEAM_SETUP_GUIDE.md](TEAM_SETUP_GUIDE.md)
- **Scripts Guide**: [backend/scripts/README.md](backend/scripts/README.md)
- **Database Docs**: [backend/DATABASE_README.md](backend/DATABASE_README.md)

## 🎓 Training Recommendations

### For New Team Members:
1. Read TEAM_SETUP_GUIDE.md first
2. Follow setup instructions step by step
3. Keep QUICK_REFERENCE.md handy
4. Ask questions early

### For Existing Team Members:
1. Review DATABASE_SYNC_WORKFLOW.md
2. Update local database: `.\scripts\setup_database.ps1`
3. Update .env: `DB_NAME=dashboard_bpk`
4. Test integration with frontend

## 🔮 Future Improvements

- [ ] Add automatic backup before setup
- [ ] Add data validation scripts
- [ ] Add rollback functionality
- [ ] Create GUI tool for non-technical users
- [ ] Add CI/CD integration for automatic testing

## 📞 Support

If you encounter issues:
1. Check QUICK_REFERENCE.md troubleshooting section
2. Review DATABASE_SYNC_WORKFLOW.md
3. Check PostgreSQL logs
4. Ask in team chat with:
   - Error message
   - Command you ran
   - Your environment (.env values)

---

**Update Date**: February 1, 2026
**Updated By**: Dashboard BPK Team
**Version**: 2.0
