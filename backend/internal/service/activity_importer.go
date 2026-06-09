package service

import (
	"bufio"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const maxReportedImportErrors = 20

type ImportRowError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

type ActivityImportResult struct {
	Format     string           `json:"format"`
	TotalRows  int              `json:"total_rows"`
	Inserted   int              `json:"inserted"`
	Duplicates int              `json:"duplicates"`
	Skipped    int              `json:"skipped"`
	Errors     []ImportRowError `json:"errors,omitempty"`
}

type activityImportMode int

const (
	importModeUnknown activityImportMode = iota
	importModeNormalized
	importModeNamed
)

type namedActivity struct {
	IDTrans         uuid.UUID
	Nama            string
	SatkerName      string
	ActivityName    string
	ClusterName     string
	LocationName    string
	Scope           string
	DetailAktifitas string
	Token           string
	Status          string
	Tanggal         time.Time
}

type ActivityImporter struct {
	db                *gorm.DB
	clusterCache      map[string]int64
	activityTypeCache map[string]int64
	locationCache     map[string]int64
	satkerCache       map[string]int64
	userCache         map[string]int64
}

func NewActivityImporter(db *gorm.DB) *ActivityImporter {
	return &ActivityImporter{
		db:                db,
		clusterCache:      make(map[string]int64),
		activityTypeCache: make(map[string]int64),
		locationCache:     make(map[string]int64),
		satkerCache:       make(map[string]int64),
		userCache:         make(map[string]int64),
	}
}

func (i *ActivityImporter) Import(input io.Reader) (ActivityImportResult, error) {
	result := ActivityImportResult{}
	if i.db == nil {
		return result, errors.New("database connection is not available")
	}

	reader, delimiter, err := newActivityCSVReader(input)
	if err != nil {
		return result, err
	}

	var (
		mode        activityImportMode
		header      map[string]int
		rowNumber   int
		initialized bool
	)

	for {
		record, readErr := reader.Read()
		if errors.Is(readErr, io.EOF) {
			break
		}

		rowNumber++
		if readErr != nil {
			result.TotalRows++
			result.Skipped++
			addImportError(&result, rowNumber, fmt.Sprintf("format baris tidak valid: %v", readErr))
			continue
		}
		if isEmptyRecord(record) {
			continue
		}

		if !initialized {
			if looksLikeActivityHeader(record) {
				header = makeHeaderMap(record)
				mode, err = detectImportMode(header)
				if err != nil {
					return result, err
				}
				result.Format = importFormatName(mode, delimiter, true)
				initialized = true
				continue
			}

			mode = importModeNormalized
			result.Format = importFormatName(mode, delimiter, false)
			initialized = true
		}

		result.TotalRows++

		switch mode {
		case importModeNormalized:
			var activity entity.ActivityLog
			if header == nil {
				activity, err = parseHeaderlessNormalizedActivity(record)
			} else {
				activity, err = parseNormalizedActivity(record, header)
			}
			if err == nil {
				err = i.insertActivity(&activity, &result)
			}
		case importModeNamed:
			var activity namedActivity
			activity, err = parseNamedActivity(record, header)
			if err == nil {
				err = i.insertNamedActivity(activity, &result)
			}
		default:
			err = errors.New("format import tidak dikenali")
		}

		if err != nil {
			result.Skipped++
			addImportError(&result, rowNumber, err.Error())
		}
	}

	if !initialized || result.TotalRows == 0 {
		return result, errors.New("file tidak memiliki baris data")
	}

	return result, nil
}

func newActivityCSVReader(input io.Reader) (*csv.Reader, rune, error) {
	buffered := bufio.NewReader(input)
	sample, err := buffered.Peek(4096)
	if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, bufio.ErrBufferFull) {
		return nil, 0, fmt.Errorf("gagal membaca file: %w", err)
	}
	if len(sample) == 0 {
		return nil, 0, errors.New("file kosong")
	}

	delimiter := detectActivityDelimiter(string(sample))
	if delimiter == 0 {
		return nil, 0, errors.New("delimiter tidak dikenali; gunakan koma, titik koma, atau tab")
	}

	reader := csv.NewReader(buffered)
	reader.Comma = delimiter
	reader.FieldsPerRecord = -1
	reader.LazyQuotes = true
	reader.TrimLeadingSpace = true
	return reader, delimiter, nil
}

