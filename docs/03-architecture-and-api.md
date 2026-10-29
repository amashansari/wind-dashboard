# 03. Architecture and API Specification

## 1. System Architecture

The application is structured as a decoupled, modern full-stack system:

```text
+-----------------------------------------------------------+
|                     Client Browser                        |
|   React 18 + TypeScript + Vite + TailwindCSS + Recharts   |
|   (Zustand Stores, Custom Hooks, apiHandler, shadcn/ui)   |
+-----------------------------+-----------------------------+
                              | JSON / REST
                              v
+-----------------------------------------------------------+
|                  FastAPI Backend Server                   |
|  - CORS & Security Middleware                             |
|  - Pydantic Request/Response Schema Validation            |
|  - /api/health, /api/metadata, /api/forecasts, /api/...   |
+-----------------------------+-----------------------------+
                              |
               +--------------+--------------+
               |                             |
               v                             v
+-----------------------------+ +-----------------------------+
|    Analytics Engine         | |      Data Repository        |
| - Pure cutoff filter        | | - January 2026 snapshot     |
| - Look-ahead bias guard     | | - Ingestion service         |
| - MAE, RMSE, Bias, LeadTime | | - Elexon BMRS client        |
+-----------------------------+ +--------------+--------------+
                                               |
                                               v
                                +-----------------------------+
                                |  Official Elexon BMRS API   |
                                |  - FUELHH/stream (Actuals)  |
                                |  - WINDFOR/stream (Forecast)|
                                +-----------------------------+
```

---

## 2. Backend Module Structure

Located in `backend/app`:
- `core/`:
  - `config.py`: Pydantic settings loading from `.env` (API URLs, CORS origins, data directory, log level).
  - `logging.py`: Structured logging configuration.
- `schemas/`:
  - `health.py`: Healthcheck response model.
  - `metadata.py`: Data provenance, coverage ranges, units, and limitations metadata.
  - `forecast.py`: Forecast observation, actual generation, and cutoff response schemas.
  - `analytics.py`: Accuracy metrics, lead time bucket models, and evaluation summaries.
- `services/`:
  - `elexon_client.py`: Upstream HTTP client for Elexon BMRS streams with retry, timeout, and pagination handling.
  - `repository.py`: In-memory data store with thread-safe access to January 2026 actuals and forecast vintages, loaded from cached files and refreshed on demand.
- `analytics/`:
  - `selector.py`: Pure, deterministic function selecting the latest forecast vintage where $\text{publishTime} \le T$.
  - `metrics.py`: Pure calculation of MAE, RMSE, Mean Bias, Matched Sample Count, and Coverage.
  - `lead_time.py`: Derivation of lead-time groupings and accuracy breakdowns.
- `api/`:
  - `routes_health.py`: `/api/health` and `/api/metadata`.
  - `routes_forecasts.py`: `/api/forecasts`, `/api/vintages`.
  - `routes_analytics.py`: `/api/analytics/accuracy`, `/api/analytics/lead-times`.
- `main.py`: FastAPI application entrypoint with middleware, routing, and lifespan events.

---

## 3. API Contract Specification

All timestamps are accepted and returned in ISO 8601 UTC format (e.g. `2026-01-01T00:00:00Z`).

### 3.1 Health & Metadata

