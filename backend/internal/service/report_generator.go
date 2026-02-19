package service

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
)

// ReportMetadata contains metadata for report generation
type ReportMetadata struct {
	GeneratedBy string
	Username    string
	Email       string
	DateRange   string
}

// ReportGenerator handles report file generation
type ReportGenerator struct {
	OutputDir string
}

// NewReportGenerator creates a new report generator
func NewReportGenerator(outputDir string) *ReportGenerator {
	return &ReportGenerator{
		OutputDir: outputDir,
	}
}

// GenerateCSV generates a CSV report file
func (rg *ReportGenerator) GenerateCSV(templateID string, data *repository.ReportData, metadata ReportMetadata) (string, error) {
	switch templateID {
	case "org-performance":
		return rg.generateOrgPerformanceCSV(data, metadata)
	case "user-activity":
		return rg.generateUserActivityCSV(data, metadata)
	case "feature-usage":
		return rg.generateFeatureUsageCSV(data, metadata)
	default:
		return "", fmt.Errorf("unknown template ID: %s", templateID)
	}
}

// GenerateExcel generates an Excel report file
func (rg *ReportGenerator) GenerateExcel(templateID string, data *repository.ReportData, metadata ReportMetadata) (string, error) {
	switch templateID {
	case "org-performance":
		return rg.generateOrgPerformanceExcel(data, metadata)
	case "user-activity":
		return rg.generateUserActivityExcel(data, metadata)
	case "feature-usage":
		return rg.generateFeatureUsageExcel(data, metadata)
	default:
		return "", fmt.Errorf("unknown template ID: %s", templateID)
	}
}

// GeneratePDF generates a PDF report file
func (rg *ReportGenerator) GeneratePDF(templateID string, data *repository.ReportData, metadata ReportMetadata) (string, error) {
	switch templateID {
	case "org-performance":
		return rg.generateOrgPerformancePDF(data, metadata)
	case "user-activity":
		return rg.generateUserActivityPDF(data, metadata)
	case "feature-usage":
		return rg.generateFeatureUsagePDF(data, metadata)
	default:
		return "", fmt.Errorf("unknown template ID: %s", templateID)
	}
}

func (rg *ReportGenerator) generateFilename(templateID, format string) string {
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%s.%s", templateID, timestamp, strings.ToLower(format))
	return filepath.Join(rg.OutputDir, filename)
}

func (rg *ReportGenerator) writeCSVFile(filename, content string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.WriteString(content)
	return err
}

func formatNumber(n int) string {
	str := fmt.Sprintf("%d", n)
	if len(str) <= 3 {
		return str
	}

	result := ""
	for i, c := range str {
		if i > 0 && (len(str)-i)%3 == 0 {
			result += "."
		}
		result += string(c)
	}
	return result
}

func calculatePercentage(part, total int) string {
	if total == 0 {
		return "0.00"
	}
	return fmt.Sprintf("%.2f", float64(part)/float64(total)*100)
}

// CSV Generators Implementation

func (rg *ReportGenerator) generateOrgPerformanceCSV(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_kinerja_organisasi", "csv")

	var content strings.Builder

	// Header metadata
	content.WriteString("LAPORAN KINERJA ORGANISASI\n")
	content.WriteString(fmt.Sprintf("Dibuat oleh: %s (%s)\n", metadata.Username, metadata.Email))
	content.WriteString(fmt.Sprintf("Tanggal Dibuat: %s\n", data.GeneratedAt.Format("02 January 2006 15:04:05")))
	content.WriteString(fmt.Sprintf("Periode Data: %s\n", data.Period))
	content.WriteString("\n")

	// Summary section
	content.WriteString("RINGKASAN\n")
	totalActivities := int(data.Summary["total_activities"].(int))
	totalUsers := int(data.Summary["total_users"].(int))
	content.WriteString(fmt.Sprintf("Total Aktivitas: %s\n", formatNumber(totalActivities)))
	content.WriteString(fmt.Sprintf("Total Organisasi: %d\n", len(data.Details)))
	content.WriteString(fmt.Sprintf("Total Pengguna: %s\n", formatNumber(totalUsers)))
	content.WriteString("\n")

	// Data table
	content.WriteString("DETAIL PER ORGANISASI\n")
	content.WriteString("No,Satker,Jumlah Aktivitas,Persentase dari Total (%)\n")

	for i, detail := range data.Details {
		satker := detail["satker"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalActivities)

		content.WriteString(fmt.Sprintf("%d,\"%s\",%d,%s\n", i+1, satker, count, percentage))
	}

	// Footer
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("Laporan dibuat oleh: %s\n", metadata.GeneratedBy))
	content.WriteString(fmt.Sprintf("Tanggal: %s\n", time.Now().Format("02/01/2006 15:04:05")))

	return filename, rg.writeCSVFile(filename, content.String())
}