func detectActivityDelimiter(sample string) rune {
	for _, line := range strings.Split(sample, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		counts := map[rune]int{
			'\t': strings.Count(line, "\t"),
			';':  strings.Count(line, ";"),
			',':  strings.Count(line, ","),
		}
		var delimiter rune
		best := 0
		for _, candidate := range []rune{'\t', ';', ','} {
			if counts[candidate] > best {
				delimiter = candidate
				best = counts[candidate]
			}
		}
		return delimiter
	}
	return 0
}

func looksLikeActivityHeader(record []string) bool {
	knownHeaders := map[string]bool{
		"id_trans": true, "user_id": true, "nama": true, "satker": true,
		"satker_id": true, "aktifitas": true, "aktivitas": true,
		"activity_type_id": true, "tanggal": true, "status": true,
	}
	for _, value := range record {
		if knownHeaders[normalizeHeader(value)] {
			return true
		}
	}
	return false
}

func makeHeaderMap(record []string) map[string]int {
	header := make(map[string]int, len(record))
	for index, value := range record {
		header[normalizeHeader(value)] = index
	}
	return header
}

func normalizeHeader(value string) string {
	value = strings.TrimPrefix(strings.TrimSpace(strings.ToLower(value)), "\ufeff")
	value = strings.ReplaceAll(value, " ", "_")
	value = strings.ReplaceAll(value, "-", "_")
	return value
}

func detectImportMode(header map[string]int) (activityImportMode, error) {
	if _, ok := header["id_trans"]; !ok {
		return importModeUnknown, errors.New("header wajib memiliki kolom id_trans")
	}
	if _, hasUserID := header["user_id"]; hasUserID {
		if _, hasActivityTypeID := header["activity_type_id"]; !hasActivityTypeID {
			return importModeUnknown, errors.New("header normalized wajib memiliki activity_type_id")
		}
		return importModeNormalized, nil
	}
	if _, hasName := header["nama"]; hasName {
		if _, hasActivity := header["aktifitas"]; !hasActivity {
			if _, hasActivity = header["aktivitas"]; !hasActivity {
				return importModeUnknown, errors.New("header wajib memiliki kolom aktifitas")
			}
		}
		if _, hasDate := header["tanggal"]; !hasDate {
			return importModeUnknown, errors.New("header wajib memiliki kolom tanggal")
		}
		return importModeNamed, nil
	}
	return importModeUnknown, errors.New("format header tidak dikenali")
}

func importFormatName(mode activityImportMode, delimiter rune, hasHeader bool) string {
	source := "normalized"
	if mode == importModeNamed {
		source = "named"
	}
	headerType := "tanpa header"
	if hasHeader {
		headerType = "dengan header"
	}
	return fmt.Sprintf("%s %s (%s)", source, delimiterName(delimiter), headerType)
}

func delimiterName(delimiter rune) string {
	switch delimiter {
	case '\t':
		return "TSV"
	case ';':
		return "CSV titik koma"
	default:
		return "CSV koma"
	}
}

func parseHeaderlessNormalizedActivity(record []string) (entity.ActivityLog, error) {
	if len(record) != 12 {
		return entity.ActivityLog{}, fmt.Errorf("jumlah kolom harus 12, ditemukan %d", len(record))
	}

	header := map[string]int{
		"id": 0, "id_trans": 1, "user_id": 2, "satker_id": 3,
		"activity_type_id": 4, "cluster_id": 5, "location_id": 6,
		"scope": 7, "detail_aktifitas": 8, "status": 9,
		"tanggal": 10, "created_at": 11,
	}
	return parseNormalizedActivity(record, header)
}

