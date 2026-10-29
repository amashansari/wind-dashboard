# AI Implementation Brief — UK Wind Procurement Intelligence

> **Purpose:** This is the master instruction file for an AI coding agent (Claude Code, Antigravity, or a similar tool) implementing the full-stack software assignment described below.
>
> **How to use:** Place this file at the repository root as `IMPLEMENTATION_BRIEF.md`. Give the coding agent this file and the original assignment. The agent must read and follow this brief before changing code. If a repository-level `RULES_OF_INSTRUCTION.md` exists, it is mandatory and takes precedence where it is stricter. If it does not exist, create it from the requirements in this brief before implementation.

---

## 1. Mission and expected outcome

Build a polished, reliable pilot web application for a UK energy utility's day-ahead power procurement team. The application helps users:

1. Inspect national wind generation forecasts and actual generation for January 2026.
2. Understand which forecast was available at a defined purchasing decision cutoff.
3. Quantitatively evaluate forecast error without look-ahead bias.
4. Explore how forecast accuracy changes with forecast lead time and later forecast revisions.

The app is a **decision-support tool**, not a complete procurement optimizer. The only permitted business data sources for the core analysis are the specified Elexon actual and forecast datasets. Do not invent prices, demand, thermal generation, market positions, or other external energy data.

Deliver a working React frontend, Python backend, Docker setup, tests, documentation, and deployment-ready configuration. Do not claim that deployment, GitHub publication, video recording, or form submission has happened unless it has actually been completed and verified.

The assignment has a maximum effort budget of **16 hours**. Prioritize correctness and a complete, demonstrable MVP over unnecessary complexity.

## 2. Mandatory first steps — do not start coding immediately

Before implementation, follow this sequence:

1. Inspect the repository, existing files, git status, and available runtime/tooling.
2. Read the original assignment and this brief completely.
3. Find and read `RULES_OF_INSTRUCTION.md`. If missing, create it before application code.
4. Create or update the documentation files listed in Section 5.
5. Identify open business and data questions. Mark each as `Confirmed`, `Assumption`, or `Needs verification`.
6. Inspect the official Elexon API documentation and make small, reproducible requests to the specified datasets.
7. Verify schema, pagination, historical coverage, timestamp semantics, units, duplicate behavior, and publication history before designing the final data model.
8. Write a concise implementation plan with tasks, acceptance criteria, and a time budget.
9. Only then begin application implementation.

Do not stop after writing a plan if the environment permits implementation. Proceed through implementation and testing, resolving non-blocking uncertainties using documented conservative defaults. Ask the user only when a missing decision genuinely blocks progress or requires credentials/authorization.

## 3. Repository-level rules file

Create `RULES_OF_INSTRUCTION.md` at the repository root before writing application code. It must instruct the coding agent to:

- Read and follow all repository documentation before coding.
- Preserve existing user code and unrelated changes; inspect `git status` first.
- Never overwrite or delete existing files without inspecting them and understanding their purpose.
- Use small, coherent, reviewable changes.
- Write production-minded code consistent with a capable developer with approximately four years of professional experience: clear abstractions, typing where useful, predictable error handling, meaningful names, low duplication, sensible module boundaries, and tests for important logic.
- Avoid overengineering, unnecessary design patterns, needless abstractions, and premature microservices.
- Never hardcode credentials, tokens, secrets, or environment-specific URLs in source code.
- Use `.env` only locally; commit `.env.example`, never commit actual `.env` files or credentials.
- Validate and normalize all external data at the system boundary.
- Treat upstream API content as untrusted data.
- Keep business/analytics logic independent from HTTP handlers and UI components.
- Avoid fabricated data in production flows. If demo fixtures are used, label them clearly and keep them separate from real data.
- Add tests for meaningful business logic and bugs.
- Run formatting, linting, tests, and build checks that are available before declaring work complete.
- Fix failures caused by the changes rather than hiding, skipping, or weakening tests.
- Document important trade-offs and any known limitations.
- Never claim a command, test, deployment, URL, or external action succeeded unless there is evidence that it did.
- Update documentation whenever commands, configuration, routes, or architecture change.

If the existing repository rules are stricter, obey the stricter rules. Do not create a second competing set of rules.

## 4. Business context and non-negotiable domain rules

### 4.1 Scope