func (rg *ReportGenerator) generateUserActivityCSV(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_aktivitas_pengguna", "csv")

	var content strings.Builder

	// Header metadata
	content.WriteString("LAPORAN AKTIVITAS PENGGUNA\n")
	content.WriteString(fmt.Sprintf("Dibuat oleh: %s (%s)\n", metadata.Username, metadata.Email))
	content.WriteString(fmt.Sprintf("Tanggal Dibuat: %s\n", data.GeneratedAt.Format("02 January 2006 15:04:05")))
	content.WriteString(fmt.Sprintf("Periode Data: %s\n", data.Period))
	content.WriteString("\n")

	// Login statistics section
	content.WriteString("STATISTIK LOGIN\n")
	totalLogins := int(data.Summary["total_logins"].(int))
	successLogins := int(data.Summary["success_logins"].(int))
	failedLogins := int(data.Summary["failed_logins"].(int))

	content.WriteString(fmt.Sprintf("Total Login: %s\n", formatNumber(totalLogins)))
	content.WriteString(fmt.Sprintf("Login Berhasil: %s\n", formatNumber(successLogins)))
	content.WriteString(fmt.Sprintf("Login Gagal: %s\n", formatNumber(failedLogins)))

	var successRate string
	if totalLogins > 0 {
		successRate = calculatePercentage(successLogins, totalLogins)
	} else {
		successRate = "0.00"
	}
	content.WriteString(fmt.Sprintf("Tingkat Keberhasilan: %s%%\n", successRate))
	content.WriteString("\n")

	// User activity table
	content.WriteString("DETAIL AKTIVITAS PER PENGGUNA\n")
	content.WriteString("No,Username,Total Aktivitas,Persentase dari Total (%)\n")

	// Calculate total activities for percentage
	totalActivities := 0
	for _, detail := range data.Details {
		totalActivities += int(detail["count"].(int))
	}

	for i, detail := range data.Details {
		username := detail["username"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalActivities)

		content.WriteString(fmt.Sprintf("%d,\"%s\",%d,%s\n", i+1, username, count, percentage))
	}

	// Footer
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("Laporan dibuat oleh: %s\n", metadata.GeneratedBy))
	content.WriteString(fmt.Sprintf("Tanggal: %s\n", time.Now().Format("02/01/2006 15:04:05")))

	return filename, rg.writeCSVFile(filename, content.String())
}

func (rg *ReportGenerator) generateFeatureUsageCSV(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_pemanfaatan_fitur", "csv")

	var content strings.Builder

	// Header metadata
	content.WriteString("LAPORAN PEMANFAATAN FITUR\n")
	content.WriteString(fmt.Sprintf("Dibuat oleh: %s (%s)\n", metadata.Username, metadata.Email))
	content.WriteString(fmt.Sprintf("Tanggal Dibuat: %s\n", data.GeneratedAt.Format("02 January 2006 15:04:05")))
	content.WriteString(fmt.Sprintf("Periode Data: %s\n", data.Period))
	content.WriteString("\n")

	// Summary section
	content.WriteString("RINGKASAN PENGGUNAAN\n")
	totalViews := int(data.Summary["total_views"].(int))
	totalDownloads := int(data.Summary["total_downloads"].(int))
	totalSearches := int(data.Summary["total_searches"].(int))

	content.WriteString(fmt.Sprintf("Total View: %s\n", formatNumber(totalViews)))
	content.WriteString(fmt.Sprintf("Total Download: %s\n", formatNumber(totalDownloads)))
	content.WriteString(fmt.Sprintf("Total Pencarian: %s\n", formatNumber(totalSearches)))
	content.WriteString("\n")

	// Feature usage table
	content.WriteString("DETAIL PENGGUNAAN FITUR\n")
	content.WriteString("No,Nama Fitur/Aktivitas,Jumlah Penggunaan,Persentase dari Total (%),Kategori\n")

	// Calculate total for percentage
	totalUsage := 0
	for _, detail := range data.Details {
		totalUsage += int(detail["count"].(int))
	}

	for i, detail := range data.Details {
		feature := detail["feature"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalUsage)

		// Determine category based on feature name
		category := categorizeFeature(feature)

		content.WriteString(fmt.Sprintf("%d,\"%s\",%d,%s,%s\n", i+1, feature, count, percentage, category))
	}

	// Footer
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("Laporan dibuat oleh: %s\n", metadata.GeneratedBy))
	content.WriteString(fmt.Sprintf("Tanggal: %s\n", time.Now().Format("02/01/2006 15:04:05")))

	return filename, rg.writeCSVFile(filename, content.String())
}

func categorizeFeature(feature string) string {
	featureLower := strings.ToLower(feature)

	if strings.Contains(featureLower, "view") {
		return "View"
	} else if strings.Contains(featureLower, "download") {
		return "Download"
	} else if strings.Contains(featureLower, "search") || strings.Contains(featureLower, "pencarian") {
		return "Search"
	} else if strings.Contains(featureLower, "login") {
		return "Authentication"
	} else if strings.Contains(featureLower, "export") {
		return "Export"
	}

	return "Other"
}