func parseNormalizedActivity(record []string, header map[string]int) (entity.ActivityLog, error) {
	idTrans, err := uuid.Parse(getRecordValue(record, header, "id_trans"))
	if err != nil {
		return entity.ActivityLog{}, errors.New("id_trans bukan UUID yang valid")
	}

	userID, err := parseRequiredInt64(getRecordValue(record, header, "user_id"), "user_id")
	if err != nil {
		return entity.ActivityLog{}, err
	}
	activityTypeID, err := parseRequiredInt64(getRecordValue(record, header, "activity_type_id"), "activity_type_id")
	if err != nil {
		return entity.ActivityLog{}, err
	}
	satkerID, err := parseOptionalInt64(getRecordValue(record, header, "satker_id"), "satker_id")
	if err != nil {
		return entity.ActivityLog{}, err
	}
	clusterID, err := parseOptionalInt64(getRecordValue(record, header, "cluster_id"), "cluster_id")
	if err != nil {
		return entity.ActivityLog{}, err
	}
	locationID, err := parseOptionalInt64(getRecordValue(record, header, "location_id"), "location_id")
	if err != nil {
		return entity.ActivityLog{}, err
	}

	tanggal, err := parseActivityTime(getRecordValue(record, header, "tanggal"))
	if err != nil {
		return entity.ActivityLog{}, fmt.Errorf("tanggal tidak valid: %w", err)
	}

	status := getRecordValue(record, header, "status")
	if status == "" {
		status = "SUCCESS"
	}

	activity := entity.ActivityLog{
		IDTrans:         idTrans,
		UserID:          userID,
		SatkerID:        satkerID,
		ActivityTypeID:  activityTypeID,
		ClusterID:       clusterID,
		LocationID:      locationID,
		Scope:           getRecordValue(record, header, "scope"),
		DetailAktifitas: firstRecordValue(record, header, "detail_aktifitas", "detail_aktivitas"),
		Status:          status,
		Tanggal:         tanggal,
	}

	if createdAtValue := getRecordValue(record, header, "created_at"); createdAtValue != "" {
		createdAt, parseErr := parseActivityTime(createdAtValue)
		if parseErr != nil {
			return entity.ActivityLog{}, fmt.Errorf("created_at tidak valid: %w", parseErr)
		}
		activity.CreatedAt = createdAt
	}

	return activity, nil
}

func parseNamedActivity(record []string, header map[string]int) (namedActivity, error) {
	idTrans, err := uuid.Parse(getRecordValue(record, header, "id_trans"))
	if err != nil {
		return namedActivity{}, errors.New("id_trans bukan UUID yang valid")
	}

	nama := getRecordValue(record, header, "nama")
	if nama == "" {
		return namedActivity{}, errors.New("nama wajib diisi")
	}
	activityName := firstRecordValue(record, header, "aktifitas", "aktivitas")
	if activityName == "" {
		return namedActivity{}, errors.New("aktifitas wajib diisi")
	}
	tanggal, err := parseActivityTime(getRecordValue(record, header, "tanggal"))
	if err != nil {
		return namedActivity{}, fmt.Errorf("tanggal tidak valid: %w", err)
	}

	status := getRecordValue(record, header, "status")
	if status == "" {
		status = "SUCCESS"
	}

	return namedActivity{
		IDTrans:         idTrans,
		Nama:            nama,
		SatkerName:      firstRecordValue(record, header, "satker", "satker_name"),
		ActivityName:    activityName,
		ClusterName:     firstRecordValue(record, header, "cluster", "cluster_name"),
		LocationName:    firstRecordValue(record, header, "lokasi", "location", "location_name"),
		Scope:           getRecordValue(record, header, "scope"),
		DetailAktifitas: firstRecordValue(record, header, "detail_aktifitas", "detail_aktivitas"),
		Token:           getRecordValue(record, header, "token"),
		Status:          status,
		Tanggal:         tanggal,
	}, nil
}

