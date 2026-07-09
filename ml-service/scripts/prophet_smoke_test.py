#!/usr/bin/env python
"""
Prophet Model Smoke Test
Minimal test to verify Prophet can import, initialize, fit, and forecast.
Exit codes:
  0 = success
  1 = import error
  2 = model initialization error
  3 = fitting error
  4 = forecast error
"""

import sys
import json
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

def test_prophet_import():
    """Test if Prophet can be imported."""
    try:
        from prophet import Prophet
        print("[✓] Prophet import successful")
        return Prophet
    except ImportError as e:
        print(f"[✗] Prophet import failed: {e}")
        sys.exit(1)

def test_prophet_initialization(Prophet):
    """Test if Prophet can be initialized."""
    try:
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
        )
        print("[✓] Prophet initialization successful")
        return model
    except Exception as e:
        print(f"[✗] Prophet initialization failed: {e}")
        sys.exit(2)

def test_prophet_fit(Prophet):
    """Test if Prophet can fit on minimal data."""
    import pandas as pd
    
    try:
        # Create minimal 10-row dataset
        df = pd.DataFrame({
            "ds": pd.date_range(end="2026-04-20", periods=10, freq="D"),
            "y": [20, 25, 23, 27, 24, 26, 25, 28, 26, 29],
        })
        
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
        )
        
        with open("/dev/null" if sys.platform != "win32" else "NUL", "w") as f:
            # Suppress Prophet's verbose output
            model.fit(df)
        
        print(f"[✓] Prophet fit successful on {len(df)} rows")
        return model, df
    except Exception as e:
        print(f"[✗] Prophet fit failed: {e}")
        sys.exit(3)

def test_prophet_forecast(model, df):
    """Test if Prophet can generate forecasts."""
    import pandas as pd
    
    try:
        horizon_days = 7
        future = model.make_future_dataframe(periods=horizon_days, freq="D")
        forecast = model.predict(future)
        
        future_slice = forecast.tail(horizon_days)
        projected_units = float(future_slice["yhat"].clip(lower=0).sum())
        
        print(f"[✓] Prophet forecast successful: {projected_units:.1f} units for {horizon_days} days")
        return projected_units
    except Exception as e:
        print(f"[✗] Prophet forecast failed: {e}")
        sys.exit(4)

def main():
    """Run all Prophet smoke tests."""
    print("=== Prophet Smoke Test ===\n")
    
    Prophet = test_prophet_import()
    model = test_prophet_initialization(Prophet)
    model, df = test_prophet_fit(Prophet)
    projected_units = test_prophet_forecast(model, df)
    
    print("\n[SUCCESS] All Prophet smoke tests passed!")
    print(json.dumps({
        "status": "success",
        "test_rows": len(df),
        "forecast_horizon": 7,
        "projected_units": projected_units,
    }, indent=2))
    sys.exit(0)

if __name__ == "__main__":
    main()