// Excel Generators Implementation

func (rg *ReportGenerator) generateOrgPerformanceExcel(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_kinerja_organisasi", "xlsx")

	f := excelize.NewFile()
	defer f.Close()

	// Create sheets
	summarySheet := "Ringkasan"
	detailSheet := "Detail per Satker"

	f.SetSheetName("Sheet1", summarySheet)
	f.NewSheet(detailSheet)

	// Style definitions
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#4472C4"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14},
	})

	cellStyle, _ := f.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	// Summary Sheet
	f.SetCellValue(summarySheet, "A1", "LAPORAN KINERJA ORGANISASI")
	f.SetCellStyle(summarySheet, "A1", "A1", titleStyle)
	f.MergeCell(summarySheet, "A1", "D1")

	f.SetCellValue(summarySheet, "A3", "Dibuat oleh:")
	f.SetCellValue(summarySheet, "B3", fmt.Sprintf("%s (%s)", metadata.Username, metadata.Email))
	f.SetCellValue(summarySheet, "A4", "Tanggal Dibuat:")
	f.SetCellValue(summarySheet, "B4", data.GeneratedAt.Format("02 January 2006 15:04:05"))
	f.SetCellValue(summarySheet, "A5", "Periode Data:")
	f.SetCellValue(summarySheet, "B5", data.Period)

	totalActivities := int(data.Summary["total_activities"].(int))
	totalUsers := int(data.Summary["total_users"].(int))

	f.SetCellValue(summarySheet, "A7", "RINGKASAN")
	f.SetCellStyle(summarySheet, "A7", "A7", titleStyle)
	f.SetCellValue(summarySheet, "A8", "Total Aktivitas:")
	f.SetCellValue(summarySheet, "B8", totalActivities)
	f.SetCellValue(summarySheet, "A9", "Total Organisasi:")
	f.SetCellValue(summarySheet, "B9", len(data.Details))
	f.SetCellValue(summarySheet, "A10", "Total Pengguna:")
	f.SetCellValue(summarySheet, "B10", totalUsers)

	// Set column widths
	f.SetColWidth(summarySheet, "A", "A", 20)
	f.SetColWidth(summarySheet, "B", "B", 40)

	// Detail Sheet
	f.SetCellValue(detailSheet, "A1", "No")
	f.SetCellValue(detailSheet, "B1", "Satker")
	f.SetCellValue(detailSheet, "C1", "Jumlah Aktivitas")
	f.SetCellValue(detailSheet, "D1", "Persentase (%)")
	f.SetCellStyle(detailSheet, "A1", "D1", headerStyle)

	for i, detail := range data.Details {
		row := i + 2
		satker := detail["satker"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalActivities)

		f.SetCellValue(detailSheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(detailSheet, fmt.Sprintf("B%d", row), satker)
		f.SetCellValue(detailSheet, fmt.Sprintf("C%d", row), count)
		f.SetCellValue(detailSheet, fmt.Sprintf("D%d", row), percentage)

		f.SetCellStyle(detailSheet, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), cellStyle)
	}

	// Set column widths
	f.SetColWidth(detailSheet, "A", "A", 8)
	f.SetColWidth(detailSheet, "B", "B", 50)
	f.SetColWidth(detailSheet, "C", "C", 20)
	f.SetColWidth(detailSheet, "D", "D", 15)

	// Enable auto filter
	lastRow := len(data.Details) + 1
	f.AutoFilter(detailSheet, fmt.Sprintf("A1:D%d", lastRow), []excelize.AutoFilterOptions{})

	if err := f.SaveAs(filename); err != nil {
		return "", err
	}

	return filename, nil
}

