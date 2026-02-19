# Dashboard BPK - Architecture Documentation

## Overview
Dashboard BPK follows **Clean Architecture** and **MVC (Model-View-Controller)** principles to ensure maintainability, testability, and scalability.

## Backend Architecture (Go)

### Layer Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go           # Application entry point & router setup
├── internal/
│   ├── entity/               # Domain Models (Entities)
│   │   ├── user.go
│   │   ├── activity_log.go
│   │   └── report_access.go
│   ├── service/              # Business Logic Layer
│   │   ├── auth_service.go
│   │   ├── report_generator.go
│   │   └── cleanup_service.go
│   ├── handler/              # Controllers (HTTP Handlers)
│   │   ├── auth_handler.go
│   │   ├── dashboard_handler.go
│   │   └── report_handler.go
│   ├── repository/           # Data Access Layer
│   │   ├── activity_log_repository.go
│   │   └── content_repository.go
│   └── middleware/           # Cross-cutting Concerns
│       └── auth.go
└── pkg/
    └── database/             # Infrastructure
        └── postgres.go
```

### Layer Responsibilities

#### 1. Entity Layer (Domain Models)
- Contains pure business entities
- No dependencies on other layers
- Defines data structures and validation rules
- Examples: `User`, `ActivityLog`, `ReportAccessRequest`

#### 2. Service Layer (Business Logic)
- Orchestrates business workflows
- Contains domain logic and business rules
- Coordinates between repositories
- Handles transactions and complex operations
- Examples:
  - `AuthService`: User authentication, registration, password reset
  - `ReportGenerator`: Report creation and formatting
  - `CleanupService`: Scheduled cleanup tasks

#### 3. Handler Layer (Controllers)
- Handles HTTP requests and responses
- Input validation and sanitization
- Delegates business logic to services
- Returns appropriate HTTP status codes
- Examples: `Login`, `Register`, `GetDashboardStats`

#### 4. Repository Layer (Data Access)
- Abstracts database operations
- Implements data persistence logic
- Provides query methods
- No business logic
- Examples: `GetTotalCount`, `GetUniqueUsersCount`

#### 5. Middleware Layer
- Cross-cutting concerns (authentication, logging, CORS)
- Request/response processing
- Examples: `AuthMiddleware`, CORS handler

### Design Patterns Used

1. **Repository Pattern**: Separates data access from business logic
2. **Service Pattern**: Encapsulates business logic
3. **Dependency Injection**: Services receive dependencies (database) via constructors
4. **Factory Pattern**: `NewAuthService()`, `NewReportGenerator()`

### Dependency Flow
```
Handler → Service → Repository → Database
   ↓         ↓          ↓
 Entity ← Entity ← Entity
```

### Key Improvements from Refactoring

1. **Created AuthService**:
   - Moved authentication logic from handlers to dedicated service
   - Centralized password hashing, validation, and error handling
   - Better error messages with typed errors

2. **Cleaned Up Comments**:
   - Removed generic "Helper function" comments
   - Kept only meaningful, context-specific comments
   - Code is self-documenting through clear naming

3. **Refactored main.go**:
   - Extracted route setup into separate functions
   - Better separation of concerns
   - Easier to test and maintain

## Frontend Architecture (Next.js/React)

### Directory Structure

```
frontend/src/
├── app/                      # Pages (View Layer)
│   ├── dashboard/
│   │   ├── page.tsx         # Dashboard page
│   │   └── _components/     # Page-specific components
│   ├── auth/
│   │   ├── _hooks/          # Custom hooks (Controller)
│   │   ├── _services/       # API services (Model)
│   │   └── _types/          # Type definitions
│   └── regional/
├── components/               # Reusable UI Components (View)
│   ├── charts/
│   ├── layout/
│   └── ui/
├── services/                 # API Services (Model)
│   └── api.ts
├── stores/                   # State Management
│   └── appStore.ts
└── types/                    # TypeScript Types
    └── api.ts
```

### Layer Responsibilities

#### 1. View Layer (Components)
- `app/*/page.tsx`: Route pages
- `components/`: Reusable UI components
- Presentational logic only
- No direct API calls

#### 2. Controller Layer (Hooks)
- `_hooks/`: Custom hooks manage form state and user interactions
- Examples: `useLogin`, `useRegister`, `useForgotPassword`
- Handle form validation and submission
- Call services and update state

#### 3. Model Layer (Services)
- `services/api.ts`: API communication
- `_services/authService.ts`: Domain-specific services
- Handle data fetching and business rules
- Return typed data

#### 4. State Management
- `stores/`: Zustand stores for global state
- `useAppStore`: Application-wide state (filters, sidebar state)

### Design Patterns Used

1. **Custom Hooks Pattern**: Encapsulate reusable logic
2. **Service Layer Pattern**: Separate API calls from components
3. **Container/Presenter Pattern**: Smart containers, dumb components
4. **State Management**: Centralized with Zustand

### Data Flow
```
User Interaction → Hook (Controller) → Service (Model) → API
                      ↓
                   State Update
                      ↓
                Component Re-render (View)
```

### Key Improvements from Refactoring

1. **Removed AI-like Comments**:
   - Cleaned up overly formal JSDoc comments
   - Kept code self-explanatory through clear naming

2. **Maintained Separation**:
   - Hooks handle controller logic
   - Services handle data fetching
   - Components focus on presentation

## Clean Architecture Principles Applied

### 1. Separation of Concerns
- Each layer has a single, well-defined responsibility
- Changes in one layer don't ripple through others

### 2. Dependency Rule
- Dependencies point inward (from infrastructure to domain)
- Inner layers don't know about outer layers
- Domain entities are independent

### 3. Testability
- Each layer can be tested independently
- Services can be mocked in handler tests
- Repositories can be swapped for testing

### 4. Maintainability
- Clear structure makes navigation easier
- Business logic is centralized and reusable
- Easy to add new features without breaking existing code

## MVC Mapping

### Backend (Go)
- **Model**: `entity/` + `repository/`
- **View**: JSON responses
- **Controller**: `handler/`
- **Business Logic**: `service/` (extension of MVC)

### Frontend (React)
- **Model**: `services/` + `stores/`
- **View**: `components/` + `app/*/page.tsx`
- **Controller**: `_hooks/`

## Best Practices Followed

1. **Single Responsibility Principle**: Each struct/function does one thing
2. **DRY (Don't Repeat Yourself)**: Logic extracted into reusable services
3. **Explicit Error Handling**: Typed errors, clear error messages
4. **Consistent Naming**: Clear, descriptive names for clarity
5. **Clean Comments**: Only where necessary, code speaks for itself

## Future Improvements

1. Add unit tests for services
2. Implement request/response DTOs to further decouple layers
3. Add swagger documentation
4. Implement JWT authentication properly
5. Add request validation middleware
6. Implement rate limiting
7. Add structured logging

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [MVC Architecture Pattern](https://www.codecademy.com/article/mvc-architecture-model-view-controller)
- [Go Web Development Best Practices](https://github.com/golang-standards/project-layout)
