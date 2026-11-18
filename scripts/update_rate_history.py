#!/usr/bin/env python3
"""Append dated, attributable market observations (not fictional historical salaries).

Never stores user-entered rates. No websites are queried here: the existing
permitted-source collector runs first. Old survey references get a *single*
observation, then another point only when their actual published figures change.
API observations are stored only when newly fetched, never when retained from a
previous failed fetch. We record original units to avoid FX-driven false trends.
"""
from __future__ import annotations
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
DEST = DATA / 'rate_history.json'
VALID_GRADES = {'junior', 'mid', 'senior', 'all'}
VALID_BASES = {'gross', 'net', 'unspecified', 'ctc'}
VALID_PERIODS = {'year', 'month'}


def read(path, default):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except FileNotFoundError:
        return default


def series_key(row):
    # Never merge sources or pay bases that merely happen to share a country.
    parts = ('country', 'role', 'grade', 'roleScope', 'source', 'url', 'currency', 'period', 'basis')
    return '|'.join(str(row.get(p) or '') for p in parts)


def valid(row):
    if not isinstance(row, dict):
        return False
    if row.get('grade') not in VALID_GRADES or row.get('basis') not in VALID_BASES or row.get('period') not in VALID_PERIODS:
        return False
    if not all(isinstance(row.get(k), str) and row.get(k) for k in ('country', 'role', 'source', 'url', 'currency')):
        return False
    try:
        low, high = float(row['low']), float(row['high'])
        return 0 < low <= high <= 1e9
    except (ValueError, TypeError, KeyError):
        return False


def fingerprint(row):
    # Median and underlying reported period/source publication included.
    return [row.get(k) for k in ('low', 'median', 'high', 'publishedDate', 'sample')]


def ingest(date, curated, live, history):
    entries = history.setdefault('observations', [])
    latest = {}
    for old in entries:
        latest[old['seriesKey']] = old
    new = 0
    added_by_kind = {'curated': 0, 'api': 0}

    def add(row, kind, observed):
        nonlocal new
        if not valid(row):
            return
        key = series_key(row)
        last = latest.get(key)
        content = fingerprint(row)
        # Curated reports are not queried on a schedule: create only first or
        # a genuinely changed publication/figure; repeated checks aren't data.
        if kind == 'curated' and last and fingerprint(last) == content:
            return
        if kind == 'api' and last and last['observedAt'][:10] == observed[:10] and fingerprint(last) == content:
            return
        record = {k: row.get(k) for k in (
            'country', 'role', 'grade', 'roleScope', 'source', 'url', 'currency', 'period',
            'basis', 'low', 'median', 'high', 'publishedDate', 'sample')}
        record.update({'seriesKey': key, 'observedAt': observed, 'kind': kind})
        entries.append(record)
        latest[key] = record
        new += 1
        added_by_kind[kind] += 1

    # Curated surveys are not automatically refreshed and show as 'static'.
    for row in curated.get('records', []):
        add(row, 'curated', date)

    providers = live.get('providers') or {}
    successful = {name for name, info in providers.items() if info.get('status') in ('ok', 'partial', 'success')}
    # A retained record is NOT a newly observed salary; reject it by fetchedAt.
    for row in live.get('salaryRecords', []):
        if row.get('fetchedAt', '')[:10] != date[:10]:
            continue
        if 'salarybyrole' in str(row.get('source', '')).lower() and 'salarybyrole' not in successful:
            continue
        add(row, 'api', date)

    entries.sort(key=lambda r: (r['observedAt'], r['seriesKey']))
    history.update({'version': '1.0', 'lastCheckedAt': date,
                    'note': 'Observed-at dates are collection dates, NOT historical survey dates. Only like-for-like series should be compared. Curated reports are not refreshed automatically.'})
    return new, added_by_kind


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', default=datetime.now(timezone.utc).date().isoformat())
    args = parser.parse_args()
    curated = read(DATA / 'salary_references.json', {'records': []})
    live = read(DATA / 'automatic_market.json', {'salaryRecords': [], 'providers': {}})
    history = read(DEST, {'version': '1.0', 'observations': []})
    new, by_kind = ingest(args.date, curated, live, history)
    DEST.write_text(json.dumps(history, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Rate history: {len(history["observations"])} total observations; {new} new this run ({by_kind["curated"]} curated, {by_kind["api"]} fresh API).')
    if not by_kind['api']:
        print('::notice title=No fresh API time series::Static published benchmarks are preserved; live rate changes not yet observed.')


if __name__ == '__main__':
    main()