func (rg *ReportGenerator) generateUserActivityExcel(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_aktivitas_pengguna", "xlsx")

	f := excelize.NewFile()
	defer f.Close()

	// Create sheets
	summarySheet := "Ringkasan"
	detailSheet := "Aktivitas per User"

	f.SetSheetName("Sheet1", summarySheet)
	f.NewSheet(detailSheet)

	// Style definitions
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#70AD47"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14},
	})

	cellStyle, _ := f.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	// Summary Sheet
	f.SetCellValue(summarySheet, "A1", "LAPORAN AKTIVITAS PENGGUNA")
	f.SetCellStyle(summarySheet, "A1", "A1", titleStyle)
	f.MergeCell(summarySheet, "A1", "D1")

	f.SetCellValue(summarySheet, "A3", "Dibuat oleh:")
	f.SetCellValue(summarySheet, "B3", fmt.Sprintf("%s (%s)", metadata.Username, metadata.Email))
	f.SetCellValue(summarySheet, "A4", "Tanggal Dibuat:")
	f.SetCellValue(summarySheet, "B4", data.GeneratedAt.Format("02 January 2006 15:04:05"))
	f.SetCellValue(summarySheet, "A5", "Periode Data:")
	f.SetCellValue(summarySheet, "B5", data.Period)

	totalLogins := int(data.Summary["total_logins"].(int))
	successLogins := int(data.Summary["success_logins"].(int))
	failedLogins := int(data.Summary["failed_logins"].(int))

	f.SetCellValue(summarySheet, "A7", "STATISTIK LOGIN")
	f.SetCellStyle(summarySheet, "A7", "A7", titleStyle)
	f.SetCellValue(summarySheet, "A8", "Total Login:")
	f.SetCellValue(summarySheet, "B8", totalLogins)
	f.SetCellValue(summarySheet, "A9", "Login Berhasil:")
	f.SetCellValue(summarySheet, "B9", successLogins)
	f.SetCellValue(summarySheet, "A10", "Login Gagal:")
	f.SetCellValue(summarySheet, "B10", failedLogins)

	var successRate float64
	if totalLogins > 0 {
		successRate = float64(successLogins) / float64(totalLogins) * 100
	}
	f.SetCellValue(summarySheet, "A11", "Tingkat Keberhasilan:")
	f.SetCellValue(summarySheet, "B11", fmt.Sprintf("%.2f%%", successRate))

	// Set column widths
	f.SetColWidth(summarySheet, "A", "A", 25)
	f.SetColWidth(summarySheet, "B", "B", 40)

	// Detail Sheet
	f.SetCellValue(detailSheet, "A1", "No")
	f.SetCellValue(detailSheet, "B1", "Username")
	f.SetCellValue(detailSheet, "C1", "Total Aktivitas")
	f.SetCellValue(detailSheet, "D1", "Persentase (%)")
	f.SetCellStyle(detailSheet, "A1", "D1", headerStyle)

	// Calculate total activities
	totalActivities := 0
	for _, detail := range data.Details {
		totalActivities += int(detail["count"].(int))
	}

	for i, detail := range data.Details {
		row := i + 2
		username := detail["username"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalActivities)

		f.SetCellValue(detailSheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(detailSheet, fmt.Sprintf("B%d", row), username)
		f.SetCellValue(detailSheet, fmt.Sprintf("C%d", row), count)
		f.SetCellValue(detailSheet, fmt.Sprintf("D%d", row), percentage)

		f.SetCellStyle(detailSheet, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), cellStyle)
	}

	// Set column widths
	f.SetColWidth(detailSheet, "A", "A", 8)
	f.SetColWidth(detailSheet, "B", "B", 30)
	f.SetColWidth(detailSheet, "C", "C", 20)
	f.SetColWidth(detailSheet, "D", "D", 15)

	// Enable auto filter
	lastRow := len(data.Details) + 1
	f.AutoFilter(detailSheet, fmt.Sprintf("A1:D%d", lastRow), []excelize.AutoFilterOptions{})

	// Freeze panes
	f.SetPanes(detailSheet, &excelize.Panes{
		Freeze: true,
		YSplit: 1,
	})

	if err := f.SaveAs(filename); err != nil {
		return "", err
	}

	return filename, nil
}

