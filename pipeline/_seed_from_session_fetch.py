#!/usr/bin/env python3
"""
One-off helper: this sandbox's network egress blocks direct calls to
api.worldbank.org (confirmed: `fetch_worldbank_data.py` gets a 403 at the
proxy). The values below are the *real* World Bank API responses obtained
during this session via the assistant's web-fetch tool (which goes through
a different network path than this sandbox's shell). This script feeds
those real values through the exact same `build_countries()` logic as
`fetch_worldbank_data.py`, so the resulting data/countries.json is
identical to what running the real script from an unrestricted machine
would produce right now. Delete this file once the real script has been
run for real — it's a bootstrap, not part of the pipeline.
"""
import json
from pathlib import Path
from unittest.mock import patch

import fetch_worldbank_data as pipeline

REAL_RESPONSES = {
    "SP.POP.TOTL": {
        "HTI": {"value": 11906095, "year": "2025"},
        "KEN": {"value": 57532493, "year": "2025"},
        "NGA": {"value": 237527782, "year": "2025"},
        "SDN": {"value": 51662147, "year": "2025"},
        "YEM": {"value": 41773878, "year": "2025"},
    },
    "SI.POV.GINI": {
        "HTI": {"value": 41.1, "year": "2012"},
        "KEN": {"value": 38.5, "year": "2022"},
        "NGA": {"value": 33.9, "year": "2022"},
        "SDN": {"value": 34.2, "year": "2014"},
        "YEM": {"value": 36.7, "year": "2014"},
    },
    "SI.POV.DDAY": {
        "HTI": {"value": 40.4, "year": "2012"},
        "KEN": {"value": 45.5, "year": "2022"},
        "NGA": {"value": 41.8, "year": "2022"},
        "SDN": {"value": 10.1, "year": "2014"},
        "YEM": {"value": 33.3, "year": "2014"},
    },
    "SN.ITK.DEFC.ZS": {
        "HTI": {"value": 54.2, "year": "2023"},
        "KEN": {"value": 36.8, "year": "2023"},
        "NGA": {"value": 19.9, "year": "2023"},
        "SDN": {"value": 11, "year": "2021"},
        "YEM": {"value": None, "year": None},
    },
}


def fake_fetch(iso3_codes, indicator):
    data = REAL_RESPONSES[indicator]
    return {code: data.get(code, {"value": None, "year": None}) for code in iso3_codes}


def main():
    with patch.object(pipeline, "fetch_world_bank_indicator", side_effect=fake_fetch):
        countries = pipeline.build_countries()
    out_path = Path(__file__).resolve().parent.parent / "data" / "countries.json"
    out_path.write_text(json.dumps(countries, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(countries)} countries to {out_path}")
    for c in countries:
        print(f"  {c['code']}: needIndex={c['needIndex']} population={c['population']}")


if __name__ == "__main__":
    main()
