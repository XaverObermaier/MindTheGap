#!/usr/bin/env python3
"""
Mind the Gap — data pipeline
=============================

Regenerates `data/countries.json` from a mix of:

1. LIVE data — pulled automatically, every run, from the World Bank Open
   Data API (no API key required): total population, the Gini index, the
   poverty headcount ratio at $3.00/day (2021 PPP), and the prevalence of
   undernourishment. See `INDICATORS` below for the exact indicator codes.

2. CURATED data — content that no free, machine-readable API currently
   provides for these countries, so it is entered here by hand with an
   explicit citation and last-checked date:
     - `CRISIS_ESTIMATES`: the number of people directly affected by the
       *current* crisis described on the site (displaced, or facing
       IPC Crisis-level-or-worse food insecurity, depending on what the
       best available report for that country actually measures).
         - `EXTERNAL_RECOGNITION`: independently checked recognition by the
             Norwegian Refugee Council's neglected displacement-crises list.
     - `MANUAL_STATS`: country-specific figures from a national statistics
       office (here: Nigeria's NBS 2022 National MPI report), included at
       the user's request.
     - `PROFILES`: the descriptive, editorial content (region, summary,
       category tags, image path) that isn't the kind of thing you'd want
       an API to auto-write anyway.

Why not fetch the crisis numbers automatically too? We tried. ReliefWeb's
and HDX's *API* endpoints (api.reliefweb.int, data.humdata.org's API)
returned HTTP 403 to every automated request made while building this
pipeline, even though their regular web pages loaded fine — they appear to
block non-browser clients at the edge. Re-test them if you're running this
somewhere else; the fetch functions are stubbed out below (see
`try_fetch_reliefweb`) so you can wire them back in if they work for you.

WHY THIS MATTERS FOR "MIND THE GAP": the World Bank's own poverty/Gini
numbers for Sudan and Yemen are from 2014 — the last time normal household
surveys were possible before war made data collection nearly impossible.
Using ONLY that stale indicator to color the map would show Sudan, the
world's largest displacement crisis, as *low* need. That gap between
"what official statistics can currently measure" and "what is actually
happening" is not a bug to hide — it's part of the story this project is
about. So `needIndex` (what colors the map) is driven by the dated,
cited, human-verified crisis figures in `CRISIS_ESTIMATES`, not by the
lagging World Bank indicators. The World Bank indicators are still fetched
live and shown on each country page as separate "structural indicators" —
on purpose, so the contrast is visible to the user instead of averaged away.

Usage:
    python3 fetch_worldbank_data.py
    python3 fetch_worldbank_data.py --out ../data/countries.json

Requires: `requests` (pip install requests)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

WORLD_BANK_BASE = "https://api.worldbank.org/v2/country/{code}/indicator/{indicator}"

# World Bank indicator codes used by this pipeline.
INDICATORS = {
    "population": "SP.POP.TOTL",  # Population, total
    "giniIndex": "SI.POV.GINI",  # Gini index
    "povertyRate3": "SI.POV.DDAY",  # Poverty headcount ratio at $3.00/day (2021 PPP), % of population
    "undernourishment": "SN.ITK.DEFC.ZS",  # Prevalence of undernourishment, % of population
}

# --------------------------------------------------------------------------
# CURATED INPUT — edit these by hand when you refresh the pipeline.
# Every entry needs a citation; that's what makes this defensible data
# rather than a guess.
# --------------------------------------------------------------------------

PROFILES = {
    "SDN": {
        "name": "Sudan",
        "region": "East Africa",
        "categories": ["hunger", "war"],
        "summary": "Sudan is facing one of the world's largest displacement and food security crises, driven by ongoing conflict and a collapsing economy.",
        "image": "assets/images/sudan.jpg",
    },
    "KEN": {
        "name": "Kenya",
        "region": "East Africa",
        "categories": ["climate", "hunger"],
        "summary": "Recurring drought cycles in Kenya's arid and semi-arid regions continue to threaten food security and rural livelihoods.",
        "image": "assets/images/kenya.jpg",
    },
    "YEM": {
        # Display name matches the site's basemap GeoJSON ("Yemen"), not the
        # World Bank's official label ("Yemen, Rep.") — the API only needs
        # the ISO3 code, so this doesn't affect the data fetch.
        "name": "Yemen",
        "region": "Middle East",
        "categories": ["war", "hunger"],
        "summary": "Years of conflict in Yemen have driven one of the world's largest humanitarian emergencies, with millions facing acute food insecurity.",
        "image": "assets/images/yemen.jpg",
    },
    "HTI": {
        "name": "Haiti",
        "region": "Caribbean",
        "categories": ["disaster", "health", "war"],
        "summary": "Gang violence has pushed displacement in Haiti to record levels, compounding disease outbreaks and a fragile health system.",
        "image": "assets/images/haiti.jpg",
    },
    "NGA": {
        "name": "Nigeria",
        "region": "West Africa",
        "categories": ["hunger", "war"],
        "summary": "Conflict in Nigeria's northeast and shrinking humanitarian funding have driven hunger in the north to its worst levels in nearly a decade.",
        "image": "assets/images/nigeria.jpg",
    },
}

# Country-code override for the World Bank API, where it differs from the
# site's own ISO3 code (Yemen is listed as "Yemen, Rep." but the API still
# accepts the ISO3 code "YEM" as the path segment — kept here for clarity
# and in case that ever changes).
WORLD_BANK_CODE = {code: code for code in PROFILES}

# The number of people directly affected by the *current* crisis, as
# reported by the most recent, specific, citable source we could find and
# verify for each country. This is deliberately NOT one consistent metric
# across countries (see module docstring) — the "measured" field says what
# each number actually counts, so the inconsistency stays visible instead
# of being hidden behind a single average.
CRISIS_ESTIMATES = {
    "SDN": {
        "affected": 19_500_000,
        "measured": "people facing severe (IPC Crisis-level or worse) food insecurity",
        "asOf": "2026-09-14",
        "source": "UN News — \"UN agencies warn humanitarian system in Sudan 'could collapse'\"",
        "sourceUrl": "https://news.un.org/en/story/2026/09/1168331",
    },
    "YEM": {
        "affected": 17_000_000,
        "measured": "people in IPC Phase 3 (Crisis) or above, most recent whole-country estimate",
        "asOf": "2025-06-29",
        "source": "FAO / IPC country profile for Yemen",
        "sourceUrl": "https://www.fao.org/countryprofiles/news-archive/detail-news/en/c/1739797",
        "note": (
            "The most recent 2026 IPC analyses only cover government-controlled "
            "areas (~5 million people in Crisis+) because Houthi-controlled "
            "northern Yemen, home to the majority of the population, has not "
            "had a comparable joint analysis published. That access gap is "
            "itself an example of the kind of gap this project is about — "
            "see https://www.ipcinfo.org/ipc-country-analysis/details-map/en/c/1163308/"
        ),
    },
    "HTI": {
        "affected": 1_500_000,
        "measured": "people internally displaced by gang violence",
        "asOf": "2026-06-05",
        "source": "UN News — \"Haiti: Harrowing needs must be met with long-term engagement\" (citing IOM)",
        "sourceUrl": "https://news.un.org/en/story/2026/06/1167661",
    },
    "KEN": {
        "affected": 3_245_000,
        "measured": "people projected to need humanitarian food assistance (midpoint of FEWS NET's 3.0-3.49M range)",
        "asOf": "2026-06-30",
        "source": "FEWS NET — Kenya Food Security Outlook, June 2026",
        "sourceUrl": "https://fews.net/east-africa/kenya/food-security-outlook/june-2026",
    },
    "NGA": {
        "affected": 17_000_000,
        "measured": "people facing Crisis-or-worse hunger across 9 conflict-affected northern states",
        "asOf": "2026-07-02",
        "source": "World Food Programme — \"Conflict and shrinking humanitarian assistance drives northern Nigeria hunger crisis...\"",
        "sourceUrl": "https://www.wfp.org/news/conflict-and-shrinking-humanitarian-assistance-drives-northern-nigeria-hunger-crisis-levels",
    },
}

# Countries ranked in the Norwegian Refugee Council's 2025 neglected
# displacement-crises list. Missing countries are intentionally absent: an
# unranked country is unknown, not evidence that its crisis is not neglected.
EXTERNAL_RECOGNITION = {
    "SDN": {
        "source": "Norwegian Refugee Council",
        "title": "The World's Most Neglected Displacement Crises in 2025",
        "edition": "10th edition",
        "scope": "displacement crises",
        "rank": 1,
        "url": "https://www.nrc.no/feature/2026/the-worlds-most-neglected-displacement-crises-2025",
        "checkedAt": "2026-09-16",
    },
    "YEM": {
        "source": "Norwegian Refugee Council",
        "title": "The World's Most Neglected Displacement Crises in 2025",
        "edition": "10th edition",
        "scope": "displacement crises",
        "rank": 4,
        "url": "https://www.nrc.no/feature/2026/the-worlds-most-neglected-displacement-crises-2025",
        "checkedAt": "2026-09-16",
    },
    "NGA": {
        "source": "Norwegian Refugee Council",
        "title": "The World's Most Neglected Displacement Crises in 2025",
        "edition": "10th edition",
        "scope": "displacement crises",
        "rank": 9,
        "url": "https://www.nrc.no/feature/2026/the-worlds-most-neglected-displacement-crises-2025",
        "checkedAt": "2026-09-16",
    },
}

# Country-specific statistics published by a national statistics office
# rather than a global database. Added at the user's request for Nigeria's
# NBS. NBS does not currently expose these figures through a public,
# machine-readable API (its portals are report/PDF-oriented), so this is
# entered manually with a citation rather than fetched.
MANUAL_STATS = {
    "NGA": {
        "label": "Multidimensionally poor (National MPI)",
        "value": 63,
        "unit": "%",
        "peopleAffected": 133_000_000,
        "year": 2022,
        "source": "Nigeria National Bureau of Statistics — 2022 National Multidimensional Poverty Index",
        "sourceUrl": "https://www.nigerianstat.gov.ng/news/78",
    },
}

NEED_INDEX_BANDS = [
    (0.35, 5),
    (0.20, 4),
    (0.10, 3),
    (0.04, 2),
    (0.0, 1),
]


def need_index_from_share(affected: int, population: int) -> int:
    """Bucket "affected ÷ population" into the site's 1-5 needIndex scale."""
    if not population:
        return 1
    share = affected / population
    for threshold, index in NEED_INDEX_BANDS:
        if share >= threshold:
            return index
    return 1


