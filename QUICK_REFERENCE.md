# 📋 Quick Reference - Database Sync

## 🎯 Common Commands

### Export Data (Owner)
```powershell
cd backend
.\scripts\export_current_data.ps1
Move-Item seeds\actlog_data_new.sql seeds\actlog_data.sql -Force
git add seeds\actlog_data.sql
git commit -m "chore: update seed data"
git push
```

### Import Data (Team)
```powershell
git pull
cd backend\scripts
.\setup_database.ps1
```

### Verify Data
```powershell
# Check row count
psql -U postgres -d dashboard_bpk -c "SELECT COUNT(*) FROM act_log;"

# Sample data
psql -U postgres -d dashboard_bpk -c "SELECT nama, lokasi, tanggal FROM act_log LIMIT 10;"
```

### Reset Database
```powershell
psql -U postgres -c "DROP DATABASE IF EXISTS dashboard_bpk;"
cd backend\scripts
.\setup_database.ps1
```

## 🔧 Troubleshooting

### pg_dump not found
```powershell
# Add to PATH
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

### Connection refused
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Start if stopped
Start-Service postgresql-x64-16
```

### Data mismatch
```powershell
# Hard reset
git checkout HEAD -- seeds\actlog_data.sql
git pull --force
psql -U postgres -c "DROP DATABASE IF EXISTS dashboard_bpk;"
.\backend\scripts\setup_database.ps1
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/seeds/actlog_data.sql` | Main seed file |
| `backend/.env` | Database credentials |
| `backend/scripts/export_current_data.ps1` | Export script |
| `backend/scripts/setup_database.ps1` | Setup script |
| `DATABASE_SYNC_WORKFLOW.md` | Full documentation |

## 🚦 Status Checks

```powershell
# Database exists?
psql -U postgres -l | Select-String "dashboard_bpk"

# Table exists?
psql -U postgres -d dashboard_bpk -c "\dt"

# Row count
psql -U postgres -d dashboard_bpk -c "SELECT COUNT(*) FROM act_log;"

# Recent data
psql -U postgres -d dashboard_bpk -c "SELECT tanggal FROM act_log ORDER BY tanggal DESC LIMIT 5;"
```

## 📞 Help

- **Scripts README**: `backend\scripts\README.md`
- **Full Workflow**: `DATABASE_SYNC_WORKFLOW.md`
- **Team Setup**: `TEAM_SETUP_GUIDE.md`
- **Database Docs**: `backend\DATABASE_README.md`

---

**Keep this file open while working!**

