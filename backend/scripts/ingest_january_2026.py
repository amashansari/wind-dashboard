import urllib.request
import json
import ssl
import os
import time
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {"User-Agent": "UK-Wind-Procurement-App/1.0", "Accept": "application/json"}

def fetch_url(url: str, max_retries: int = 3, timeout: int = 30) -> list:
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data
        except Exception as e:
            print(f"  [Attempt {attempt+1}/{max_retries}] Error fetching {url}: {e}")
            time.sleep(2 ** attempt)
    return []

def ingest_actuals():
    """Ingest FUELHH stream filtered to WIND for Jan 1 to Jan 31 2026."""
    out_file = os.path.join(DATA_DIR, "january_2026_actuals.json")
    print(f"Fetching FUELHH wind actuals...")
    all_records = []
    
    # Query in 3-day chunks to keep payloads responsive and manageable
    start_dt = datetime(2026, 1, 1, 0, 0, 0)
    end_dt = datetime(2026, 2, 1, 0, 0, 0)
    current = start_dt
    
    chunk_days = 3
    while current < end_dt:
        chunk_end = min(current + timedelta(days=chunk_days), end_dt)
        from_str = current.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        print(f"  FUELHH: {from_str} -> {to_str}...")
        chunk = fetch_url(url)
        wind_recs = [r for r in chunk if r.get("fuelType") == "WIND"]
        print(f"    Found {len(wind_recs)} wind records (out of {len(chunk)} total)")
        all_records.extend(wind_recs)
        current = chunk_end
        time.sleep(0.3)
        
    # Deduplicate deterministically by startTime
    dedup = {}
    for r in all_records:
        st = r.get("startTime")
        if st and st not in dedup:
            dedup[st] = r
            
    final_actuals = sorted(dedup.values(), key=lambda x: x["startTime"])
    print(f"Total unique WIND actual records ingested: {len(final_actuals)}")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_actuals, f, indent=2)
    print(f"Saved actuals to {out_file}")

def ingest_forecasts():
    """Ingest WINDFOR stream from Dec 30, 2025 to Feb 1, 2026 to ensure day-ahead coverage."""
    out_file = os.path.join(DATA_DIR, "january_2026_forecasts.json")
    print(f"\nFetching WINDFOR forecasts...")
    all_records = []
    
    start_dt = datetime(2025, 12, 30, 0, 0, 0)
    end_dt = datetime(2026, 2, 1, 0, 0, 0)
    current = start_dt
    
    chunk_days = 3
    while current < end_dt:
        chunk_end = min(current + timedelta(days=chunk_days), end_dt)
        from_str = current.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        print(f"  WINDFOR: {from_str} -> {to_str}...")
        chunk = fetch_url(url)
        print(f"    Found {len(chunk)} forecast records")
        all_records.extend(chunk)
        current = chunk_end
        time.sleep(0.3)
        
    # Deduplicate deterministically by (startTime, publishTime)
    dedup = {}
    for r in all_records:
        key = (r.get("startTime"), r.get("publishTime"))
        if key not in dedup and r.get("startTime") and r.get("publishTime"):
            dedup[key] = r
            
    final_forecasts = sorted(dedup.values(), key=lambda x: (x["startTime"], x["publishTime"]))
    print(f"Total unique WINDFOR forecast records ingested: {len(final_forecasts)}")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_forecasts, f, indent=2)
    print(f"Saved forecasts to {out_file}")

if __name__ == "__main__":
    start_time = time.time()
    ingest_actuals()
    ingest_forecasts()
    print(f"\nIngestion finished in {time.time() - start_time:.2f} seconds.")
