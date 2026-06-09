package service

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestDetectActivityDelimiter(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		expect rune
	}{
		{name: "tab", input: "id\tid_trans\tuser_id\n1\tx\t2", expect: '\t'},
		{name: "semicolon", input: "id_trans;nama;aktifitas\nx;User;LOGIN", expect: ';'},
		{name: "comma", input: "id_trans,nama,aktifitas\nx,User,LOGIN", expect: ','},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if actual := detectActivityDelimiter(test.input); actual != test.expect {
				t.Fatalf("expected delimiter %q, got %q", test.expect, actual)
			}
		})
	}
}

func TestParseHeaderlessNormalizedActivity(t *testing.T) {
	idTrans := uuid.New()
	record := strings.Split(fmt.Sprintf(
		"99\t%s\t12\t\t6\t8\t97\t01-dashboard\tMenu\tSUCCESS\t2025-07-01 07:31:30.000 +0700\t2026-01-21 11:32:56.297 +0700",
		idTrans,
	), "\t")

	activity, err := parseHeaderlessNormalizedActivity(record)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}
	if activity.IDTrans != idTrans {
		t.Fatalf("expected id_trans %s, got %s", idTrans, activity.IDTrans)
	}
	if activity.UserID != 12 || activity.ActivityTypeID != 6 {
		t.Fatalf("unexpected required IDs: user=%d activity=%d", activity.UserID, activity.ActivityTypeID)
	}
	if activity.SatkerID != nil {
		t.Fatalf("expected empty satker_id")
	}
	if activity.Scope != "01-dashboard" || activity.DetailAktifitas != "Menu" {
		t.Fatalf("unexpected activity values: %#v", activity)
	}
	if _, offset := activity.Tanggal.Zone(); offset != 7*60*60 {
		t.Fatalf("expected +0700 timezone, got %s", activity.Tanggal)
	}
}

func TestParseNamedActivityAliases(t *testing.T) {
	idTrans := uuid.New()
	header := makeHeaderMap(strings.Split(
		"id_trans,nama,satker,aktivitas,scope,lokasi,cluster,tanggal,token,status,detail_aktivitas",
		",",
	))
	record := strings.Split(fmt.Sprintf(
		"%s,Rayhan,BPK Jawa Barat,LOGIN,success,Bandung,Internal,2025-07-01 07:31:30,abc,SUCCESS,Login aplikasi",
		idTrans,
	), ",")

	activity, err := parseNamedActivity(record, header)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}
	if activity.ActivityName != "LOGIN" || activity.DetailAktifitas != "Login aplikasi" {
		t.Fatalf("unexpected named activity: %#v", activity)
	}
}

func TestActivityImporterPostgres(t *testing.T) {
	if os.Getenv("RUN_DB_INTEGRATION") != "1" {
		t.Skip("set RUN_DB_INTEGRATION=1 to run the PostgreSQL integration test")
	}

	_ = godotenv.Load("../../.env")
	db, err := gorm.Open(postgres.Open(database.BuildDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("connect database: %v", err)
	}

	var sample entity.ActivityLog
	if err := db.Where(
		"satker_id IS NOT NULL AND cluster_id IS NOT NULL AND location_id IS NOT NULL",
	).First(&sample).Error; err != nil {
		t.Fatalf("load reference activity: %v", err)
	}

	tx := db.Begin()
	if tx.Error != nil {
		t.Fatalf("begin transaction: %v", tx.Error)
	}
	defer tx.Rollback()

	idTrans := uuid.New()
	row := fmt.Sprintf(
		"0\t%s\t%d\t%s\t%d\t%s\t%s\tintegration-test\tLOGIN\tSUCCESS\t%s\t%s\n",
		idTrans,
		sample.UserID,
		optionalIDValue(sample.SatkerID),
		sample.ActivityTypeID,
		optionalIDValue(sample.ClusterID),
		optionalIDValue(sample.LocationID),
		time.Now().Format("2006-01-02 15:04:05.000 -0700"),
		time.Now().Format("2006-01-02 15:04:05.000 -0700"),
	)

	importer := NewActivityImporter(tx)
	result, err := importer.Import(strings.NewReader(row))
	if err != nil {
		t.Fatalf("import row: %v", err)
	}
	if result.Inserted != 1 || result.Skipped != 0 {
		t.Fatalf("unexpected first result: %#v", result)
	}

	result, err = importer.Import(strings.NewReader(row))
	if err != nil {
		t.Fatalf("re-import row: %v", err)
	}
	if result.Duplicates != 1 || result.Inserted != 0 {
		t.Fatalf("expected duplicate on second import: %#v", result)
	}

	var count int64
	if err := tx.Model(&entity.ActivityLog{}).Where("id_trans = ?", idTrans).Count(&count).Error; err != nil {
		t.Fatalf("verify imported row: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected one imported row, got %d", count)
	}

	var (
		user         entity.UserProfile
		satker       entity.SatkerUnit
		activityType entity.ActivityType
		cluster      entity.Cluster
		location     entity.Location
	)
	if err := tx.First(&user, sample.UserID).Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	if err := tx.First(&satker, *sample.SatkerID).Error; err != nil {
		t.Fatalf("load satker: %v", err)
	}
	if err := tx.First(&activityType, sample.ActivityTypeID).Error; err != nil {
		t.Fatalf("load activity type: %v", err)
	}
	if err := tx.First(&cluster, *sample.ClusterID).Error; err != nil {
		t.Fatalf("load cluster: %v", err)
	}
	if err := tx.First(&location, *sample.LocationID).Error; err != nil {
		t.Fatalf("load location: %v", err)
	}

	namedCSV := fmt.Sprintf(
		"id_trans;nama;satker;aktifitas;scope;lokasi;cluster;tanggal;token;status;detail_aktifitas\n"+
			"%s;%s;%s;%s;%s;%s;%s;%s;%s;%s;%s\n",
		sample.IDTrans,
		user.Nama,
		satker.SatkerName,
		activityType.Name,
		sample.Scope,
		location.LocationName,
		cluster.Name,
		sample.Tanggal.Format(time.RFC3339),
		user.Token,
		sample.Status,
		sample.DetailAktifitas,
	)
	namedResult, err := NewActivityImporter(tx).Import(strings.NewReader(namedCSV))
	if err != nil {
		t.Fatalf("import named duplicate: %v", err)
	}
	if namedResult.Duplicates != 1 || namedResult.Skipped != 0 {
		t.Fatalf("expected named row to be detected as duplicate: %#v", namedResult)
	}
}

func optionalIDValue(value *int64) string {
	if value == nil {
		return ""
	}
	return fmt.Sprintf("%d", *value)
}