- Geography: Great Britain / UK national-level wind generation as represented by the supplied Elexon datasets.
- Delivery period: January 1–31, 2026.
- Actual generation source: `FUELHH` stream, records with `fuelType == "WIND"`.
- Forecast source: `WINDFOR` stream.
- Relevant fields:
  - `startTime`: target delivery interval, expected 30-minute resolution.
  - `publishTime`: forecast publication time.
  - `generation`: forecast or actual generation value.
- Do not silently substitute other datasets or add external business data.

Official documentation supplied in the assignment:
- Actuals: https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
- Forecasts: https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream

Verify the current API documentation and live schema before implementation. Endpoints, access requirements, query parameters, and response shapes may change.

### 4.2 Time and cutoff semantics

Keep these separate:

- **Delivery time:** the interval to which generation applies.
- **Publication time:** when a forecast record was published.
- **Decision cutoff:** the time at which a buyer's decision is assumed to be made.
- **Forecast lead time:** delivery time minus publication time, using consistent timezone-aware datetimes.

Use timezone-aware timestamps throughout. Normalize timestamps to UTC for comparisons and storage; display UK local time in the UI. Do not compare naive and aware datetimes or rely on the machine's local timezone.

January 2026 is in UK GMT, but code must remain timezone-aware and correct across daylight-saving transitions.

The exact market decision deadline is not specified in the assignment. Do not invent or present a cutoff as an official market deadline. Make the cutoff configurable and document the default as a pilot assumption. Prefer supporting a configurable cutoff per delivery day or a clearly specified decision timestamp. If using one cutoff for a selected delivery period, make the behavior explicit in the UI and docs.

### 4.3 Prevent look-ahead bias

For a delivery interval `t` and decision cutoff `T`, select the eligible forecast with the latest publication time `p` satisfying:

- Forecast target delivery interval matches `t`.
- `p <= T`.
- The record passes validation.

Formally:

`selected_forecast(t, T) = forecast(t, max(publishTime where publishTime <= T))`

If no eligible forecast exists, return a missing forecast for that interval. Never silently use a forecast published after the cutoff.

Preserve all usable forecast publication vintages so the application can compare:
1. Forecast available at the decision cutoff.
2. Later forecast revisions, where data allows.

A later revision can be useful for studying forecast evolution, but must never be represented as information available to the earlier purchasing decision.

Confirm that the specified raw endpoint actually exposes enough historical forecast publication history to reconstruct the required vintages. If it does not, document the limitation prominently and do not claim historical decision-time accuracy that cannot be substantiated.

### 4.4 Alignment, duplicates, and missing values

- Align forecast and actuals by normalized delivery interval, not publication timestamp.
- Confirm that `startTime` denotes the same interval convention in both datasets.
- Verify whether timestamps represent interval starts and whether all records are on a 30-minute grid.
- Determine actual and forecast units from official documentation/schema; do not assume them solely from field names.
- Validate numeric generation values; reject or mark invalid non-finite values.
- Define and test deterministic duplicate handling based on verified source semantics. Do not arbitrarily average duplicate records.
- Do not interpolate missing actuals or forecasts for headline accuracy metrics unless explicitly justified and separately labeled.
- Exclude pairs without both a valid eligible forecast and valid actual from the paired metrics.
- Always report valid pair count and coverage alongside error metrics.
- Clearly distinguish missing data from a genuine generation value of zero.

### 4.5 Metrics and interpretation

For each eligible paired interval, define:

`error = forecast_generation - actual_generation`

Compute at least:

- **MAE:** mean of absolute errors, in the source generation unit.
- **RMSE:** square root of mean squared errors, in the source generation unit.
- **Bias:** mean signed error; positive means overforecasting under the convention above.
- **Coverage:** valid paired intervals divided by the expected intervals in the requested scope, expressed as a percentage.
- **Sample count:** number of valid paired intervals used for each metric.

Use the same eligible paired sample for MAE, RMSE, and bias within each result. Avoid MAPE as a headline metric because it is unstable when actual generation is zero or near zero. If additional metrics are included, explain their definition and limitations.

Forecast lead-time buckets must be explicit, documented, and derived from verified timestamps. Do not compare lead-time buckets with different missing-data rules without showing sample counts and coverage.

### 4.6 Business limitation

The app does not have customer demand, electricity prices, existing contracts, other generation sources, or balancing-market positions. It therefore must not claim to calculate the utility's total required procurement volume, optimal thermal dispatch, monetary savings, or trading profit.

The app provides wind forecast information and error analysis to inform human procurement decisions. Clearly communicate this limitation in the UI and README.

## 5. Required documentation files