def http_get_json(url: str, retries: int = 3, backoff: float = 1.5):
    last_error = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MindTheGap-pipeline/1.0"})
            with urllib.request.urlopen(req, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            time.sleep(backoff * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def fetch_world_bank_indicator(iso3_codes: list[str], indicator: str) -> dict[str, dict]:
    """Fetch one indicator for several countries in a single request.

    Returns {iso3: {"value": float|None, "year": str|None}} using the most
    recent non-empty value for each country (mrnev=1).
    """
    codes = ";".join(iso3_codes)
    url = (
        WORLD_BANK_BASE.format(code=codes, indicator=indicator)
        + "?format=json&per_page=100&mrnev=1"
    )
    payload = http_get_json(url)
    result = {code: {"value": None, "year": None} for code in iso3_codes}
    if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
        return result
    for row in payload[1]:
        code = row.get("countryiso3code")
        if code in result:
            result[code] = {"value": row.get("value"), "year": row.get("date")}
    return result


def try_fetch_reliefweb(appname: str = "mindthegap-pipeline", limit: int = 20):
    """Best-effort live fetch of recent ReliefWeb reports.

    Not currently used by `build_countries()` — kept here, disabled, for
    whoever picks this pipeline up next. As of this writing api.reliefweb.int
    returns HTTP 403 to every request made from this pipeline's environment
    (both GET and documented query shapes), which looks like edge/bot
    protection rather than a malformed request. If you can get a 200 back
    from this function, news.json can be regenerated the same way
    countries.json is here.
    """
    url = f"https://api.reliefweb.int/v1/reports?appname={appname}&limit={limit}"
    return http_get_json(url)


def build_countries() -> list[dict]:
    iso3_codes = list(PROFILES.keys())
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    indicator_data = {}
    for field, indicator_code in INDICATORS.items():
        print(f"Fetching {field} ({indicator_code}) for {', '.join(iso3_codes)} ...", file=sys.stderr)
        indicator_data[field] = fetch_world_bank_indicator(iso3_codes, indicator_code)

    countries = []
    for code, profile in PROFILES.items():
        population = indicator_data["population"][code]["value"]
        population_year = indicator_data["population"][code]["year"]

        crisis = CRISIS_ESTIMATES.get(code)
        # `None` here (not a fallback numeral like 1) is deliberate: it lets the
        # frontend distinguish "no cited crisis estimate exists" from "we checked
        # and this country is genuinely low-need" — see needLabel() in
        # js/utils/needColor.js and the "Insufficient data" state it renders.
        need_index = (
            need_index_from_share(crisis["affected"], population) if crisis and population else None
        )

        indicators = {
            "population": {
                "value": population,
                "year": population_year,
                "source": "World Bank Open Data (SP.POP.TOTL)",
                "sourceUrl": f"https://data.worldbank.org/indicator/SP.POP.TOTL?locations={code}",
            },
            "giniIndex": {
                "value": indicator_data["giniIndex"][code]["value"],
                "year": indicator_data["giniIndex"][code]["year"],
                "source": "World Bank Open Data (SI.POV.GINI)",
                "sourceUrl": f"https://data.worldbank.org/indicator/SI.POV.GINI?locations={code}",
            },
            "povertyRate3": {
                "value": indicator_data["povertyRate3"][code]["value"],
                "year": indicator_data["povertyRate3"][code]["year"],
                "label": "Poverty headcount ratio at $3.00/day (2021 PPP)",
                "source": "World Bank Open Data (SI.POV.DDAY)",
                "sourceUrl": f"https://data.worldbank.org/indicator/SI.POV.DDAY?locations={code}",
            },
            "undernourishment": {
                "value": indicator_data["undernourishment"][code]["value"],
                "year": indicator_data["undernourishment"][code]["year"],
                "label": "Prevalence of undernourishment",
                "source": "World Bank Open Data (SN.ITK.DEFC.ZS)",
                "sourceUrl": f"https://data.worldbank.org/indicator/SN.ITK.DEFC.ZS?locations={code}",
            },
        }
        if crisis:
            indicators["currentCrisis"] = {
                "affected": crisis["affected"],
                "measured": crisis["measured"],
                "asOf": crisis["asOf"],
                "source": crisis["source"],
                "sourceUrl": crisis["sourceUrl"],
                **({"note": crisis["note"]} if "note" in crisis else {}),
            }
        if code in MANUAL_STATS:
            indicators["nationalStat"] = MANUAL_STATS[code]

        country = {
                "code": code,
                "name": profile["name"],
                "region": profile["region"],
                "population": format_population(population),
                "needIndex": need_index,
                "categories": profile["categories"],
                "summary": profile["summary"],
                "image": profile["image"],
                "indicators": indicators,
                "dataFetchedAt": fetched_at,
        }
        if code in EXTERNAL_RECOGNITION:
            country["externalRecognition"] = dict(EXTERNAL_RECOGNITION[code])
        countries.append(country)

    return countries


def format_population(value: float | None) -> str:
    if not value:
        return "Unknown"
    millions = value / 1_000_000
    return f"{millions:.1f} million"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent.parent / "data" / "countries.json"),
        help="Path to write data/countries.json to (default: ../data/countries.json)",
    )
    args = parser.parse_args()

    countries = build_countries()
    out_path = Path(args.out)
    out_path.write_text(json.dumps(countries, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(countries)} countries to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
