# 🔌 API Specification - Dashboard BPK

RESTful API endpoints for Dashboard Monitoring BIDICS BPK RI.

## 📋 Base URL
```
http://localhost:8080/api/v1
```

## 🔐 Authentication
Phase 1: No authentication required  
Phase 2: JWT Bearer token

---

## 📊 Dashboard Endpoints

### Get Dashboard Statistics
Get summary statistics for the dashboard.

**Endpoint**: `GET /dashboard/stats`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string | Yes | ISO 8601 date (e.g., 2023-01-01) |
| end_date | string | Yes | ISO 8601 date |
| cluster | string | No | Filter by cluster: pencarian, pemda, pusat |

**Response**:
```json
{
  "total_users": 88,
  "total_activities": 1018,
  "total_logins": 875,
  "logout_errors": 103,
  "cluster_distribution": [
    { "cluster": "pencarian", "count": 575 },
    { "cluster": "pemda", "count": 221 },
    { "cluster": "pusat", "count": 222 }
  ]
}
```

---

### Get Activity Timeline
Get activity distribution over time.

**Endpoint**: `GET /dashboard/timeline`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | string | Yes | - | ISO 8601 date |
| end_date | string | Yes | - | ISO 8601 date |
| cluster | string | No | - | Filter by cluster |
| granularity | string | No | hour | hour or day |

**Response**:
```json
{
  "timeline": [
    {
      "time": "2023-10-02T09:00:00Z",
      "count": 42,
      "cluster": "pencarian"
    },
    {
      "time": "2023-10-02T10:00:00Z",
      "count": 58,
      "cluster": "pemda"
    }
  ]
}
```

---

### Get Activity Logs
Get paginated activity logs.

**Endpoint**: `GET /dashboard/activities`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | string | Yes | - | ISO 8601 date |
| end_date | string | Yes | - | ISO 8601 date |
| cluster | string | No | - | Filter by cluster |
| satker | string | No | - | Filter by satker |
| aktifitas | string | No | - | Filter by activity type |
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Items per page |

**Response**:
```json
{
  "activities": [
    {
      "id": "8ca5592f-c0d3-48b9-8cdd-f935be0900bc",
      "tanggal": "2023-10-02T09:31:58Z",
      "nama": "i************",
      "satker": "Subauditorat Sulawesi Utara I",
      "aktifitas": "LOGIN",
      "scope": "",
      "lokasi": "LOGIN",
      "cluster": "pencarian"
    }
  ],
  "total": 1018,
  "page": 1,
  "limit": 50,
  "total_pages": 21
}
```

---

### Get Peak Hours
Get busiest hours analysis.

**Endpoint**: `GET /dashboard/peak-hours`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string | Yes | ISO 8601 date |
| end_date | string | Yes | ISO 8601 date |
| cluster | string | No | Filter by cluster |

**Response**:
```json
{
  "peak_hour": {
    "hour": 13,
    "count": 276,
    "time_range": "13:00 - 14:00 WIB"
  },
  "hourly_data": [
    { "hour": 0, "count": 12 },
    { "hour": 1, "count": 8 },
    { "hour": 13, "count": 276 }
  ]
}
```

---

## 🗺️ Regional Analysis Endpoints

### Get Regional Map Data
Get geographic distribution for map visualization.

**Endpoint**: `GET /regional/map`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string | Yes | ISO 8601 date |
| end_date | string | Yes | ISO 8601 date |
| cluster | string | No | Filter by cluster |

**Response**:
```json
{
  "provinces": [
    {
      "province": "Sulawesi Utara",
      "lat": 1.494,
      "lng": 124.841,
      "count": 215,
      "cluster_breakdown": {
        "pencarian": 120,
        "pemda": 60,
        "pusat": 35
      },
      "satker_list": [
        "Subauditorat Sulawesi Utara I",
        "Subauditorat Sulawesi Utara II"
      ]
    }
  ]
}
```

---

### Get Satker Statistics
Get satker with detailed statistics.

**Endpoint**: `GET /regional/satker`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | string | Yes | - | ISO 8601 date |
| end_date | string | Yes | - | ISO 8601 date |
| cluster | string | No | - | Filter by cluster |
| sort_by | string | No | activity_count | activity_count or name |
| order | string | No | desc | asc or desc |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response**:
```json
{
  "satker": [
    {
      "name": "Subauditorat Papua I",
      "total_activities": 235,
      "unique_users": 15,
      "login_count": 180,
      "logout_error_count": 5,
      "cluster_distribution": {
        "pencarian": 150,
        "pemda": 50,
        "pusat": 35
      },
      "last_activity": "2023-10-02T16:30:00Z",
      "province": "Papua",
      "region": "Papua"
    }
  ],
  "total": 150,
  "page": 1,
  "total_pages": 8
}
```

---

### Get Satker Rankings
Get top and bottom performing satker.

**Endpoint**: `GET /regional/rankings`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | string | Yes | - | ISO 8601 date |
| end_date | string | Yes | - | ISO 8601 date |
| cluster | string | No | - | Filter by cluster |
| limit | number | No | 10 | Number of results |

**Response**:
```json
{
  "top_satker": [
    { "satker": "Subauditorat Papua I", "count": 235 },
    { "satker": "Subauditorat Sulawesi Utara I", "count": 215 }
  ],
  "bottom_satker": [
    { "satker": "Subauditorat X", "count": 12 },
    { "satker": "Subauditorat Y", "count": 15 }
  ]
}
```

---

### Get Operational Hours
Get activity patterns by hour for each satker.

**Endpoint**: `GET /regional/operational-hours`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | string | Yes | - | ISO 8601 date |
| end_date | string | Yes | - | ISO 8601 date |
| limit | number | No | 10 | Top N satker |

**Response**:
```json
{
  "operational_hours": [
    {
      "satker": "Subauditorat Papua I",
      "peak_hour": 10,
      "hourly_distribution": [
        { "hour": 8, "count": 15 },
        { "hour": 9, "count": 25 },
        { "hour": 10, "count": 58 }
      ]
    }
  ]
}
```

---

## 📤 Export Endpoints

### Export to CSV
Export filtered data to CSV.

**Endpoint**: `POST /export/csv`

**Request Body**:
```json
{
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "cluster": "pencarian",
  "satker": "Subauditorat Papua I",
  "columns": ["tanggal", "nama", "satker", "aktifitas", "cluster"]
}
```

**Response**: CSV file stream

---

## 📥 Import Endpoints

### Import CSV
Import activity logs from CSV file.

**Endpoint**: `POST /import/csv`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: CSV file (semicolon-delimited)

**Response**:
```json
{
  "imported": 1500,
  "skipped": 25,
  "errors": [
    "Row 10: Invalid date format",
    "Row 52: Missing required field 'cluster'"
  ]
}
```

---

## ❌ Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "start_date is required",
    "details": {
      "parameter": "start_date",
      "expected": "ISO 8601 date string"
    }
  }
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🧪 Testing with curl

### Get Dashboard Stats
```bash
curl -X GET "http://localhost:8080/api/v1/dashboard/stats?start_date=2023-01-01&end_date=2023-12-31"
```

### Get Activities with Filter
```bash
curl -X GET "http://localhost:8080/api/v1/dashboard/activities?start_date=2023-01-01&end_date=2023-12-31&cluster=pencarian&page=1&limit=10"
```

### Export CSV
```bash
curl -X POST "http://localhost:8080/api/v1/export/csv" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2023-01-01","end_date":"2023-12-31"}' \
  --output export.csv
```

---

**API Version**: 1.0.0  
**Last Updated**: January 27, 2026