func (rg *ReportGenerator) generateFeatureUsageExcel(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_pemanfaatan_fitur", "xlsx")

	f := excelize.NewFile()
	defer f.Close()

	// Create sheets
	summarySheet := "Dashboard"
	detailSheet := "Detail Lengkap"

	f.SetSheetName("Sheet1", summarySheet)
	f.NewSheet(detailSheet)

	// Style definitions
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#FFC000"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14},
	})

	cellStyle, _ := f.NewStyle(&excelize.Style{
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1},
			{Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1},
			{Type: "right", Color: "000000", Style: 1},
		},
	})

	// Summary Sheet
	f.SetCellValue(summarySheet, "A1", "LAPORAN PEMANFAATAN FITUR")
	f.SetCellStyle(summarySheet, "A1", "A1", titleStyle)
	f.MergeCell(summarySheet, "A1", "D1")

	f.SetCellValue(summarySheet, "A3", "Dibuat oleh:")
	f.SetCellValue(summarySheet, "B3", fmt.Sprintf("%s (%s)", metadata.Username, metadata.Email))
	f.SetCellValue(summarySheet, "A4", "Tanggal Dibuat:")
	f.SetCellValue(summarySheet, "B4", data.GeneratedAt.Format("02 January 2006 15:04:05"))
	f.SetCellValue(summarySheet, "A5", "Periode Data:")
	f.SetCellValue(summarySheet, "B5", data.Period)

	totalViews := int(data.Summary["total_views"].(int))
	totalDownloads := int(data.Summary["total_downloads"].(int))
	totalSearches := int(data.Summary["total_searches"].(int))

	f.SetCellValue(summarySheet, "A7", "RINGKASAN PENGGUNAAN")
	f.SetCellStyle(summarySheet, "A7", "A7", titleStyle)
	f.SetCellValue(summarySheet, "A8", "Total View:")
	f.SetCellValue(summarySheet, "B8", totalViews)
	f.SetCellValue(summarySheet, "A9", "Total Download:")
	f.SetCellValue(summarySheet, "B9", totalDownloads)
	f.SetCellValue(summarySheet, "A10", "Total Pencarian:")
	f.SetCellValue(summarySheet, "B10", totalSearches)

	// Add top 15 features for chart
	f.SetCellValue(summarySheet, "A12", "TOP 15 FITUR PALING BANYAK DIGUNAKAN")
	f.SetCellStyle(summarySheet, "A12", "A12", titleStyle)
	f.SetCellValue(summarySheet, "A13", "Fitur")
	f.SetCellValue(summarySheet, "B13", "Jumlah")
	f.SetCellStyle(summarySheet, "A13", "B13", headerStyle)

	limit := 15
	if len(data.Details) < limit {
		limit = len(data.Details)
	}

	for i := 0; i < limit; i++ {
		row := i + 14
		feature := data.Details[i]["feature"].(string)
		count := int(data.Details[i]["count"].(int))

		f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), feature)
		f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), count)
		f.SetCellStyle(summarySheet, fmt.Sprintf("A%d", row), fmt.Sprintf("B%d", row), cellStyle)
	}

	// Add bar chart
	lastChartRow := 13 + limit
	if err := f.AddChart(summarySheet, "D13", &excelize.Chart{
		Type: excelize.Bar,
		Series: []excelize.ChartSeries{
			{
				Name:       "Jumlah Penggunaan",
				Categories: fmt.Sprintf("%s!$A$14:$A$%d", summarySheet, lastChartRow),
				Values:     fmt.Sprintf("%s!$B$14:$B$%d", summarySheet, lastChartRow),
			},
		},
		Title: []excelize.RichTextRun{
			{Text: "Top 15 Fitur Paling Banyak Digunakan"},
		},
		Legend: excelize.ChartLegend{Position: "bottom"},
		Dimension: excelize.ChartDimension{
			Width:  600,
			Height: 400,
		},
	}); err != nil {
		// Chart creation is optional, continue without it
	}

	// Set column widths
	f.SetColWidth(summarySheet, "A", "A", 40)
	f.SetColWidth(summarySheet, "B", "B", 20)

	// Detail Sheet - All data
	f.SetCellValue(detailSheet, "A1", "No")
	f.SetCellValue(detailSheet, "B1", "Nama Fitur/Aktivitas")
	f.SetCellValue(detailSheet, "C1", "Jumlah Penggunaan")
	f.SetCellValue(detailSheet, "D1", "Persentase (%)")
	f.SetCellValue(detailSheet, "E1", "Kategori")
	f.SetCellStyle(detailSheet, "A1", "E1", headerStyle)

	// Calculate total
	totalUsage := 0
	for _, detail := range data.Details {
		totalUsage += int(detail["count"].(int))
	}

	for i, detail := range data.Details {
		row := i + 2
		feature := detail["feature"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalUsage)
		category := categorizeFeature(feature)

		f.SetCellValue(detailSheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(detailSheet, fmt.Sprintf("B%d", row), feature)
		f.SetCellValue(detailSheet, fmt.Sprintf("C%d", row), count)
		f.SetCellValue(detailSheet, fmt.Sprintf("D%d", row), percentage)
		f.SetCellValue(detailSheet, fmt.Sprintf("E%d", row), category)

		f.SetCellStyle(detailSheet, fmt.Sprintf("A%d", row), fmt.Sprintf("E%d", row), cellStyle)
	}

	// Set column widths
	f.SetColWidth(detailSheet, "A", "A", 8)
	f.SetColWidth(detailSheet, "B", "B", 40)
	f.SetColWidth(detailSheet, "C", "C", 20)
	f.SetColWidth(detailSheet, "D", "D", 15)
	f.SetColWidth(detailSheet, "E", "E", 15)

	// Enable auto filter
	lastRow := len(data.Details) + 1
	f.AutoFilter(detailSheet, fmt.Sprintf("A1:E%d", lastRow), []excelize.AutoFilterOptions{})

	if err := f.SaveAs(filename); err != nil {
		return "", err
	}

	return filename, nil
}

// PDF Generators Implementation