Create concise, useful Markdown documents before or alongside implementation:

1. `README.md`
   - Project purpose and screenshots if available.
   - Stack and architecture summary.
   - Prerequisites and local startup instructions.
   - Environment variables.
   - Docker instructions.
   - Test/lint/build commands.
   - Deployment URLs once genuinely available.
   - Data sources, limitations, and AI-tool disclosure.
   - Directory guide.

2. `docs/01-product-requirements.md`
   - Problem statement, target user, goals, user stories, MVP scope, exclusions, assumptions, success criteria.

3. `docs/02-data-and-analytics.md`
   - Source endpoints, verified schema, time semantics, data quality, cutoff policy, forecast selection, formulas, coverage rules, and known limitations.

4. `docs/03-architecture-and-api.md`
   - Components, data flow, module responsibilities, API endpoints, request/response examples, storage, configuration, security, and deployment design.

5. `docs/04-ux-and-dashboard.md`
   - Main screens, user journeys, chart definitions, filters, loading/empty/error states, responsive behavior, accessibility basics.

6. `docs/05-implementation-plan.md`
   - Task breakdown, time budget capped at 16 hours, test strategy, acceptance criteria, risks, deployment checklist, video plan.

7. `RULES_OF_INSTRUCTION.md`
   - Mandatory coding-agent rules described in Section 3.

Keep documents aligned with actual behavior. Do not state that a feature exists until it is implemented.

## 6. Recommended MVP screens

Build a cohesive, polished, responsive application with three main areas:

### A. Overview dashboard

Show:
- Selected delivery-date range and decision cutoff.
- Latest successful data retrieval/refresh metadata, if tracked.
- MAE, RMSE, bias, sample count, and coverage.
- Actual versus eligible forecast time series.
- Clear units and UK local timestamps.
- Helpful empty, partial-data, and error states.

### B. Forecast explorer

Show:
- Delivery interval.
- Actual wind generation.
- Selected eligible forecast.
- Forecast publication time and lead time.
- Signed and absolute error where an eligible actual exists.
- Clear status for missing forecast/actual pairs.
- A way to inspect later forecast revisions if historical vintages are available.

### C. Accuracy analysis

Show:
- Overall and daily accuracy metrics.
- Lead-time comparisons using documented buckets.
- A useful actual-versus-forecast visualization and/or error trend.
- Sample counts and coverage per aggregation.
- A comparison of decision-time forecasts versus later revisions, clearly labeled.

Avoid a cluttered trading-terminal imitation. Use a consistent visual system, readable charts, strong typography, accessible contrast, responsive layouts, and clear units. Every chart must have descriptive labels, axes, units, and a useful empty state. Do not use decorative charts that imply unsupported data.

## 7. Technical stack and architecture

### Frontend
- React with a maintained, common build setup (Vite is an acceptable default).
- TypeScript is preferred if it does not materially threaten the time budget; otherwise use modern JavaScript with disciplined structure.
- Use a charting library suitable for time series and accessible tooltips.
- Separate API access, view components, formatting utilities, and page-level composition.
- Use explicit loading, error, empty, and partial-data states.
- Do not put analytics/business logic inside large UI components.
- Configure the backend base URL via an environment variable.

### Backend
- Python with FastAPI and Pydantic models.
- Separate responsibilities into modules such as:
  - `api/` for HTTP routes.
  - `schemas/` for request/response validation.
  - `services/` for ingestion and orchestration.
  - `analytics/` for forecast selection and metrics.
  - `data/` or a repository layer for loading and caching.
- Keep pure analytical functions deterministic and independently testable.
- Add explicit HTTP timeouts, bounded retries for transient errors, clear error handling, and safe logging.
- Avoid logging secrets or dumping huge upstream payloads.
- Validate external API response shapes before using data.
- Provide a health endpoint and a metadata/status endpoint.

### Storage and ingestion
Choose the simplest solution that supports reproducibility:
- Prefer cached local JSON/Parquet data files for a time-limited pilot if the dataset is small enough and deployment permits persistent or bundled data.
- Do not assume a deployed filesystem is persistent. If runtime ingestion requires persistence, choose a suitable external store or ingest/build-time artifact strategy and document it.
- A database is optional unless data volume, query behavior, or deployment constraints justify it.
- Avoid fetching the entire historical dataset on every frontend request.
- Make ingestion repeatable and idempotent.
- Keep raw source records or a reproducible snapshot where practical, while avoiding committing oversized or restricted data.
- If data is unavailable, show a real data-unavailable state or a clearly labeled demo fixture. Never present synthetic data as Elexon data.

