# Video Demonstration Script & Presentation Guide

> **Assignment Requirement:** Maximum 10-minute unlisted YouTube video divided into two parts (max 5 minutes customer pitch, max 5 minutes technical walkthrough).

---

## Part 1: Customer & Business Pitch (4:30 – 5:00 minutes)

**Target Audience:** Energy Utility Day-Ahead Power Procurement Desk & Risk Committee  
**Speaker Role:** Lead Product Developer / Solutions Architect

### Minute 0:00 – 1:00 | The Wholesale Procurement Challenge
- **Visual:** Title slide / Overview Dashboard on January 1–7, 2026.
- **Narrative:**
  > "Hello everyone. Today I'm presenting our UK Wind Generation Procurement Intelligence platform, developed specifically for your day-ahead power trading and risk management team.
  >
  > Under the UK Balancing and Settlement Code, every Megawatt-hour of imbalance between your contracted power and physical consumer demand exposes the utility to volatile balancing mechanism cash-out prices. Because wind generation now represents a massive proportion of the British power grid, your net procurement volume in the day-ahead wholesale auction (EPEX SPOT / Nord Pool) is directly driven by your wind generation forecast.
  >
  > If wind is overforecast, you under-procure day-ahead and face expensive within-day peak prices. If wind is underforecast, you over-procure and spill volume at distress prices. Our platform was purpose-built to give your trading desk complete clarity into forecast error distributions and the exact forecasts available when you commit bids."

### Minute 1:00 – 2:30 | Live Product Tour: Overview & Forecast Accuracy
- **Visual:** Overview tab showing KPI cards (MAE, RMSE, Bias) and the dual-line time series chart for Jan 1–7.
- **Narrative:**
  > "Let's examine the Overview dashboard for the first week of January 2026.
  >
  > Looking at the headline KPIs:
  > - Our **Mean Absolute Error (MAE)** is **2,112 MW**, which represents approximately 18% of mean national generation during this stormy winter period.
  > - The **Root Mean Squared Error (RMSE)** is **2,560 MW**—notice that RMSE is higher than MAE, which correctly penalizes large extreme swings where your balancing risk escalates nonlinearly.
  > - Crucially, look at the **Mean Forecast Bias**: it is **+1,956 MW**. That positive sign is vital: under our strict market convention, positive bias means systematic overforecasting. During early January 2026, National Grid ESO's day-ahead forecasts consistently predicted more wind output than actually materialized.
  >
  > For your procurement desk, this is actionable intelligence: entering the day-ahead auction with an unadjusted forecast would have left you systematically short by nearly 2 GW, forcing expensive distressed purchases within-day."

### Minute 2:30 – 3:45 | Deep Dive: Forecast Explorer & Vintage Convergence
- **Visual:** Switch to the **Forecast Explorer** tab. Select an interval (e.g. Jan 1 at 12:00 UTC) and highlight the Vintage Evolution chart and table.
- **Narrative:**
  > "Now let's switch to the Forecast Explorer. A common flaw in trading analytics is look-ahead bias—evaluating historical decisions using forecasts published *after* the auction gate closure.
  >
  > Here, our system enforces a strict decision cutoff. For January 1st, our day-ahead cutoff is set to 12:00 UTC on December 31st.
  >
  > In the Vintage Progression panel, you can see every single forecast issued by Elexon for this settlement period. Vintages published before noon on D-1 are highlighted as eligible choices. Vintages published later that evening or within-day are clearly separated as post-cutoff revisions.
  >
  > You can visually trace how the forecast evolved: as physical delivery approached, subsequent revisions converged toward the green actual outturn line. This gives your analysts confidence in when intraday updates become actionable."

### Minute 3:45 – 4:45 | Accuracy Diagnostics & Horizon Decay
- **Visual:** Switch to the **Accuracy Analysis** tab. Show the Lead-Time Horizon chart and Daily Breakdown table.
- **Narrative:**
  > "Finally, let's inspect the Accuracy Analysis view.
  >
  > Notice the Lead-Time Degradation curve:
  > - In the **Intraday (1–4h)** window, MAE drops to under **800 MW**.
  > - In the **Day-Ahead Auction (12–24h)** window, MAE averages **2,100 MW**.
  > - Beyond 24 hours, error rises past **3,200 MW**.
  >
  > This quantifies the exact risk premium needed when hedging positions multi-day versus day-ahead.
  >
  > To ensure commercial integrity: this platform does not claim to optimize thermal dispatch or calculate artificial monetary savings, because no wholesale price curves or consumer demand data are present in the Elexon scope. It focuses with 100% mathematical fidelity on wind volumetric forecast risk."

---

## Part 2: Technical Walkthrough & Code Review (4:30 – 5:00 minutes)

