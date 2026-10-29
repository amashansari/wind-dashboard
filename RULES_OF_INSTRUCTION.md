# RULES_OF_INSTRUCTION

These rules govern all engineering, development, testing, and deployment activities for the UK Wind Procurement Intelligence challenge. They are mandatory and take precedence across all workflows.

---

## 1. Core Principles & Engineering Standards

- **Professional Quality**: Write production-minded, readable, and maintainable code with clear abstractions, explicit typing, predictable error handling, and low duplication.
- **Maintain Documentation Integrity**: Preserve existing comments, docstrings, and documentation unless specifically updating them to reflect changes.
- **Preserve User Code**: Always inspect existing code and git status before making changes. Never overwrite, delete, or discard unrelated files or changes.
- **Avoid Overengineering**: Do not introduce premature abstractions, unnecessary design patterns, microservices, or redundant layers. Keep solutions simple, robust, and verifiable within the 16-hour effort budget.
- **Coherent Changes**: Implement changes in small, testable, reviewable increments.

---

## 2. Rules Against Fabricating Data or Results

- **Absolute Truthfulness**: Never fabricate historical observations, generate synthetic generation numbers and present them as real Elexon data, or claim unverified capabilities.
- **No Look-Ahead Bias**:
  - For any delivery interval $t$ and decision cutoff $T$, select ONLY the forecast whose publication timestamp satisfies:
    $$\text{publishTime} \le T$$
  - Formally:
    $$\text{selected\_forecast}(t, T) = \text{forecast}(t, \max(\text{publishTime} \mid \text{publishTime} \le T))$$
  - Never allow forecasts published after the decision cutoff to evaluate what a purchaser could have known at decision time.
  - If no forecast is eligible before the cutoff, report the forecast as missing (`null`), never substitute a later vintage or default to zero.
- **Transparent Limitations & Fallbacks**:
  - If historical forecast vintages or actual observations are unavailable from the upstream API, clearly label missing/incomplete data.
  - Display transparent empty and error states in the UI.
  - Document all known data limitations, API endpoint behavior, and cutoff assumptions prominently in the documentation and UI.
- **No Unsubstantiated Business Claims**:
  - The dataset contains only wind actuals and wind forecasts from Elexon.
  - Do NOT claim procurement savings, optimal thermal dispatch, avoided imbalance costs, or total demand coverage, as no price, demand, contract, or thermal dispatch data is supplied.

---

## 3. Data Ingestion, Validation & Time Semantics

- **Source Endpoints**:
  - Actual generation: `FUELHH/stream`, filtered strictly to `fuelType == "WIND"`.
  - Forecast generation: `WINDFOR/stream`.
- **Validation at System Boundary**:
  - Validate all inbound API responses with Pydantic schemas before processing.
  - Validate numeric values (non-negative, finite numbers).
  - Explicitly handle duplicates deterministically (e.g., deduplicate by `(startTime, publishTime)`).
  - Do not treat missing data as zero. Missing values must be represented as `null`.
- **Timezone Awareness & Formatting**:
  - Use timezone-aware UTC timestamps (`datetime.timezone.utc`) for all internal calculations, comparisons, joins, and persistence.
  - Clearly separate:
    1. **Delivery Interval** (`startTime`): The 30-minute settlement period during which power is generated.
    2. **Publication Timestamp** (`publishTime`): When the forecast was created and released.
    3. **Decision Cutoff Timestamp** ($T$): The cutoff time before delivery when procurement decisions are finalized.
    4. **Lead Time**: Target delivery time minus publication time.
  - Display timestamps in UK local time (`Europe/London`, handling GMT/BST correctly) in the frontend user interface.
- **Unit Integrity**:
  - Document the generation unit based on official Elexon documentation (Megawatts, MW / MWh per half hour).
  - Consistently label all charts, tables, tooltips, and metrics with the verified unit.

---

## 4. Analytics & Error Metrics

- **Error Convention**:
  $$\text{error} = \text{forecast\_generation} - \text{actual\_generation}$$
  - A positive bias indicates **overforecasting** (forecast exceeded actual generation).
  - A negative bias indicates **underforecasting** (forecast fell short of actual generation).
- **Required Headline Metrics**:
  - **MAE** (Mean Absolute Error): $\frac{1}{N} \sum | \text{forecast} - \text{actual} |$
  - **RMSE** (Root Mean Squared Error): $\sqrt{\frac{1}{N} \sum (\text{forecast} - \text{actual})^2}$
  - **Mean Bias**: $\frac{1}{N} \sum (\text{forecast} - \text{actual})$
  - **Matched Observations Count** ($N$): Number of valid intervals having both an eligible forecast and an actual generation value.
  - **Data Coverage / Completeness**: Ratio of valid paired intervals to total expected half-hour intervals in the evaluation window.