### Docker
- Provide a Dockerfile for the frontend and backend, plus `docker-compose.yml` for local development.
- Use reproducible dependency versions/lockfiles where practical.
- Add health checks where useful.
- Do not copy `.env` secrets into images.
- Ensure the documented Docker commands actually work.

### Deployment
- Deploy frontend to Vercel if suitable.
- Deploy FastAPI to a Python-compatible host such as Render or another available service.
- Configure CORS narrowly for the real frontend origin.
- Set production environment variables in the hosting dashboard, not in source control.
- Verify the deployed frontend, backend health endpoint, and at least one real API flow.
- If credentials or hosting access are unavailable, provide deployment configuration and exact manual steps, clearly stating deployment is pending.

## 8. API contract expectations

Use versioned or clearly namespaced endpoints, for example:

- `GET /api/health`
- `GET /api/metadata`
- `GET /api/forecasts`
- `GET /api/analytics/accuracy`
- `GET /api/analytics/lead-times`

Finalize query parameters only after agreeing on cutoff semantics. Validate dates and cutoff inputs, define date inclusivity, cap result sizes, and return consistent errors.

Response objects should make these fields clear where applicable:
- Delivery timestamp (ISO 8601).
- Actual generation and its validity/source status.
- Selected forecast generation.
- Forecast publication timestamp.
- Forecast lead time.
- Error values or null if not computable.
- Data-quality flags.
- Metric values, sample count, and coverage.
- Applied cutoff and analysis scope metadata.

Use consistent JSON types and `null` for unavailable values; do not encode missing values as zero or strings such as `"N/A"` in numeric fields.

## 9. Testing and quality requirements

Write automated tests at minimum for:

1. Latest eligible forecast is selected when multiple vintages exist.
2. A forecast published after the cutoff is rejected.
3. No eligible forecast returns missing, not a later forecast.
4. Delivery-time alignment is timezone-safe.
5. Duplicate records follow the documented policy.
6. Missing/invalid values do not contaminate metrics.
7. MAE, RMSE, bias, sample count, and coverage match known examples.
8. Zero actual generation does not break headline metrics.
9. Empty datasets and upstream API failures return safe, clear outcomes.
10. API responses conform to schemas.
11. Frontend loading, error, empty, and normal data states work.
12. Production frontend build succeeds.

Use small hand-calculated fixtures for analytics tests. Keep test fixtures clearly labeled and never mix them with production data. Prefer a focused test suite with meaningful assertions over tests that merely execute lines.

Before finishing, run and report the actual results of:
- Backend tests.
- Frontend tests, if configured.
- Frontend lint/type checks, if configured.
- Production frontend build.
- Docker build or Compose startup, where available.
- Basic API smoke tests.

Do not say “all tests pass” if some were not run. Report skipped checks and the reason.

## 10. Security, configuration, and maintainability

- Commit `.env.example` with placeholders and explanations.
- Ignore `.env`, `.env.*` local files except explicitly allowed example files, caches, build output, virtual environments, and secrets.
- Never require a secret in frontend-exposed environment variables.
- Configure CORS for known deployment origins rather than wildcard production access.
- Validate query parameters and constrain date ranges.
- Set request timeouts and reasonable response limits.
- Use structured, useful error messages without leaking internal stack traces to end users.
- Do not add authentication unless needed by deployment or explicitly required; document the pilot's public-access limitations.
- Keep dependencies minimal.
- Pin or lock dependencies where practical.
- Use readable names, type annotations where helpful, docstrings for non-obvious rules, and comments to explain *why*, not narrate obvious code.
- Avoid giant files, giant functions, deeply nested conditionals, unnecessary global state, and duplicated calculations.
- Do not suppress warnings or weaken tests just to obtain a green result.
- Ensure keyboard navigation, semantic labels, responsive layout, and legible chart colors.

## 11. Environment and startup expectations

Create `.env.example` with only the variables actually used by the implementation. Possible variables include:

- `VITE_API_BASE_URL` — frontend API base URL.
- `CORS_ORIGINS` — comma-separated allowed frontend origins.
- `ELEXON_BASE_URL` — upstream API base URL if configurable.
- `DATA_DIR` — local cache/data directory.
- `LOG_LEVEL` — logging verbosity.

Do not add unused variables. Explain which variables are needed for local Docker, local frontend/backend development, and production deployment.

