# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 0A - Design Extraction (2026-01-27)
#### Added
- Extracted Figma design metadata from node `0-1`
- Created `design-tokens.json` with complete design specifications
- Documented color palette (Primary Gold #FEB800, Orange #E27200)
- Documented typography specs (Plus Jakarta Sans)
- Documented layout dimensions (Sidebar 320px, Header 80px)
- Documented component specifications (cards, buttons, borders)

### Phase 0B - Workspace Setup (2026-01-27)
#### Added
- Initialized Git repository
- Created folder structure (frontend/, backend/, docs/)
- Created `.gitignore` for project dependencies
- Created `README.md` with project overview
- Created `SETUP.md` with detailed setup instructions
- Created `docs/API_SPEC.md` with API documentation
- Created PowerShell utility scripts:
  - `start-dev.ps1` - Start development servers
  - `stop-dev.ps1` - Stop development servers
  - `test-api.ps1` - Test API endpoints
  - `test-db-connection.ps1` - Test database connection
- Created this CHANGELOG.md

#### Structure
```
Dashboard-BPK/
├── frontend/
├── backend/
├── docs/
│   └── API_SPEC.md
├── design-tokens.json
├── README.md
├── SETUP.md
├── CHANGELOG.md
├── .gitignore
├── start-dev.ps1
├── stop-dev.ps1
├── test-api.ps1
└── test-db-connection.ps1
```

---

## Version History

### [0.1.0] - 2026-01-27
- Initial project setup
- Design system extraction from Figma
- Development environment configuration
