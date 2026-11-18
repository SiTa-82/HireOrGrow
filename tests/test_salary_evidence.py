"""Check locally bundled public salary evidence; no remote API required."""
import json
from pathlib import Path

base=Path(__file__).resolve().parents[1]
records=json.loads((base/'data/salary_references.json').read_text(encoding='utf-8'))['records']
roles=set()
import re
roles.update(re.findall(r'"([a-z0-9-]+)": "[^"]+"', (base/'market.js').read_text(encoding='utf-8').split('const MARKET_ROLES = {',1)[1].split('};',1)[0]))
countries={'armenia','georgia','kazakhstan','portugal','finland','netherlands','slovakia','united-states','india'}
keys=set()
for item in records:
    assert item['role'] in roles, item
    assert item['country'] in countries, item
    assert item['grade'] in {'all','junior','mid','senior'}, item
    assert item['period'] in {'month','year'}, item
    assert item['basis'] in {'net','gross','unspecified','ctc'}, item
    assert item['roleScope'] in {'exact','family'}, item
    assert item['low']>0 and item['high']>=item['low'], item
    if item['median'] is not None: assert item['low']<=item['median']<=item['high'], item
    assert item['url'].startswith('https://'), item
    assert item['source'] and item['checkedDate'] and item['rangeLabel'], item
    key=(item['country'],item['role'],item['grade'],item['source'])
    assert key not in keys, key
    keys.add(key)
assert len(records)>=100, len(records)
assert set(x['country'] for x in records)==countries
assert len({x['role'] for x in records})>=25
assert len({(x['country'],x['role']) for x in records if x['grade']=='mid' and x['roleScope']=='exact'})>=50
print(f"PASS: {len(records)} sourced salary entries, {len({(x['country'],x['role']) for x in records})} role/market pairs across 9 markets")