#### `GET /api/health`
Returns service health and readiness status.
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-29T08:00:00Z",
    "version": "1.0.0",
    "datasetStatus": "loaded",
    "totalActualRecords": 1488,
    "totalForecastRecords": 17800
  }
  ```

#### `GET /api/metadata`
Returns data source provenance, coverage bounds, verified units, and known limitations.
- **Response `200 OK`**:
  ```json
  {
    "sourceActuals": "Elexon BMRS FUELHH/stream (fuelType=WIND)",
    "sourceForecasts": "Elexon BMRS WINDFOR/stream",
    "generationUnit": "MW",
    "deliveryIntervalResolution": "Half-hourly actuals, Hourly forecasts",
    "historicalCoverage": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    },
    "defaultCutoffPolicy": "Day-Ahead 12:00 UTC (D-1)",
    "knownLimitations": [
      "No customer demand or market price datasets are included.",
      "Commercial savings or optimal thermal dispatch cannot be inferred.",
      "WINDFOR raw forecasts are provided at hourly intervals; half-hourly intervals without forecasts are preserved as null."
    ]
  }
  ```

---

### 3.2 Forecasts & Vintages

#### `GET /api/forecasts`
Returns forecast and actual time-series for a selected date range and decision cutoff.
- **Query Parameters**:
  - `startDate` (e.g. `2026-01-01`, required)
  - `endDate` (e.g. `2026-01-02`, required)
  - `cutoffTime` (ISO 8601 timestamp, optional; defaults to Day-Ahead 12:00 UTC before delivery date)
  - `cutoffPreset` (optional enum: `day_ahead_12`, `day_ahead_17`, `custom`)
- **Response `200 OK`**:
  ```json
  {
    "startDate": "2026-01-01",
    "endDate": "2026-01-01",
    "cutoffPolicyApplied": "2025-12-31T12:00:00Z",
    "totalIntervals": 48,
    "intervals": [
      {
        "deliveryStartTime": "2026-01-01T00:00:00Z",
        "settlementPeriod": 1,
        "actualGenerationMW": 16120.0,
        "forecastGenerationMW": 15850.0,
        "forecastPublishTime": "2025-12-31T11:30:00Z",
        "leadTimeHours": 12.5,
        "errorMW": -270.0,
        "absoluteErrorMW": 270.0,
        "isMatched": true
      }
    ]
  }
  ```

#### `GET /api/vintages`
Inspect all historical forecast publication vintages targeting a specified delivery period.
- **Query Parameters**:
  - `date` (`YYYY-MM-DD`, required)
- **Response `200 OK`**:
  ```json
  {
    "deliveryDate": "2026-01-01",
    "vintages": [
      {
        "publishTime": "2025-12-30T15:30:00Z",
        "leadTimeHours": 32.5,
        "sampleGenerationMW": 14200.0
      },
      {
        "publishTime": "2025-12-31T11:30:00Z",
        "leadTimeHours": 12.5,
        "sampleGenerationMW": 15850.0
      }
    ]
  }
  ```

---

### 3.3 Analytics

#### `GET /api/analytics/accuracy`
Calculates MAE, RMSE, Mean Bias, sample count, and coverage for a date range and cutoff.
- **Query Parameters**: Same as `/api/forecasts`.
- **Response `200 OK`**:
  ```json
  {
    "startDate": "2026-01-01",
    "endDate": "2026-01-07",
    "cutoffPolicy": "Day-Ahead 12:00 UTC",
    "generationUnit": "MW",
    "matchedSampleCount": 168,
    "expectedIntervalCount": 168,
    "coveragePercentage": 100.0,
    "mae": 1245.8,
    "rmse": 1680.4,
    "meanBias": 312.1,
    "biasInterpretation": "Overforecasting by 312.1 MW on average (positive bias = overforecast)",
    "dailyBreakdown": [
      {
        "date": "2026-01-01",
        "mae": 980.2,
        "rmse": 1210.5,
        "meanBias": 145.0,
        "matchedCount": 24
      }
    ]
  }
  ```

#### `GET /api/analytics/lead-times`
Evaluates forecast accuracy categorized by lead-time horizon buckets.
- **Query Parameters**: `startDate`, `endDate`.
- **Response `200 OK`**:
  ```json
  {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "buckets": [
      {
        "bucketName": "Intraday (1-4h)",
        "minLeadHours": 1.0,
        "maxLeadHours": 4.0,
        "mae": 750.3,
        "rmse": 980.1,
        "meanBias": 42.0,
        "sampleCount": 744
      },
      {
        "bucketName": "Day-Ahead Auction (12-24h)",
        "minLeadHours": 12.0,
        "maxLeadHours": 24.0,
        "mae": 1450.6,
        "rmse": 1890.2,
        "meanBias": 290.4,
        "sampleCount": 744
      }
    ]
  }
  ```

---

## 4. Frontend Architecture & Integration Pattern

Adheres to `RULES_OF_INTEGRATION.md`:
1. **Endpoint definitions**: Defined exclusively in `src/ENDPOINT.ts`.
2. **Types**: Centralized in `src/types/index.ts`. No `any` allowed.
3. **API Handler**: Requests invoked through `src/utils/apiHandler.ts` with `getQuery`.
4. **State Management**:
   - `procurement.store.ts`: Stores selected date range, cutoff policy, loading states, forecast data, accuracy metrics, and lead-time analytics.
5. **Custom Hooks**:
   - `useProcurement.ts`: Orchestrates queries, data fetching, filter updates, and state syncing.
6. **Actions**:
   - `procurement.action.ts`: Handles async HTTP interactions via `apiHandler`.
7. **UI Presentation**:
   - Reusable shadcn/ui components (`Card`, `Button`, `Select`, `Badge`, `Tabs`, `Tooltip`).
   - Clean energy trading control room visual theme.
