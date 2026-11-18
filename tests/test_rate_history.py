"""Rate observations are append-only, source-stable, and never backdated."""
import importlib.util
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('rate_history',BASE/'scripts'/'update_rate_history.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

row={'country':'slovakia','role':'devops-engineer','grade':'mid','roleScope':'exact',
 'source':'Test Licensed Source','url':'https://example.com/salary','currency':'EUR','period':'year',
 'basis':'gross','low':40000,'high':60000,'median':50000,'publishedDate':'2026','sample':33}
h={'observations':[]}
new,_=mod.ingest('2026-11-18',{'records':[row]},{'salaryRecords':[],'providers':{}},h)
assert new==1 and len(h['observations'])==1
assert h['observations'][0]['observedAt']=='2026-11-18'
new,_=mod.ingest('2026-11-25',{'records':[row]},{'salaryRecords':[],'providers':{}},h)
assert new==0 and len(h['observations'])==1,'Unchanged static report must not create fake weekly history'
changed={**row,'median':52000,'low':42000,'high':62000,'publishedDate':'2027'}
new,_=mod.ingest('2027-01-15',{'records':[changed]},{'salaryRecords':[],'providers':{}},h)
assert new==1 and len(h['observations'])==2
# A newer report from a DIFFERENT source must never become the same series.
other={**row,'source':'Different Source','url':'https://example.com/other'}
new,_=mod.ingest('2027-02-01',{'records':[other]},{'salaryRecords':[],'providers':{}},h)
assert new==1 and len(h['observations'])==3
api={**row,'source':'SalaryByRole (automated API)','url':'https://salarybyrole.com/api/salary?role=x','basis':'unspecified',
 'fetchedAt':'2027-02-08T00:05:00Z'}
live={'providers':{'salarybyrole':{'status':'ok'}},'salaryRecords':[api]}
new,_=mod.ingest('2027-02-08',{'records':[]},live,h)
assert new==1
# Reused records aren't fresh observations.
new,_=mod.ingest('2027-02-15',{'records':[]},live,h)
assert new==0
print('PASS: no fabricated backdated rate history, no repeated stale study, no retained API observation, distinct source series')