- **Metric Integrity**:
  - Do NOT use MAPE (Mean Absolute Percentage Error) as the primary headline metric due to instability when actual generation is zero or near zero. If percentage metrics are shown, clearly document the epsilon or denominator convention.
  - Compute MAE, RMSE, and bias over the exact same matched sample subset.

---

## 5. Architecture & Implementation Guidelines

- **Backend (Python / FastAPI)**:
  - Separate concerns into distinct modules:
    - `app/api/`: HTTP route handlers and dependencies.
    - `app/schemas/`: Pydantic request/response models.
    - `app/services/`: Upstream Elexon ingestion, caching, and repository logic.
    - `app/analytics/`: Pure, deterministic calculation of cutoffs, joins, errors, and lead times.
    - `app/core/`: Configuration, logging, and environment settings.
  - Implement request timeouts, bounded retries with exponential backoff for network resilience, structured logging, and narrow CORS handling.
  - Provide `/api/health` and `/api/metadata` endpoints.
- **Frontend (React / TypeScript / Vite)**:
  - Comply with `RULES_OF_INTEGRATION.md`:
    - Use **Zustand** stores for shared state (`module-name.store.ts`).
    - Encapsulate business logic, data fetching, and transformations in custom hooks (`module-name.ts`).
    - Centralize API calls in action files (`module-name.action.ts`) via `apiHandler`.
    - Centralize API route definitions in `ENDPOINT.ts`.
    - Define all types in `types/index.ts`. Never use `any`.
    - Use **shadcn/ui** components for buttons, dialogs, selects, tabs, cards, badges, and tooltips.
    - Use a reliable charting library (e.g., Recharts) with descriptive labels, tooltips, and units.
    - Implement explicit loading skeletons, error banners, and empty state cards.

---

## 6. Testing & Verification Requirements

- **Backend Test Suite (`pytest`)**:
  - Forecast vintage selection: Verify that the latest forecast published at or before cutoff is selected.
  - Look-ahead bias prevention: Verify that any forecast published after cutoff is strictly excluded.
  - Fallback behavior: Verify that an interval with no forecast published prior to cutoff produces `null`.
  - Timezone safety: Test boundary conversions and delivery interval alignment.
  - Metric correctness: Verify hand-calculated fixtures for MAE, RMSE, bias, sample count, and coverage.
  - Zero generation test: Verify calculations do not error when actual generation is 0 MW.
  - Upstream error handling: Mock upstream network timeouts and API errors.
  - Schema conformity: Validate response schemas against Pydantic models.
- **Frontend Verification**:
  - Test UI state transitions (loading, error, empty, data).
  - Verify date and cutoff selector interactions.
  - Ensure zero build/lint errors in `npm run build`.

---

## 7. Security, Configuration & Deployment

- **Secret Protection**:
  - Never commit `.env` files, API keys, passwords, or personal credentials to Git.
  - Maintain a clean `.env.example` with clear documentation for all configuration keys.
- **CORS & Access**:
  - Configure CORS allow-origins strictly for the known frontend domain and local development origins.
- **Docker**:
  - Provide reproducible Dockerfiles for frontend and backend.
  - Provide a root `docker-compose.yml` to run the entire stack locally with healthchecks.
- **Deployment & Submission**:
  - Deploy frontend to Vercel and backend to a compatible Python host.
  - Prepare a public GitHub repository with an anonymous, non-identifying name.
  - Never declare a deployment, URL, video, or repository as complete without explicit verification.
  - Explicitly disclose AI tool usage in `README.md`.



These rules define how code should be implemented whenever a prompt is given to Antigravity. Follow these rules by default unless the prompt explicitly requires an exception.

## 1. State Management

- Do **not** use React `useState` by default.
- Use a **Zustand store** instead of local component state.
- Store file naming convention:
  - `module-name.store.ts`
- `useState` is allowed only when:
  - It is genuinely required for the specific file.
  - The state has no dependency on, or impact on, other components.
  - Using a Zustand store would add unnecessary complexity for that isolated case.
- Prefer shared and predictable state management through Zustand whenever state needs to be consumed, updated, or coordinated across components.

## 2. Logic, Hooks, and Optimization

- All logical/business functions must be implemented in an optimized, production-level manner.
- Avoid putting complex logic directly inside components.
- Functions, state-related logic, `useEffect`, API calls, transformations, handlers, and other reusable logic should be placed in the appropriate custom hook.
- Hook file naming convention:
  - `module-name.ts`
- Keep components focused primarily on:
  - Rendering UI.
  - Passing required data and callbacks.
  - Handling minimal presentation-level concerns.
