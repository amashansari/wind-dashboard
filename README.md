# UK Wind Generation Procurement Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-22%20Passed-success.svg)]()

A full-stack electricity procurement intelligence web application for UK energy utility day-ahead trading and risk management desks. The platform evaluates national wind generation forecasts and actual outturn data for **January 2026** directly from official Elexon Balancing Mechanism Reporting Service (BMRS) streams, strictly enforcing **look-ahead bias prevention** to reconstruct exact historical purchasing conditions.

---

## Table of Contents
1. [Executive Summary & Problem Statement](#executive-summary--problem-statement)
2. [Key Features](#key-features)
3. [Look-Ahead Bias Prevention](#look-ahead-bias-prevention)
4. [Data Provenance & Verification](#data-provenance--verification)
5. [Architecture & Design Standards](#architecture--design-standards)
6. [Repository Directory Structure](#repository-directory-structure)
7. [Getting Started & Local Startup](#getting-started--local-startup)
8. [Docker Compose](#docker-compose)
9. [Running Tests](#running-tests)
10. [API Contract Documentation](#api-contract-documentation)
11. [Deployment Configuration](#deployment-configuration)
12. [Video Demonstration Guide](#video-demonstration-guide)
13. [Limitations & Non-Goals](#limitations--non-goals)
14. [AI Tool Disclosure](#ai-tool-disclosure)

---

## Executive Summary & Problem Statement

In the Great Britain electricity system, licensed utilities must contract wholesale power to cover their consumers' demand. In the UK Day-Ahead wholesale market (EPEX SPOT / Nord Pool), purchasing decisions are finalized one day prior to physical delivery (typically before the 11:00–12:00 UK time auction cutoff).

Because power generation from wind is weather-dependent and volatile, procurement teams must balance anticipated renewable output against consumer load:

$$\text{Net Procurement Required} = \text{Forecast Demand} - \text{Expected Wind Generation}$$

- **Overforecasting wind** causes under-procurement day-ahead, forcing the utility to buy deficit volume in volatile within-day markets or incur high system buy prices (SBP) in the Balancing Mechanism.
- **Underforecasting wind** causes over-procurement day-ahead, forcing the utility to spill surplus power at distressed within-day prices or receive system sell prices (SSP).

This application provides the day-ahead procurement desk with an auditable decision-support system to:
1. Reconstruct the exact wind forecast available at the procurement decision cutoff.
2. Quantitatively measure forecast error (MAE, RMSE, Mean Bias) against realized physical generation.
3. Track forecast evolution and lead-time accuracy degradation across trading horizons.

---

## Key Features

### 1. Overview Dashboard
- **Headline Volumetric KPIs**: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Mean Signed Bias, Matched Sample Count, and Completeness Coverage %.
- **Dual-Line Comparison Chart**: Interactive time series displaying outturn physical generation (MW) vs. decision-time forecast (MW) with custom tooltips showing interval timestamps in UK local time (`Europe/London`).
- **Residual Error Bar Chart**: Clear visualization of signed error ($F - A$), highlighting surplus vs. deficit periods.

### 2. Forecast Explorer
- **Settlement Interval Inspection**: Deep-dive into all 48 half-hour settlement periods per delivery date.
- **Vintage Progression Inspector**: For any interval, visualizes every historical forecast vintage issued by National Grid ESO.
- **Cutoff Delineation**: Clear demarcation showing which vintages were available at decision cutoff vs. post-cutoff revisions.

### 3. Accuracy Analysis
- **Daily Performance Audit**: Day-by-day table and bar chart tracking error volatility across January 2026.
- **Lead-Time Degradation Curve**: Accuracy metrics categorized into trading horizons:
  - Intraday ($1$–$4$ hrs)
  - Near Day-Ahead ($4$–$12$ hrs)
  - Day-Ahead Auction ($12$–$24$ hrs)
  - Multi-Day Ahead ($24$–$48$ hrs)
- **Methodological Governance Notice**: Transparent disclosures regarding why MAPE is avoided for near-zero generation and confirmation of data boundaries.

---

## Look-Ahead Bias Prevention

Preventing look-ahead bias is a core architectural requirement. To evaluate what a purchaser could have known at decision cutoff $T$ for delivery interval $t$, the selection algorithm strictly enforces:

$$\text{Selected Forecast}(t, T) = \text{forecast}(t, \max(\text{publishTime} \mid \text{publishTime} \le T))$$

- Any forecast published after cutoff ($\text{publishTime} > T$) is strictly excluded from decision-time evaluation.
- If no forecast vintage was published prior to cutoff, the selected value is returned as `null` (missing). Future forecasts are **never** backfilled, and missing values are **never** replaced with zero.
- Cutoffs are configurable:
  - `Day-Ahead 12:00 UTC` (Standard auction gate closure, D-1)
  - `Day-Ahead 17:00 UTC` (Evening hedging deadline, D-1)
  - `Same-Day 06:00 UTC` (Intraday morning position)
  - Custom user-specified ISO timestamps.

---

## Data Provenance & Verification

The platform uses **100% verified real data** directly ingested from official Elexon Insights BMRS streams for **January 2026**:

| Stream | Endpoint | Scope | Ingested Records |
|---|---|---|---:|
| **Actual Generation** | `FUELHH/stream` (`fuelType == "WIND"`) | Half-hourly national wind outturn (MW) | 1,489 records |
| **Forecast Generation** | `WINDFOR/stream` | Hourly national wind forecasts across multiple vintages | 19,272 records |

- **Unit of Generation**: Megawatts (MW) average power per interval.
- **Timezone**: Normalized to UTC internally, formatted in UK local time (`Europe/London`, GMT/BST) in the user interface.
- **Interval Alignment**: Matched on exact top-of-hour settlement intervals (`:00:00Z`). For half-hourly intervals (`:30:00Z`) without a raw forecast, values are preserved as unforecasted rather than synthetically fabricated.

---

## Architecture & Design Standards

### Backend (Python / FastAPI)
- **FastAPI 0.111.0** with **Pydantic v2** models for strict request/response validation.
- Clean separation into `core/`, `schemas/`, `services/`, `analytics/`, and `api/`.
- Pure, deterministic calculation functions in `analytics/` for mathematical reproducibility.
- In-memory data repository with thread-safe access, cached January 2026 dataset, and live refresh capabilities.

### Frontend (React / TypeScript / Vite)
- Built in strict compliance with `RULES_OF_INTEGRATION.md`:
  - **Zustand Store**: Centralized reactive state in `src/module/procurement.store.ts`.
  - **Custom Hooks**: Business logic and state coordination in `src/module/procurement.ts`.
  - **API Actions**: Centralized HTTP calls via `src/module/procurement.action.ts` using `apiHandler` and `getQuery`.
  - **Central Endpoints**: Routes maintained in `src/ENDPOINT.ts`.
  - **Strict Types**: All types defined in `src/types/index.ts` with zero use of `any`.
  - **UI System**: Reusable shadcn/ui components with Tailwind CSS v4.
  - **Charts**: Time-series charts and lead-time curves powered by Recharts.

---

## Repository Directory Structure

```text
Weather Task/
├── ORIGINAL_ASSIGNMENT.md         # Original challenge specification
├── IMPLEMENTATION_BRIEF.md        # Comprehensive implementation brief
├── RULES_OF_INSTRUCTION.md        # Project-wide engineering & integrity rules
├── README.md                      # Master project documentation
├── .gitignore                     # Git ignore rules for Python, Node, & secrets
├── .env.example                   # Documented configuration template
├── docker-compose.yml             # Local multi-service orchestration
│
├── backend/
│   ├── Dockerfile                 # Multi-stage Python 3.11 container
│   ├── requirements.txt           # Pinned backend dependencies
│   ├── data/                      # Cached verified January 2026 Elexon datasets
│   │   ├── january_2026_actuals.json
│   │   └── january_2026_forecasts.json
│   ├── scripts/
│   │   └── ingest_january_2026.py # Repeatable Elexon ingestion pipeline
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint & middleware
│   │   ├── core/                  # Settings & logging
│   │   ├── schemas/               # Pydantic request/response models
│   │   ├── services/              # Repository & Elexon client
│   │   ├── analytics/             # Selector, metrics, & lead-time logic
│   │   └── api/                   # Health, forecasts, & analytics routes
│   └── tests/                     # 15 automated pytest suites
│       ├── test_selector.py       # Look-ahead prevention & cutoff tests
│       ├── test_metrics.py        # Hand-calculated MAE/RMSE/Bias tests
│       └── test_api.py            # API endpoint contract tests
│
├── frontend/
│   ├── Dockerfile                 # Multi-stage Node build & Nginx runtime
│   ├── nginx.conf                 # SPA routing & API reverse proxy
│   ├── package.json               # Frontend dependencies & scripts
│   ├── vite.config.ts             # Vite & Vitest configuration
│   ├── tailwind.config.js         # Tailwind theme configuration
│   ├── vercel.json                # Vercel deployment rewrite rules
│   ├── src/
│   │   ├── main.tsx               # React application entrypoint
│   │   ├── App.tsx                # Master page layout & tab switching
│   │   ├── ENDPOINT.ts            # Centralized API endpoint routes
│   │   ├── types/                 # Strict TypeScript models
│   │   ├── utils/                 # apiHandler & formatting utilities
│   │   ├── module/                # Zustand store, actions, & custom hook
│   │   ├── components/            # UI views & shadcn/ui components
│   │   └── tests/                 # Vitest component & handler tests
│
└── docs/
    ├── 01-product-requirements.md
    ├── 02-data-and-analytics.md
    ├── 03-architecture-and-api.md
    ├── 04-ux-and-dashboard.md
    ├── 05-implementation-plan.md
    └── 06-video-demo-script.md
```

---

## Getting Started & Local Startup

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+ (Node 22 LTS recommended)
- **Package Manager**: npm

### 1. Environment Setup
Create your local environment file from the template:
```bash
cp .env.example .env
```

### 2. Run Backend Independently
```bash
# In repository root
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI server will boot at `http://127.0.0.1:8000`. Interactive Swagger docs are available at `http://127.0.0.1:8000/docs`.

### 3. Run Frontend Independently
```bash
cd frontend
npm install
npm run dev
```
The React application will boot at `http://localhost:5173`. Vite's development proxy automatically forwards `/api` requests to `http://127.0.0.1:8000`.

---

## Docker Compose

Run the entire full-stack application with a single command:
```bash
docker compose up --build
```
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`

To shut down:
```bash
docker compose down
```

---

## Running Tests

### Backend Tests (`pytest`)
Run the 15 backend automated tests:
```bash
pytest -v backend/tests
```
**Test Results:**
```text
backend/tests/test_api.py::test_health_endpoint PASSED                   [  6%]
backend/tests/test_api.py::test_metadata_endpoint PASSED                 [ 13%]
backend/tests/test_api.py::test_forecasts_endpoint PASSED                [ 20%]
backend/tests/test_api.py::test_accuracy_endpoint PASSED                 [ 26%]
backend/tests/test_api.py::test_lead_times_endpoint PASSED               [ 33%]
backend/tests/test_api.py::test_vintages_endpoint PASSED                 [ 40%]
backend/tests/test_metrics.py::test_hand_calculated_metrics PASSED       [ 46%]
backend/tests/test_metrics.py::test_positive_bias_overforecasting PASSED [ 53%]
backend/tests/test_metrics.py::test_zero_actual_generation_safety PASSED [ 60%]
backend/tests/test_metrics.py::test_empty_pairs PASSED                   [ 66%]
backend/tests/test_metrics.py::test_lead_time_bucketing PASSED           [ 73%]
backend/tests/test_selector.py::test_select_latest_eligible_forecast PASSED [ 80%]
backend/tests/test_selector.py::test_prevent_look_ahead_bias PASSED      [ 86%]
backend/tests/test_selector.py::test_missing_forecast_when_all_post_cutoff PASSED [ 93%]
backend/tests/test_selector.py::test_lead_time_calculation PASSED        [100%]
======================= 15 passed in 5.41s ========================
```

### Frontend Tests (`vitest`)
Run the frontend component and utility test suite:
```bash
cd frontend
npm test
```
**Test Results:**
```text
 Test Files  2 passed (2)
      Tests  7 passed (7)
   Duration  6.87s
```

### Production Build Verification
```bash
cd frontend
npm run build
```
Builds cleanly with zero TypeScript or bundler errors.

---

## API Contract Documentation

### `GET /api/health`
Returns service operational health and data readiness.
```json
{
  "status": "healthy",
  "timestamp": "2026-10-29T08:30:00Z",
  "version": "1.0.0",
  "datasetStatus": "loaded",
  "totalActualRecords": 1489,
  "totalForecastRecords": 19272
}
```

### `GET /api/metadata`
Returns data source provenance, verified units, and known limitations.

### `GET /api/forecasts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&cutoffPreset=day_ahead_12`
Returns delivery intervals with paired outturn actuals and decision-time forecasts.

### `GET /api/vintages?deliveryTime=ISO_TIMESTAMP&cutoffPreset=day_ahead_12`
Returns all historical forecast publication vintages for a specific interval, tagging eligibility at cutoff.

### `GET /api/analytics/accuracy?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&cutoffPreset=day_ahead_12`
Returns MAE, RMSE, Mean Bias, Matched Sample Count, Coverage %, and daily breakdowns.

### `GET /api/analytics/lead-times?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Returns accuracy metrics grouped by lead-time horizon buckets.

---

## Deployment Configuration

### Frontend (Vercel)
1. Deploy `frontend/` to Vercel.
2. Set Environment Variable in Vercel project settings:
   - `VITE_API_BASE_URL`: URL of deployed FastAPI backend.
3. Rewrite rules are automatically handled by `frontend/vercel.json`.

### Backend (Python Host, e.g. Render / Railway / Fly.io)
1. Deploy from repository root with build command `pip install -r backend/requirements.txt`.
2. Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`.
3. Set Environment Variables:
   - `CORS_ORIGINS`: Your Vercel frontend URL.
   - `DATA_DIR`: `backend/data`.

---

## Video Demonstration Guide

The unlisted video presentation (max 10 minutes) covers:
- **Part 1: Customer Pitch (5 min)**: The day-ahead volumetric challenge, live dashboard tour for January 2026, forecast explorer vintage tracing, and accuracy metrics.
- **Part 2: Technical Walkthrough (5 min)**: Modular architecture, look-ahead bias prevention algorithms, automated test execution, Docker containerization, and repository design.

Complete script and timing checklist: [`docs/06-video-demo-script.md`](docs/06-video-demo-script.md).

---

## Limitations & Non-Goals

1. **Scope Boundary**: In strict accordance with the challenge guidelines, only Elexon wind actuals and forecasts are analyzed.
2. **No Commercial Trading Claims**: The platform does not claim to optimize thermal dispatch schedules, calculate cash-out imbalance charges, or claim monetary savings, as no market price, contract, or customer demand data is provided.
3. **No Fabricated Interpolation**: Hourly forecast intervals are paired with exact settlement intervals without fabricating synthetic numbers.

---

## AI Tool Disclosure

In accordance with Section 2.2 of `ORIGINAL_ASSIGNMENT.md`, AI tools (Google Antigravity / Gemini 3.8) were utilized during the project for:
- Initial project scaffolding and environment validation.
- API documentation inspection and query prototyping.
- Implementation of analytics algorithms and Pydantic schemas.
- Writing unit and component test suites.
- Technical documentation drafting.

All code, architectural decisions, mathematical calculations, and test suites were reviewed, verified, and tested by the engineer.
