# 02. Data and Analytics Specification

## 1. Upstream Data Sources & Verified Schema

Data is acquired strictly from the official Elexon Insights BMRS API endpoints specified in the assignment:

### 1.1 Actual Generation: `FUELHH/stream`
- **Official Documentation**: `https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream`
- **Live Stream Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
- **Query Parameters**:
  - `publishDateTimeFrom` (ISO 8601 UTC)
  - `publishDateTimeTo` (ISO 8601 UTC)
- **Record Schema**:
  ```json
  {
    "dataset": "FUELHH",
    "publishTime": "2026-01-01T04:00:00Z",
    "startTime": "2026-01-01T03:30:00Z",
    "settlementDate": "2026-01-01",
    "settlementPeriod": 8,
    "fuelType": "WIND",
    "generation": 15264
  }
  ```
- **Filtering Rule**: Must strictly filter records where `fuelType == "WIND"`.
- **Interval Resolution**: Half-hourly (30 minutes, 48 settlement periods per day, except clock change days).
- **Unit**: Megawatts (MW) of average power output during the half-hour settlement interval.

### 1.2 Forecast Generation: `WINDFOR/stream`
- **Official Documentation**: `https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream`
- **Live Stream Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
- **Query Parameters**:
  - `publishDateTimeFrom` (ISO 8601 UTC)
  - `publishDateTimeTo` (ISO 8601 UTC)
- **Record Schema**:
  ```json
  {
    "dataset": "WINDFOR",
    "publishTime": "2026-01-01T02:30:00Z",
    "startTime": "2025-12-31T21:00:00Z",
    "generation": 19498
  }
  ```
- **Interval Resolution**: Hourly delivery intervals (`:00:00Z`) with up to 73 hours forward forecast horizon per vintage.
- **Publication Frequency**: Published periodically (approximately 4 to 8 vintages per day, e.g. 02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30, 22:30 UTC).
- **Unit**: Megawatts (MW).

---

## 2. Time Semantics & Look-Ahead Prevention

### 2.1 Distinct Time Concepts
1. **Target Delivery Time ($t$)**: The starting timestamp of the half-hour or hourly settlement delivery window (`startTime`).
2. **Forecast Publication Time ($p$)**: The exact timestamp when National Grid ESO / Elexon published that forecast vintage (`publishTime`).
3. **Decision Cutoff Timestamp ($T$)**: The procurement deadline cutoff before physical delivery.
4. **Forecast Lead Time ($L$)**: The duration between forecast publication and the target delivery interval:
   $$L = t - p$$

### 2.2 Prevention of Look-Ahead Bias
To evaluate the information available to a buyer at decision cutoff $T$ for delivery interval $t$, the selection algorithm must strictly evaluate only forecasts created prior to or at $T$:

$$\mathcal{F}_{\text{eligible}}(t, T) = \{ f \in \text{WINDFOR} \mid f.\text{startTime} = t \land f.\text{publishTime} \le T \}$$

The selected decision-time forecast is the **latest** eligible publication vintage:
$$f_{\text{selected}}(t, T) = \arg\max_{f \in \mathcal{F}_{\text{eligible}}(t, T)} (f.\text{publishTime})$$

If $\mathcal{F}_{\text{eligible}}(t, T) = \emptyset$, the selected forecast is `null` (missing). A later forecast published at $p > T$ must **never** be used to backfill or evaluate the decision-time performance.

### 2.3 Default Decision Cutoff Convention
In the UK Day-Ahead power market:
- The standard day-ahead auction bids close at **11:00 UK time (D-1)**, with clearing results released around **12:00 UK time (D-1)**.
- Many utility desks run final bilateral balancing position checks around **17:00 UK time (D-1)**.
- **Implementation Design**:
  - The default decision cutoff is configurable per delivery day:
    $$\text{Default Cutoff}(D) = (D - 1 \text{ day}) \text{ at } 12:00\text{ UTC (or 17:00 UTC)}$$
  - The API and UI support selecting preset cutoff rules (Day-Ahead 12:00, Day-Ahead 17:00, or a specific user-defined timestamp), ensuring transparent and customizable market assumptions.

---

## 3. Data Alignment, Duplicates & Missing Values

### 3.1 Interval Alignment
- `FUELHH` Wind actuals are half-hourly (`:00` and `:30`).
- `WINDFOR` forecasts are hourly (`:00`).
- **Primary Matched Pairs**: Joined on exact `startTime` (`YYYY-MM-DDTHH:00:00Z`). This yields 24 high-confidence, non-interpolated matched pairs per full day.
- **Reporting Half-Hour Actuals**: Both `:00` and `:30` actuals are displayed on the time series charts to give users complete visibility into wind ramping behavior. For intervals without a raw forecast (`:30`), the forecast is shown as unforecasted/missing on the raw grid.
- **No Fabricated Interpolation**: The system never manufactures fake `:30` forecasts and claims they are real Elexon numbers.

### 3.2 Duplicate Handling Policy
If upstream returns duplicate records for the same `(startTime, fuelType)` in FUELHH or `(startTime, publishTime)` in WINDFOR:
- Sort deterministically by publication timestamp descending, then ingest sequence.
- Keep the first valid finite record.
- Log duplicate occurrences for auditability.

### 3.3 Missing Values Policy
- Missing values are stored and serialized as JSON `null`.
- Missing values are **never** replaced with `0` MW (which represents zero wind generation / calm weather).
- Incomplete intervals are excluded from paired error metrics ($N$).

---

## 4. Analytics Formulas & Definitions

For a set of $N$ valid matched pairs with actual generation $A_i$ and selected forecast $F_i$ ($i = 1, \dots, N$):

### 4.1 Error Definition
$$\text{error}_i = F_i - A_i$$

### 4.2 Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |F_i - A_i| \quad (\text{in MW})$$
Represents the average absolute magnitude of forecast miss regardless of direction.

### 4.3 Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2} \quad (\text{in MW})$$
Penalizes larger forecast errors more heavily, reflecting the nonlinear cost of large imbalance volumes.

### 4.4 Mean Forecast Bias
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i) \quad (\text{in MW})$$
- $\text{Bias} > 0$: **Overforecasting** (forecast consistently exceeds actual generation).
- $\text{Bias} < 0$: **Underforecasting** (forecast consistently understates actual generation).

### 4.5 Data Completeness & Coverage
$$\text{Coverage} = \frac{N}{N_{\text{expected}}} \times 100\%$$
where $N_{\text{expected}}$ is the total expected intervals in the selected date range.

### 4.6 Lead-Time Grouping
Forecast lead time $L = t - p$ is categorized into standard trading decision horizons:
- **Intraday (1–4 hrs)**: Very short-term adjustments.
- **Near Day-Ahead (4–12 hrs)**: Evening prior adjustments.
- **Day-Ahead Auction (12–24 hrs)**: Standard day-ahead procurement window.
- **Multi-Day (24–48+ hrs)**: Weekend / early position forecasting.

---

## 5. Domain & Commercial Boundaries

The application explicitly does NOT compute:
- Total utility imbalance charges or cash-out cash flows.
- Optimal thermal generator dispatch.
- Customer demand net residual curves.
This is because wholesale price curves, consumer load curves, and thermal operational heat rates are intentionally excluded from the Elexon scope.