**Target Audience:** Technical Lead & Engineering Architecture Reviewer  
**Speaker Role:** Senior Full-Stack Engineer

### Minute 5:00 – 6:15 | Architecture, Data Pipeline & Look-Ahead Prevention
- **Visual:** Project directory tree and `backend/app/analytics/selector.py`.
- **Narrative:**
  > "Welcome to the technical review. Let's look at the architectural design and implementation.
  >
  > We implemented a decoupled, modern architecture:
  > - Backend: Python 3.11 with FastAPI, Pydantic v2 schemas, and a modular service layer.
  > - Frontend: React 18 with TypeScript, Vite, Tailwind CSS v4, and Zustand state management, fully complying with the project's strict architecture rules.
  > - Upstream Data: 100% real historical Elexon BMRS data for January 2026. We ingested 1,489 FUELHH WIND actual records and 19,272 WINDFOR forecast records.
  >
  > Here in `selector.py`, you can see our look-ahead bias prevention logic. For target delivery timestamp $t$ and cutoff $T$, we filter records strictly on `publishTime <= cutoff_time` and select the maximum publication timestamp. If no forecast was published before the cutoff, the function returns `None`—it never backfills with future data or defaults to zero."

### Minute 6:15 – 7:15 | Analytics Engine & Test Verification
- **Visual:** VS Code terminal showing `pytest backend/tests` running with all 15 tests passing.
- **Narrative:**
  > "Let's run our test suite. As you can see, all 15 unit and integration tests pass in 5 seconds.
  >
  > Let's look at what's covered:
  > - `test_prevent_look_ahead_bias`: proves that any forecast vintage published after cutoff is strictly excluded.
  > - `test_hand_calculated_metrics`: verifies hand-computed mathematical fixtures for MAE, RMSE, and bias.
  > - `test_zero_actual_generation_safety`: confirms that periods of zero actual wind generation do not cause zero-division errors.
  > - Complete endpoint contract testing for `/api/health`, `/api/metadata`, `/api/forecasts`, `/api/vintages`, and `/api/analytics`."

### Minute 7:15 – 8:15 | Frontend Architecture: Zustand, Hooks & Types
- **Visual:** Open `frontend/src/module/procurement.store.ts` and `frontend/src/module/procurement.ts`.
- **Narrative:**
  > "In the frontend, we adhered strictly to `RULES_OF_INTEGRATION.md`:
  > - All shared state is managed in a single Zustand store (`procurement.store.ts`).
  > - All business logic, queries, and state synchronization live in custom hooks (`procurement.ts`).
  > - All network communication is routed through `apiHandler.ts` with explicit query building via `getQuery`.
  > - All endpoints are defined in a central `ENDPOINT.ts`.
  > - Strict TypeScript types are centralized in `types/index.ts` with zero use of `any`.
  >
  > Let's run the frontend test suite with Vitest: 7 tests pass in 6 seconds, and `npm run build` completes with zero TypeScript or bundler errors."

### Minute 8:15 – 9:15 | Containerization, Docker & Deployment
- **Visual:** Show `docker-compose.yml`, `backend/Dockerfile`, and `frontend/Dockerfile`.
- **Narrative:**
  > "For operations and DevOps:
  > - We provide multi-stage Dockerfiles for both frontend and backend.
  > - The backend uses Python slim with built-in healthchecks against `/api/health`.
  > - The frontend uses an Alpine Node build stage and serves optimized assets through an Nginx reverse proxy.
  > - The root `docker-compose.yml` orchestrates both services locally on ports 8000 and 3000 with dependency health waiting.
  > - For cloud deployment: the frontend is configured with `vercel.json` for Vercel, and the FastAPI backend is ready for Python hosts like Render or Railway using environment-driven configuration."

### Minute 9:15 – 10:00 | Summary & Submission Checklist
- **Visual:** Show `README.md` and submission checklist.
- **Narrative:**
  > "To conclude:
  > - Delivered within the 16-hour engineering budget.
  > - Zero synthetic or fabricated data.
  > - Completely verifiable code, reproducible from Docker Compose with one command.
  > - Transparent auditability for utility trading operations.
  >
  > Thank you for your time, and I look forward to your feedback."

---

## 3. Recording Checklist

- [ ] Resolution: 1080p (1920x1080) at 30/60 fps.
- [ ] Audio: Clear microphone input without background noise.
- [ ] Browser window: Full screen, zoom level 100% or 110% for legibility.
- [ ] Timing monitor: Keep stopwatch visible to ensure Part 1 is $\le 5$ min and total video is $\le 10$ min.
- [ ] Video visibility: Set to **Unlisted** on YouTube (not Private, not Public).
- [ ] Check link in incognito browser before submitting.