- Avoid duplicated logic.
- Prefer reusable, composable functions and hooks.
- Optimize for readability, maintainability, performance, and scalability.

## 3. API Calls and Payload Handling

- All API calls must be handled through `apiHandler`.
- Do not make direct API requests from components.
- For every API request, create the payload using `const`.
- For `GET` requests, pass the payload through `getQuery`.
- Example pattern:

```ts
const payload = {
  page,
  limit,
  search,
};

const response = await apiHandler(
  "GET",
  ENDPOINTS.module.list,
  getQuery(payload),
);
```

- Keep API request construction inside the appropriate hook/action layer rather than inside UI components.

## 4. Type Safety

- Do **not** use `any` for API request or response data.
- Every API-related data structure must have an explicit TypeScript type/interface.
- Define the required types in:

```text
types/index.ts
```

- Types used only within the module should **not be exported** unless they are required outside that module.
- Reuse existing types where applicable instead of creating duplicate types.
- Avoid unnecessary type assertions and preserve strict type safety throughout the implementation.

## 5. API Endpoints and Actions

### Endpoints

- All API endpoints must be defined in:

```text
ENDPOINT.ts
```

- Do not hardcode API endpoint strings inside components, hooks, or action files.

### Actions

- Create a dedicated action file for each module:

```text
module-name.action.ts
```

- Actions should be responsible for communicating with the API layer.
- Keep endpoint definitions separate from API actions.
- Keep business/UI logic separate from actions.

Recommended structure:

```text
module/
├── module-name.ts
├── module-name.action.ts
├── module-name.store.ts
└── ...
types/
└── index.ts
ENDPOINT.ts
```

## 6. Code Structure and Optimization

- Do not add unnecessary `if/else` conditions.
- Do not add redundant checks, variables, functions, imports, or abstractions.
- Keep the implementation simple without sacrificing correctness.
- Prefer early returns when they improve readability.
- Avoid deeply nested conditional logic.
- Do not repeat the same logic in multiple places.
- Reuse existing utilities, hooks, stores, types, and API helpers when available.
- Do not introduce a new abstraction if an existing project abstraction already solves the problem.
- Maintain the existing project architecture and coding conventions.
- Do not make unrelated changes while implementing a requested feature or fix.
- Preserve existing behavior unless the requested change specifically requires modifying it.

## 7. Default Implementation Principles

Whenever implementing a new feature or modifying existing code:

1. Check the existing architecture before adding new files or patterns.
2. Reuse existing stores, hooks, API handlers, endpoint structures, and types where possible.
3. Keep UI components lightweight.
4. Put reusable logic in hooks.
5. Put shared state in Zustand stores.
6. Put API communication in action files and `apiHandler`.
7. Put endpoint definitions in `ENDPOINT.ts`.
8. Put shared TypeScript types in `types/index.ts`.
9. Never use `any` when a proper type can be defined.
10. Avoid unnecessary conditional logic and duplicated code.
11. Optimize the implementation for production-level readability, maintainability, and performance.
12. Make the smallest clean change necessary to fulfill the prompt.

## 8. Exception Rule

The rules above are the default standards and should always be followed unless a specific prompt explicitly requires otherwise.

If an exception is necessary, keep it as localized as possible and do not weaken the architecture of unrelated files or components.

## 9. UI Components and shadcn/ui

- Use **shadcn/ui components** wherever an appropriate component already exists.
- Prefer shadcn/ui components instead of creating custom implementations for common UI elements.
- Use existing project shadcn/ui components such as:
  - `Button`
  - `Input`
  - `Textarea`
  - `Select`
  - `Dialog`
  - `Sheet`
  - `Popover`
  - `Tooltip`
  - `Checkbox`
  - `RadioGroup`
  - `Switch`
  - `Tabs`
  - `Card`
  - `Badge`
  - `Command`
  - `Label`
  - and other applicable shadcn/ui components.
- Before creating a new UI component, check whether an existing shadcn/ui component can be reused.
- Do not introduce another UI component library when a suitable shadcn/ui component already exists.
- Follow the project's existing shadcn/ui patterns, variants, styling, and accessibility conventions.
- Native HTML elements are allowed and should be used where appropriate for simple structural or semantic content, including:
  - `div`
  - `span`
  - `p`
  - `h1`–`h6`
  - `section`
  - `article`
  - `main`
  - `header`
  - `footer`
  - and other semantic HTML elements.
- Do **not** unnecessarily replace simple HTML elements such as `div`, `p`, `span`, or headings with shadcn/ui components.
- For interactive or reusable UI elements, prefer the appropriate shadcn/ui component over manually building the component.
- Keep UI implementation consistent, reusable, accessible, and aligned with the existing application design.