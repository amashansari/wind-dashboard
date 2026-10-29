# 04. UX and Dashboard Design Specification

## 1. Visual & Design System Principles

- **Utility Control Room Aesthetic**: Clean, high-contrast, data-dense interface designed for trading desks and power analysts.
- **Color Semantics**:
  - **Wind Actuals**: Solid Emerald / Teal (`#10b981`) representing realized physical energy.
  - **Decision-Time Forecast**: Amber / Gold (`#f59e0b`) representing anticipated renewable power.
  - **Subsequent Revisions**: Slate / Blue (`#3b82f6`) representing updated intraday forecast vintages.
  - **Error Indicators**: Rose / Coral (`#f43f5e`) for negative errors / shortfall; Indigo (`#6366f1`) for positive bias / overforecasting.
- **Typography & Units**:
  - Clean monospace numbers for values (`font-mono`), with explicit unit indicators (`MW`).
  - Clear UK local time annotations (e.g. `14:30 GMT`) alongside UTC references.

---

## 2. Main Dashboard Views

The application provides three dedicated tabs:

### 2.1 Tab A: Overview Dashboard
- **Top Control Bar**:
  - Date Range Picker (supports single-day or multi-day selection in January 2026).
  - Decision Cutoff Selector:
    - `Day-Ahead 12:00 (Auction Cutoff)` (Default)
    - `Day-Ahead 17:00 (Evening Position)`
    - `Custom Timestamp`
  - Data Refresh button with timestamp of current snapshot.
- **Headline KPI Cards**:
  - **MAE**: Mean Absolute Error in MW (with percentage of average generation for scale).
  - **RMSE**: Root Mean Squared Error in MW (reflecting extreme volatility risk).
  - **Mean Bias**: Signed bias in MW, with an explicit badge: `Overforecasting` or `Underforecasting`.
  - **Matched Observations**: Count of valid matched pairs (e.g., $24 / 24$ for a full day).
  - **Data Completeness**: Coverage percentage.
- **Primary Time Series Chart**:
  - Dual line chart comparing Actual Wind Generation (MW) vs. Decision-Time Forecast (MW) across the selected intervals.
  - Interactive tooltip displaying: interval timestamp, actual MW, forecast MW, error delta, and forecast publish time.
- **Error Residual Bar Chart**:
  - Bar chart showing signed error ($F - A$) for each delivery interval, visually highlighting peak deficit and peak surplus periods.

---

### 2.2 Tab B: Forecast Explorer
- **Purpose**: Deep inspection into specific 30-minute and 1-hour settlement delivery intervals and vintage selection.
- **Features**:
  - Interactive interval selector or grid table.
  - Detailed interval card showing:
    - Target Delivery Interval (`startTime`)
    - Settlement Period ($1$ to $48$)
    - Outturn Generation (MW)
    - Selected Forecast (MW)
    - Forecast Publication Timestamp (`publishTime`)
    - Lead Time at Cutoff (e.g., $14.5$ hours ahead)
    - Applied Decision Cutoff
  - **Vintage Evolution Drawer / Comparison**:
    - For any selected delivery interval, visualizes how the forecast evolved across multiple publication vintages leading up to delivery.
    - Clearly delineates the **decision cutoff line**: forecasts published *before* cutoff are marked `Available at Decision`; forecasts published *after* cutoff are marked `Post-Cutoff Revisions (Informational Only)`.
    - This provides traders with valuable post-analysis on forecast convergence without look-ahead bias.

---

### 2.3 Tab C: Accuracy Analysis
- **Purpose**: Quantitative risk evaluation and error diagnostics.
- **Features**:
  - **Daily Performance Table & Chart**: Day-by-day comparison of MAE, RMSE, and bias across the month.
  - **Lead-Time Accuracy Curve**:
    - Bar / line chart displaying MAE and RMSE grouped by lead-time horizon:
      - Intraday ($1$–$4$h)
      - Near Day-Ahead ($4$–$12$h)
      - Day-Ahead ($12$–$24$h)
      - Two-Day Ahead ($24$–$48$h)
    - Demonstrates forecast decay as horizons extend.
  - **Error Distribution Histogram**:
    - Frequency distribution of forecast errors showing skewness and fat tails.
  - **Methodology & Limitations Notice**:
    - Prominent banner explaining the exact mathematical formulas, why MAPE is avoided for near-zero generation, and reminding users that no price/demand data is modeled.

---

## 3. UI States (Loading, Error, Empty)

- **Loading State**:
  - Skeleton loaders for KPI cards and chart placeholders with pulsing subtle animations.
- **Error State**:
  - Informative banner detailing the network or upstream error, with a one-click "Retry" button.
- **Empty State**:
  - Clear message if a user selects a date range with no matching observations (e.g. outside January 2026), providing quick preset buttons (e.g. "Jump to Jan 1–7, 2026").
- **Partial Data State**:
  - Explicit warning when some intervals are missing forecasts or actuals, clearly displaying the coverage percentage.

---

## 4. Accessibility & Responsiveness

- All interactive controls have semantic labels, keyboard focus rings, and ARIA attributes.
- High-contrast text exceeding WCAG AA standards.
- Fully responsive layout: collapses gracefully from multi-column desktop layout to vertical mobile view.
