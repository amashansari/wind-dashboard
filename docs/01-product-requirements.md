# 01. Product Requirements Document (PRD)

## 1. Problem Setting & Business Context

In the Great Britain electricity system, licensed energy suppliers and utilities are responsible for balancing customer demand with electricity procured from wholesale markets. Under the Balancing and Settlement Code (BSC) administered by Elexon, imbalances between contracted energy and actual consumption/generation incur balancing charges.

Power generation from renewable sources—chiefly national onshore and offshore wind—is weather-dependent and volatile. In the UK Day-Ahead (D-1) wholesale market (EPEX SPOT / Nord Pool), procurement decisions must be made the day before physical delivery (typically before the day-ahead auction gate closure around 11:00–12:00 UK time, or bilateral cutoffs later in the day).

To calculate how much conventional or flexible power (e.g., CCGT, pumped storage, interconnector capacity) must be procured in the day-ahead market, procurement teams must subtract expected renewable generation from forecasted consumer demand:

$$\text{Net Procurement Required} = \text{Forecasted Customer Demand} - \text{Expected Renewable Generation}$$

An inaccurate wind forecast leads directly to costly volume exposure:
- **Overforecasting wind** causes under-procurement day-ahead, forcing the utility to buy deficit volume in the more volatile within-day market or pay high system buy prices (SBP) in the Balancing Mechanism.
- **Underforecasting wind** causes over-procurement day-ahead, forcing the utility to spill excess power at depressed within-day prices or pay system sell prices (SSP).

Therefore, the procurement desk requires a dedicated intelligence tool to:
1. View the exact wind generation forecasts available at the decision cutoff timestamp.
2. Evaluate historical forecast accuracy quantitatively against outturn actuals.
3. Understand error distributions, bias, and lead-time degradation to factor quantified error margins into day-ahead bidding strategies.

---

## 2. Target Users

- **Primary User**: Short-term Power Procurement Analysts & Traders at UK Energy Utilities.
- **Secondary User**: Energy Risk Managers and Portfolio Leads monitoring volumetric exposure and forecast vendor performance.
- **Technical Reviewer**: Engineering Lead / Architect reviewing system design, data integrity, and reproducibility.

---

## 3. Goals & Success Criteria

### Core Goals
1. **Decision Cutoff Fidelity**: Render the exact latest forecast available at a specified decision cutoff timestamp $T$ for any delivery interval $t$, strictly enforcing $\text{publishTime} \le T$ to prevent look-ahead bias.
2. **Quantitative Accuracy Evaluation**: Compute transparent, reproducible accuracy metrics:
   - Mean Absolute Error (MAE) in MW
   - Root Mean Squared Error (RMSE) in MW
   - Mean Forecast Bias in MW (where $\text{bias} > 0$ denotes overforecasting)
   - Matched sample counts and data completeness coverage
3. **Lead Time Analysis**: Assess how forecast accuracy degrades or improves as the lead time increases from intraday (1–4 hours) to day-ahead (12–36 hours) and multi-day horizons.
4. **Transparent Data Integrity**: Clearly document and display source data attributes, missing intervals, unit conventions (MW), and upstream limitations without any data fabrication or false marketing claims.

### Success Criteria
- Zero look-ahead bias in evaluated metrics.
- 100% test coverage of critical analytics and filtering algorithms.
- Sub-second API and dashboard query latency for January 2026 data.
- Accessible, responsive UI adhering to utility control-room design standards.

---

## 4. MVP Scope & Boundaries

### In Scope
- National GB wind generation actuals from Elexon `FUELHH/stream` (`fuelType == "WIND"`).
- National GB wind generation forecasts from Elexon `WINDFOR/stream`.
- Period of interest: Delivery dates and purchasing decisions in January 2026.
- Interactive date filtering, configurable decision cutoff assumptions (e.g. Day-Ahead 12:00, Day-Ahead 17:00, or custom), delivery interval inspection, and forecast revision history.
- Local containerization with Docker Compose, public anonymous GitHub repository, and cloud deployment.

### Explicit Non-Goals & Exclusions
- **No external datasets**: In strict adherence to the challenge specification, no weather feeds (wind speed/direction), price series (N2EX / EPEX SPOT), demand curves, or thermal generation schedules are introduced.
- **No procurement cost or savings claims**: Because no price, demand, or contract data is provided, the application will not calculate financial savings, avoided cash-out charges, or optimal dispatch quantities.
- **No synthetic data presented as real**: All displayed generation metrics are derived exclusively from verified Elexon endpoints or transparently labeled fallback fixtures.

---

## 5. User Stories

| ID | As a... | I want to... | So that I can... |
|---|---|---|---|
| US-01 | Procurement Trader | Select a delivery date in January 2026 and set a decision cutoff time | See the precise wind forecast that was available when the trading desk had to commit bids. |
| US-02 | Procurement Analyst | Compare the decision-time forecast directly against outturn actual generation | Quantify the forecast error (signed bias and absolute error) for each interval. |
| US-03 | Risk Manager | View headline MAE, RMSE, and bias across the month or selected date range | Quantify the risk margin and uncertainty buffer needed for thermal backup hedges. |
| US-04 | Procurement Trader | Inspect forecast evolution across subsequent vintages | Observe whether intraday updates converged toward actual outturn generation. |
| US-05 | Technical Lead | Inspect data coverage, matched sample count, and API metadata | Verify data provenance, alignment integrity, and absence of look-ahead bias. |
