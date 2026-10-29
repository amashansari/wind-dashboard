# 05. Implementation Plan

## 1. Workstream Breakdown & 16-Hour Budget

| Phase | Description | Estimated Budget | Status |
|---|---|---:|---|
| **Phase 1** | Repository Inspection, Rules (`RULES_OF_INSTRUCTION.md`), Docs (`docs/01-05`) | 1.0 h | Completed |
| **Phase 2** | Elexon API Probe & Ingestion Pipeline (FUELHH & WINDFOR for Jan 2026) | 1.5 h | Completed |
| **Phase 3** | Backend Core & Analytics Engine (Selector, MAE/RMSE/Bias, Lead-Time) | 2.0 h | In Progress |
| **Phase 4** | Backend API Endpoints & Unit Test Suite (`pytest`) | 1.5 h | Planned |
| **Phase 5** | Frontend Scaffolding, Zustand Store, Types, `apiHandler`, `ENDPOINT.ts` | 1.5 h | Planned |
| **Phase 6** | UI Views: Overview, Forecast Explorer, Accuracy Analysis with Recharts | 3.5 h | Planned |
| **Phase 7** | Frontend Unit & Integration Tests, Build Verification | 1.5 h | Planned |
| **Phase 8** | Dockerfile (Backend & Frontend), `docker-compose.yml`, Smoke Testing | 1.5 h | Planned |
| **Phase 9** | Deployment (Vercel & Python Host), GitHub Repo Preparation | 1.0 h | Planned |
| **Phase 10** | Video Demonstration Script, Submission Checklist, Final README | 1.0 h | Planned |
| **Total** | | **16.0 h** | |

---

## 2. Key Acceptance Criteria

1. **Look-Ahead Prevention**:
   - Zero forecasts published at $\text{publishTime} > T$ are selected for evaluation.
   - Tested rigorously with unit and regression tests.
2. **Real Data Integrity**:
   - Historical January 2026 data downloaded from verified Elexon endpoints (`FUELHH` and `WINDFOR`).
   - Units explicitly documented and displayed as MW.
   - Exact interval matching between hourly forecasts and half-hourly actuals without fabricated synthetic numbers.
3. **Analytics Correctness**:
   - Hand-calculated test cases confirming formulas:
     - $\text{error} = \text{forecast} - \text{actual}$
     - $\text{MAE} = \frac{1}{N} \sum |\text{error}|$
     - $\text{RMSE} = \sqrt{\frac{1}{N} \sum \text{error}^2}$
     - $\text{Bias} = \frac{1}{N} \sum \text{error}$
4. **Architectural Conformance**:
   - Follows `RULES_OF_INTEGRATION.md`: Zustand stores, custom hooks, `apiHandler`, `ENDPOINT.ts`, `types/index.ts`, shadcn/ui.
   - FastAPI modular architecture (`api/`, `schemas/`, `services/`, `analytics/`).
5. **Operational Verification**:
   - Automated tests run and passing (`pytest` and frontend tests).
   - `npm run build` succeeds cleanly with zero errors.
   - Docker Compose starts services cleanly.

---

## 3. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Elexon API rate limits or transient connection drops during evaluation | High | Pre-fetch and cache full January 2026 data in `backend/data/` while maintaining live streaming ingestion for refresh. |
| Incompatible timestamp timezones | High | Enforce ISO 8601 UTC across all backend models and database/JSON storage; convert only in frontend display layer with date-fns or native Intl. |
| Hourly vs. Half-hourly alignment mismatch | Medium | Clearly display both half-hour actuals on the timeline while pairing exact top-of-hour intervals for non-interpolated error metrics. Document the resolution difference transparently. |
| Deployment hosting constraints | Medium | Build standard Docker container and standard Vercel configuration (`vercel.json`) with configurable API base URL. |