func (rg *ReportGenerator) generateOrgPerformancePDF(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_kinerja_organisasi", "pdf")

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "LAPORAN KINERJA ORGANISASI")
	pdf.Ln(12)

	// Metadata
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 6, "Dibuat oleh:")
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 6, fmt.Sprintf("%s (%s)", metadata.Username, metadata.Email))
	pdf.Ln(6)

	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 6, "Tanggal Dibuat:")
	pdf.Cell(0, 6, data.GeneratedAt.Format("02 January 2006 15:04:05"))
	pdf.Ln(6)

	pdf.Cell(40, 6, "Periode Data:")
	pdf.Cell(0, 6, data.Period)
	pdf.Ln(10)

	// Summary Box
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "RINGKASAN")
	pdf.Ln(8)

	totalActivities := int(data.Summary["total_activities"].(int))
	totalUsers := int(data.Summary["total_users"].(int))

	pdf.SetFillColor(240, 240, 240)
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(95, 8, "Total Aktivitas:", "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 8, formatNumber(totalActivities), "1", 1, "R", true, 0, "")

	pdf.CellFormat(95, 8, "Total Organisasi:", "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 8, fmt.Sprintf("%d", len(data.Details)), "1", 1, "R", true, 0, "")

	pdf.CellFormat(95, 8, "Total Pengguna:", "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 8, formatNumber(totalUsers), "1", 1, "R", true, 0, "")
	pdf.Ln(10)

	// Data Table
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "DETAIL PER ORGANISASI")
	pdf.Ln(8)

	// Table header
	pdf.SetFillColor(68, 114, 196)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(10, 8, "No", "1", 0, "C", true, 0, "")
	pdf.CellFormat(110, 8, "Satker", "1", 0, "C", true, 0, "")
	pdf.CellFormat(40, 8, "Aktivitas", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Persentase", "1", 1, "C", true, 0, "")

	// Table rows
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)

	for i, detail := range data.Details {
		if i >= 20 { // Limit to first 20 for PDF readability
			break
		}

		satker := detail["satker"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalActivities)

		// Alternate row colors
		if i%2 == 0 {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(245, 245, 245)
		}

		pdf.CellFormat(10, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", true, 0, "")
		pdf.CellFormat(110, 6, truncateString(satker, 60), "1", 0, "L", true, 0, "")
		pdf.CellFormat(40, 6, formatNumber(count), "1", 0, "R", true, 0, "")
		pdf.CellFormat(30, 6, percentage+"%", "1", 1, "R", true, 0, "")

		// Check if we need a new page
		if pdf.GetY() > 250 {
			pdf.AddPage()
			// Re-add header
			pdf.SetFillColor(68, 114, 196)
			pdf.SetTextColor(255, 255, 255)
			pdf.SetFont("Arial", "B", 9)
			pdf.CellFormat(10, 8, "No", "1", 0, "C", true, 0, "")
			pdf.CellFormat(110, 8, "Satker", "1", 0, "C", true, 0, "")
			pdf.CellFormat(40, 8, "Aktivitas", "1", 0, "C", true, 0, "")
			pdf.CellFormat(30, 8, "Persentase", "1", 1, "C", true, 0, "")
			pdf.SetTextColor(0, 0, 0)
			pdf.SetFont("Arial", "", 8)
		}
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 6, fmt.Sprintf("Laporan dibuat oleh %s pada %s", metadata.GeneratedBy, time.Now().Format("02/01/2006 15:04:05")))

	// Add page numbers
	pdf.AliasNbPages("")
	pdf.SetY(-15)
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 10, fmt.Sprintf("Halaman %d dari {nb}", pdf.PageNo()))

	if err := pdf.OutputFileAndClose(filename); err != nil {
		return "", err
	}

	return filename, nil
}

func (rg *ReportGenerator) generateUserActivityPDF(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_aktivitas_pengguna", "pdf")

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "LAPORAN AKTIVITAS PENGGUNA")
	pdf.Ln(12)

	// Metadata
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 6, "Dibuat oleh:")
	pdf.Cell(0, 6, fmt.Sprintf("%s (%s)", metadata.Username, metadata.Email))
	pdf.Ln(6)

	pdf.Cell(40, 6, "Tanggal Dibuat:")
	pdf.Cell(0, 6, data.GeneratedAt.Format("02 January 2006 15:04:05"))
	pdf.Ln(6)

	pdf.Cell(40, 6, "Periode Data:")
	pdf.Cell(0, 6, data.Period)
	pdf.Ln(10)

	// Login Statistics Box
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "STATISTIK LOGIN")
	pdf.Ln(8)

	totalLogins := int(data.Summary["total_logins"].(int))
	successLogins := int(data.Summary["success_logins"].(int))
	failedLogins := int(data.Summary["failed_logins"].(int))

	var successRate float64
	if totalLogins > 0 {
		successRate = float64(successLogins) / float64(totalLogins) * 100
	}

	pdf.SetFillColor(112, 173, 71)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(95, 10, "Tingkat Keberhasilan Login", "1", 0, "C", true, 0, "")
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(95, 10, fmt.Sprintf("%.2f%%", successRate), "1", 1, "C", true, 0, "")

	pdf.Ln(5)

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(240, 240, 240)
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(95, 8, "Total Login:", "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 8, formatNumber(totalLogins), "1", 1, "R", true, 0, "")

	pdf.CellFormat(95, 8, "Login Berhasil:", "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 8, formatNumber(successLogins), "1", 1, "R", true, 0, "")

	pdf.CellFormat(95, 8, "Login Gagal:", "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 8, formatNumber(failedLogins), "1", 1, "R", true, 0, "")
	pdf.Ln(10)

	// Top Active Users Table
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "TOP 20 PENGGUNA PALING AKTIF")
	pdf.Ln(8)

	// Calculate total for percentage
	totalActivities := 0
	for _, detail := range data.Details {
		totalActivities += int(detail["count"].(int))
	}

	// Table header
	pdf.SetFillColor(112, 173, 71)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(10, 8, "No", "1", 0, "C", true, 0, "")
	pdf.CellFormat(100, 8, "Username", "1", 0, "C", true, 0, "")
	pdf.CellFormat(50, 8, "Total Aktivitas", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Persentase", "1", 1, "C", true, 0, "")

	// Table rows
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)

	limit := 20
	if len(data.Details) < limit {
		limit = len(data.Details)
	}

	for i := 0; i < limit; i++ {
		detail := data.Details[i]
		username := detail["username"].(string)
		count := int(detail["count"].(int))
		percentage := calculatePercentage(count, totalActivities)

		if i%2 == 0 {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(245, 245, 245)
		}

		pdf.CellFormat(10, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", true, 0, "")
		pdf.CellFormat(100, 6, truncateString(username, 50), "1", 0, "L", true, 0, "")
		pdf.CellFormat(50, 6, formatNumber(count), "1", 0, "R", true, 0, "")
		pdf.CellFormat(30, 6, percentage+"%", "1", 1, "R", true, 0, "")

		if pdf.GetY() > 250 {
			pdf.AddPage()
			// Re-add header
			pdf.SetFillColor(112, 173, 71)
			pdf.SetTextColor(255, 255, 255)
			pdf.SetFont("Arial", "B", 9)
			pdf.CellFormat(10, 8, "No", "1", 0, "C", true, 0, "")
			pdf.CellFormat(100, 8, "Username", "1", 0, "C", true, 0, "")
			pdf.CellFormat(50, 8, "Total Aktivitas", "1", 0, "C", true, 0, "")
			pdf.CellFormat(30, 8, "Persentase", "1", 1, "C", true, 0, "")
			pdf.SetTextColor(0, 0, 0)
			pdf.SetFont("Arial", "", 8)
		}
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 6, fmt.Sprintf("Laporan dibuat oleh %s pada %s", metadata.GeneratedBy, time.Now().Format("02/01/2006 15:04:05")))

	// Add page numbers
	pdf.AliasNbPages("")
	pdf.SetY(-15)
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 10, fmt.Sprintf("Halaman %d dari {nb}", pdf.PageNo()))

	if err := pdf.OutputFileAndClose(filename); err != nil {
		return "", err
	}

	return filename, nil
}

func (rg *ReportGenerator) generateFeatureUsagePDF(data *repository.ReportData, metadata ReportMetadata) (string, error) {
	filename := rg.generateFilename("laporan_pemanfaatan_fitur", "pdf")

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "LAPORAN PEMANFAATAN FITUR")
	pdf.Ln(12)

	// Metadata
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 6, "Dibuat oleh:")
	pdf.Cell(0, 6, fmt.Sprintf("%s (%s)", metadata.Username, metadata.Email))
	pdf.Ln(6)

	pdf.Cell(40, 6, "Tanggal Dibuat:")
	pdf.Cell(0, 6, data.GeneratedAt.Format("02 January 2006 15:04:05"))
	pdf.Ln(6)

	pdf.Cell(40, 6, "Periode Data:")
	pdf.Cell(0, 6, data.Period)
	pdf.Ln(10)

	// Summary Boxes
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "RINGKASAN PENGGUNAAN")
	pdf.Ln(8)

	totalViews := int(data.Summary["total_views"].(int))
	totalDownloads := int(data.Summary["total_downloads"].(int))
	totalSearches := int(data.Summary["total_searches"].(int))

	// Three boxes side by side
	pdf.SetFillColor(68, 114, 196)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(63, 6, "Total View", "1", 0, "C", true, 0, "")
	pdf.CellFormat(63, 6, "Total Download", "1", 0, "C", true, 0, "")
	pdf.CellFormat(64, 6, "Total Pencarian", "1", 1, "C", true, 0, "")

	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(63, 8, formatNumber(totalViews), "1", 0, "C", true, 0, "")
	pdf.CellFormat(63, 8, formatNumber(totalDownloads), "1", 0, "C", true, 0, "")
	pdf.CellFormat(64, 8, formatNumber(totalSearches), "1", 1, "C", true, 0, "")
	pdf.Ln(10)

	// Simple horizontal bar visualization for top 15
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "TOP 15 FITUR PALING BANYAK DIGUNAKAN")
	pdf.Ln(8)

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)

	// Find max value for scaling
	maxCount := 0
	limit := 15
	if len(data.Details) < limit {
		limit = len(data.Details)
	}

	for i := 0; i < limit; i++ {
		count := int(data.Details[i]["count"].(int))
		if count > maxCount {
			maxCount = count
		}
	}

	// Draw bars
	for i := 0; i < limit; i++ {
		detail := data.Details[i]
		feature := detail["feature"].(string)
		count := int(detail["count"].(int))

		// Feature name (left side)
		pdf.CellFormat(80, 5, truncateString(feature, 45), "0", 0, "L", false, 0, "")

		// Bar (proportional to count)
		barWidth := 80.0
		if maxCount > 0 {
			barWidth = float64(count) / float64(maxCount) * 80.0
		}

		pdf.SetFillColor(255, 192, 0)
		pdf.CellFormat(barWidth, 5, "", "0", 0, "L", true, 0, "")

		// Value (right side)
		pdf.SetX(170)
		pdf.CellFormat(30, 5, formatNumber(count), "0", 1, "R", false, 0, "")

		if pdf.GetY() > 250 && i < limit-1 {
			pdf.AddPage()
			pdf.SetFont("Arial", "B", 12)
			pdf.Cell(0, 8, "TOP 15 FITUR (lanjutan)")
			pdf.Ln(8)
			pdf.SetFont("Arial", "", 8)
		}
	}

	pdf.Ln(5)

	// Full table on next pages
	if len(data.Details) > 15 {
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(0, 8, "DETAIL LENGKAP SEMUA FITUR")
		pdf.Ln(8)

		// Calculate total
		totalUsage := 0
		for _, detail := range data.Details {
			totalUsage += int(detail["count"].(int))
		}

		// Table header
		pdf.SetFillColor(255, 192, 0)
		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("Arial", "B", 8)
		pdf.CellFormat(10, 7, "No", "1", 0, "C", true, 0, "")
		pdf.CellFormat(90, 7, "Fitur/Aktivitas", "1", 0, "C", true, 0, "")
		pdf.CellFormat(40, 7, "Jumlah", "1", 0, "C", true, 0, "")
		pdf.CellFormat(25, 7, "%", "1", 0, "C", true, 0, "")
		pdf.CellFormat(25, 7, "Kategori", "1", 1, "C", true, 0, "")

		// Table rows
		pdf.SetFont("Arial", "", 7)

		for i, detail := range data.Details {
			feature := detail["feature"].(string)
			count := int(detail["count"].(int))
			percentage := calculatePercentage(count, totalUsage)
			category := categorizeFeature(feature)

			if i%2 == 0 {
				pdf.SetFillColor(255, 255, 255)
			} else {
				pdf.SetFillColor(245, 245, 245)
			}

			pdf.CellFormat(10, 5, fmt.Sprintf("%d", i+1), "1", 0, "C", true, 0, "")
			pdf.CellFormat(90, 5, truncateString(feature, 55), "1", 0, "L", true, 0, "")
			pdf.CellFormat(40, 5, formatNumber(count), "1", 0, "R", true, 0, "")
			pdf.CellFormat(25, 5, percentage+"%", "1", 0, "R", true, 0, "")
			pdf.CellFormat(25, 5, category, "1", 1, "C", true, 0, "")

			if pdf.GetY() > 270 && i < len(data.Details)-1 {
				pdf.AddPage()
				// Re-add header
				pdf.SetFillColor(255, 192, 0)
				pdf.SetFont("Arial", "B", 8)
				pdf.CellFormat(10, 7, "No", "1", 0, "C", true, 0, "")
				pdf.CellFormat(90, 7, "Fitur/Aktivitas", "1", 0, "C", true, 0, "")
				pdf.CellFormat(40, 7, "Jumlah", "1", 0, "C", true, 0, "")
				pdf.CellFormat(25, 7, "%", "1", 0, "C", true, 0, "")
				pdf.CellFormat(25, 7, "Kategori", "1", 1, "C", true, 0, "")
				pdf.SetFont("Arial", "", 7)
			}
		}
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 6, fmt.Sprintf("Laporan dibuat oleh %s pada %s", metadata.GeneratedBy, time.Now().Format("02/01/2006 15:04:05")))

	// Add page numbers
	pdf.AliasNbPages("")
	pdf.SetY(-15)
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(0, 10, fmt.Sprintf("Halaman %d dari {nb}", pdf.PageNo()))

	if err := pdf.OutputFileAndClose(filename); err != nil {
		return "", err
	}

	return filename, nil
}

// Helper function to truncate long strings for PDF
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
