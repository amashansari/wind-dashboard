from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException
from dateutil import parser

VALID_CUTOFF_PRESETS = {"day_ahead_12", "day_ahead_17", "same_day_06"}

def validate_date_range_and_cutoff(
    start_date_str: str,
    end_date_str: str,
    cutoff_preset: str,
    custom_cutoff_str: Optional[str] = None
) -> Tuple[datetime, datetime, Optional[datetime]]:
    """
    Validate query parameters for date range and cutoff preset.
    Raises HTTPException(400) on invalid inputs.
    """
    try:
        start_dt = parser.isoparse(start_date_str)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid startDate format '{start_date_str}'. Expected YYYY-MM-DD or ISO 8601 string: {e}"
        )

    try:
        end_dt = parser.isoparse(end_date_str)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid endDate format '{end_date_str}'. Expected YYYY-MM-DD or ISO 8601 string: {e}"
        )

    if start_dt.date() > end_dt.date():
        raise HTTPException(
            status_code=400,
            detail=f"startDate ({start_date_str}) cannot be after endDate ({end_date_str})."
        )

    if cutoff_preset not in VALID_CUTOFF_PRESETS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid cutoffPreset '{cutoff_preset}'. Must be one of: {sorted(list(VALID_CUTOFF_PRESETS))}."
        )

    custom_dt = None
    if custom_cutoff_str:
        try:
            custom_dt = parser.isoparse(custom_cutoff_str)
            if custom_dt.tzinfo is None:
                custom_dt = custom_dt.replace(tzinfo=timezone.utc)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid customCutoff timestamp '{custom_cutoff_str}': {e}"
            )

    return start_dt, end_dt, custom_dt