func parseRequiredInt64(value, column string) (int64, error) {
	value = strings.TrimSpace(value)
	if value == "" || strings.EqualFold(value, "null") {
		return 0, fmt.Errorf("%s wajib diisi", column)
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil || parsed <= 0 {
		return 0, fmt.Errorf("%s harus berupa angka positif", column)
	}
	return parsed, nil
}

func parseOptionalInt64(value, column string) (*int64, error) {
	value = strings.TrimSpace(value)
	if value == "" || strings.EqualFold(value, "null") {
		return nil, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil || parsed <= 0 {
		return nil, fmt.Errorf("%s harus berupa angka positif atau kosong", column)
	}
	return &parsed, nil
}

func parseActivityTime(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	layouts := []string{
		"2006-01-02 15:04:05.999999999 -0700",
		"2006-01-02 15:04:05 -0700",
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05",
		"02/01/2006 15:04",
		time.RFC3339Nano,
		time.RFC3339,
	}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed, nil
		}
	}
	return time.Time{}, fmt.Errorf("format %q tidak didukung", value)
}

func getRecordValue(record []string, header map[string]int, column string) string {
	index, ok := header[column]
	if !ok || index < 0 || index >= len(record) {
		return ""
	}
	return strings.TrimSpace(record[index])
}

func firstRecordValue(record []string, header map[string]int, columns ...string) string {
	for _, column := range columns {
		if value := getRecordValue(record, header, column); value != "" {
			return value
		}
	}
	return ""
}

func isEmptyRecord(record []string) bool {
	for _, value := range record {
		if strings.TrimSpace(value) != "" {
			return false
		}
	}
	return true
}

func addImportError(result *ActivityImportResult, row int, message string) {
	if len(result.Errors) >= maxReportedImportErrors {
		return
	}
	result.Errors = append(result.Errors, ImportRowError{Row: row, Message: message})
}

func (i *ActivityImporter) insertActivity(activity *entity.ActivityLog, result *ActivityImportResult) error {
	query := i.db.Omit(clause.Associations).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id_trans"}},
		DoNothing: true,
	}).Create(activity)
	if query.Error != nil {
		return fmt.Errorf("gagal menyimpan data: %w", query.Error)
	}
	if query.RowsAffected == 0 {
		result.Duplicates++
		return nil
	}
	result.Inserted++
	return nil
}

func (i *ActivityImporter) insertNamedActivity(input namedActivity, result *ActivityImportResult) error {
	var clusterID *int64
	if input.ClusterName != "" {
		id, err := i.getOrCreateCluster(input.ClusterName)
		if err != nil {
			return err
		}
		clusterID = &id
	}

	activityTypeID, err := i.getOrCreateActivityType(input.ActivityName)
	if err != nil {
		return err
	}

	var locationID *int64
	if input.LocationName != "" {
		id, err := i.getOrCreateLocation(input.LocationName, extractProvince(input.SatkerName))
		if err != nil {
			return err
		}
		locationID = &id
	}

	var satkerID *int64
	if input.SatkerName != "" {
		id, err := i.getOrCreateSatker(input.SatkerName)
		if err != nil {
			return err
		}
		satkerID = &id
	}

	userID, err := i.getOrCreateUser(input.Nama, input.Token, satkerID)
	if err != nil {
		return err
	}

	return i.insertActivity(&entity.ActivityLog{
		IDTrans:         input.IDTrans,
		UserID:          userID,
		SatkerID:        satkerID,
		ActivityTypeID:  activityTypeID,
		ClusterID:       clusterID,
		LocationID:      locationID,
		Scope:           input.Scope,
		DetailAktifitas: input.DetailAktifitas,
		Status:          input.Status,
		Tanggal:         input.Tanggal,
	}, result)
}

func (i *ActivityImporter) getOrCreateCluster(name string) (int64, error) {
	key := strings.ToLower(name)
	if id, ok := i.clusterCache[key]; ok {
		return id, nil
	}
	var cluster entity.Cluster
	if err := i.db.Where("name = ?", name).FirstOrCreate(&cluster, entity.Cluster{Name: name}).Error; err != nil {
		return 0, fmt.Errorf("gagal menyimpan cluster: %w", err)
	}
	i.clusterCache[key] = cluster.ID
	return cluster.ID, nil
}