The README must give copy-pasteable commands for:
- Cloning the repository.
- Creating `.env` from `.env.example`.
- Starting with Docker Compose.
- Starting the backend independently.
- Starting the frontend independently.
- Running tests.
- Rebuilding or refreshing the data snapshot if supported.

Verify the commands in the actual environment when possible.

## 12. Deployment, GitHub, and submission safeguards

- Use an anonymous, non-identifying repository name, as requested.
- Do not expose the user's personal information in repository metadata, README examples, screenshots, or commits unnecessarily.
- Never create a false public URL or claim an unverified URL works.
- Check public repository access without authentication where possible.
- Check the live app in a private/incognito browser session where possible.
- Verify that the frontend can call the backend in production.
- Do not put credentials, tokens, private datasets, or local environment files in GitHub.
- The assignment asks for an unlisted YouTube demo of no more than 10 minutes:
  - Part 1: customer-facing product and analysis overview, maximum 5 minutes.
  - Part 2: technical architecture, design, analytics, code, tests, and knowledge transfer, maximum 5 minutes.
- Prepare a concise recording outline and demonstrate the real running app. Do not claim a video has been uploaded until the URL is available and access is verified.
- Complete the submission form only when its exact URL and required fields are available. Verify each submitted URL in an incognito/private session.
- In README, explicitly disclose AI assistance truthfully, e.g. “AI coding assistants were used to support planning, implementation, debugging, and documentation; code and outputs were reviewed and tested by the developer.” Adjust this wording to match what actually occurred.

## 13. Suggested 16-hour execution budget

Treat the hours as a hard planning constraint; reduce optional polish before reducing data correctness or test coverage.

| Workstream | Budget |
|---|---:|
| Repository inspection, rules, and planning docs | 1.0 h |
| Elexon API investigation and sample retrieval | 1.5 h |
| Data normalization and forecast-vintage selection | 2.0 h |
| Analytics metrics and unit tests | 1.5 h |
| FastAPI endpoints and integration tests | 1.5 h |
| React UI, charts, and API integration | 4.0 h |
| Docker, environment config, and deployment | 1.5 h |
| README, end-to-end verification, and bug fixing | 1.0 h |
| Video preparation/recording and submission checks | 1.0 h |
| **Total** | **16.0 h** |

If the API data investigation reveals a major limitation, record it immediately, adjust scope, and preserve time for a credible end-to-end demo. Do not spend the entire budget polishing the frontend before confirming the data is suitable.

## 14. Definition of done

Do not mark the task complete until the following are true or explicitly marked as blocked:

- [ ] Required documentation and `RULES_OF_INSTRUCTION.md` exist and match the code.
- [ ] Elexon API schemas and data availability were verified.
- [ ] January 2026 actuals and forecasts are retrieved or a specific data limitation is documented.
- [ ] Forecast-vintage selection prevents look-ahead bias.
- [ ] Metrics are independently tested with known examples.
- [ ] The dashboard clearly displays the cutoff, units, timestamps, coverage, and sample count.
- [ ] Missing data and upstream failures are handled visibly and safely.
- [ ] Docker configuration and local startup instructions are verified.
- [ ] Frontend build and applicable tests have been run.
- [ ] Deployment is verified, or deployment steps are documented as pending due to access constraints.
- [ ] README contains directory guide, setup, environment, test, deployment, limitations, and AI disclosure.
- [ ] Public repository access is verified.
- [ ] Demo video is uploaded as unlisted and its link is verified.
- [ ] Submission form is completed and all submitted links are accessible.

Finish with a concise handoff report listing:
1. What was built.
2. Important design decisions.
3. Commands actually run and their results.
4. Verified repository and deployment URLs.
5. Known limitations and unresolved questions.
6. Remaining manual actions, including video/form steps if not completed.

## 15. Working style for the AI coding agent

Act as a thoughtful full-stack engineer, not a code generator that blindly follows a prompt.

- Inspect first; plan; implement in coherent increments; test; review; document.
- Prefer evidence from the source data and official API docs over assumptions.
- When uncertain, state the uncertainty and investigate if feasible.
- Keep the user informed at meaningful milestones, not with repetitive status messages.
- Do not ask for confirmation for ordinary implementation details that can be resolved safely and documented.
- Ask before destructive operations, committing/pushing if authorization is unclear, or using credentials/accounts.
- Never fabricate API data, test output, screenshots, URLs, or deployment status.
- Do not stop after scaffolding. Deliver the most complete working MVP possible within the time budget.