func (i *ActivityImporter) getOrCreateActivityType(name string) (int64, error) {
	key := strings.ToLower(name)
	if id, ok := i.activityTypeCache[key]; ok {
		return id, nil
	}
	var activityType entity.ActivityType
	if err := i.db.Where("name = ?", name).FirstOrCreate(&activityType, entity.ActivityType{Name: name}).Error; err != nil {
		return 0, fmt.Errorf("gagal menyimpan jenis aktivitas: %w", err)
	}
	i.activityTypeCache[key] = activityType.ID
	return activityType.ID, nil
}

func (i *ActivityImporter) getOrCreateLocation(name, province string) (int64, error) {
	key := strings.ToLower(name)
	if id, ok := i.locationCache[key]; ok {
		return id, nil
	}
	var location entity.Location
	err := i.db.Where("location_name = ?", name).First(&location).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		location = entity.Location{
			LocationName: name,
			Province:     province,
		}
		if err = i.db.Create(&location).Error; err != nil {
			return 0, fmt.Errorf("gagal menyimpan lokasi: %w", err)
		}
	} else if err != nil {
		return 0, fmt.Errorf("gagal mencari lokasi: %w", err)
	}
	i.locationCache[key] = location.ID
	return location.ID, nil
}

func (i *ActivityImporter) getOrCreateSatker(name string) (int64, error) {
	key := strings.ToLower(name)
	if id, ok := i.satkerCache[key]; ok {
		return id, nil
	}
	var satker entity.SatkerUnit
	if err := i.db.Where("satker_name = ?", name).FirstOrCreate(&satker, entity.SatkerUnit{SatkerName: name}).Error; err != nil {
		return 0, fmt.Errorf("gagal menyimpan satker: %w", err)
	}
	i.satkerCache[key] = satker.ID
	return satker.ID, nil
}

func (i *ActivityImporter) getOrCreateUser(name, token string, satkerID *int64) (int64, error) {
	if strings.EqualFold(token, "null") {
		token = ""
	}
	key := strings.ToLower(name) + "|" + token
	if id, ok := i.userCache[key]; ok {
		return id, nil
	}

	var user entity.UserProfile
	query := i.db.Where("nama = ?", name)
	if token != "" {
		query = query.Where("token = ?", token)
	}
	err := query.First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		user = entity.UserProfile{
			Nama:     name,
			Token:    token,
			SatkerID: satkerID,
			IsActive: true,
		}
		if err = i.db.Create(&user).Error; err != nil {
			return 0, fmt.Errorf("gagal menyimpan profil pengguna: %w", err)
		}
	} else if err != nil {
		return 0, fmt.Errorf("gagal mencari profil pengguna: %w", err)
	}

	i.userCache[key] = user.ID
	return user.ID, nil
}

func extractProvince(satker string) string {
	satker = strings.ToLower(satker)
	provinces := []string{
		"aceh", "sumatera utara", "sumatera barat", "riau", "jambi",
		"sumatera selatan", "bengkulu", "lampung", "kepulauan bangka belitung",
		"kepulauan riau", "dki jakarta", "jawa barat", "jawa tengah",
		"di yogyakarta", "yogyakarta", "jawa timur", "banten", "bali",
		"nusa tenggara barat", "nusa tenggara timur", "kalimantan barat",
		"kalimantan tengah", "kalimantan selatan", "kalimantan timur",
		"kalimantan utara", "sulawesi utara", "sulawesi tengah",
		"sulawesi selatan", "sulawesi tenggara", "gorontalo", "sulawesi barat",
		"maluku", "maluku utara", "papua", "papua barat", "papua selatan",
		"papua tengah", "papua pegunungan", "papua barat daya",
	}

	for _, province := range provinces {
		if strings.Contains(satker, province) {
			words := strings.Split(province, " ")
			for index, word := range words {
				if word != "" {
					words[index] = strings.ToUpper(word[:1]) + word[1:]
				}
			}
			return strings.Join(words, " ")
		}
	}
	return "Lainnya"
}
