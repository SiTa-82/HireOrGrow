"""Offline tests using sample responses shaped like documented public APIs."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update_open_sources import (salarybyrole_record,read_yubhub_jobs,job_record,
                                 collect_yubhub,retain_prior,run,COUNTRIES)

stamp='2026-11-18T14:00:00Z'
salary_api={'source':'SalaryByRole','role':{'slug':'devops-engineer'},
    'country':{'slug':'netherlands'},'salaries':[
    {'experience_level':'mid','min':64000,'median':72000,'max':80000,'currency':'EUR','year':2026},
    {'experience_level':'senior','min':80000,'median':98000,'max':115000,'currency':'EUR','year':2026}]}
bands=salarybyrole_record(salary_api,'devops-engineer','netherlands',stamp)
assert len(bands)==2 and bands[0]['basis']=='unspecified' and bands[0]['median']==72000
assert not salarybyrole_record(salary_api,'devops-engineer','armenia',stamp), 'never re-label Netherlands as Armenia'
assert not salarybyrole_record(salary_api,'backend-engineer','netherlands',stamp), 'never re-label the job title'

# Actual API schema from YubHub /search: data.jobs, salary_range TEXT,
# experience_level, source_url, enriched_at milliseconds; no job country code.
job={'id':'job_example','title':'Senior DevOps Engineer','company':'Example Ltd',
     'location':'Tbilisi','salary_range':'₾8,000 - ₾10,000 per month',
     'experience_level':'senior','source_url':'https://example.org/careers/devops',
     'enriched_at':1795010400000}
response={'data':{'jobs':[job], 'filters':{'country':'GE'},'page':1}}
assert read_yubhub_jobs(response)[0]['title']==job['title']
parsed=job_record(job,'devops-engineer','georgia',stamp)
assert parsed is not None,job
assert parsed['salaryText']=='₾8,000 - ₾10,000 per month'
assert parsed['period']=='month' and parsed['basis']=='unspecified'
assert parsed['countryMatch']=='provider_country_filter'
assert parsed['grade']=='senior'
assert job_record(dict(job,salary_range='Competitive salary'),'devops-engineer','georgia',stamp) is None
assert job_record(dict(job,title='Sales Manager'),'devops-engineer','georgia',stamp) is None
assert job_record(dict(job,country='US'),'devops-engineer','georgia',stamp) is None

# One genuinely matched listing and a rejected listing do not generate a median.
q=[]
def fakefetch(url):q.append(url);return response
rows,status=collect_yubhub(stamp,fetcher=fakefetch,sleep=lambda s:None,
    countries={'georgia':'GE'},roles={'devops-engineer':r'\bdev[ -]?ops\b'})
assert len(rows)==1 and 'country=GE' in q[0] and status['records']==1

# Outage preserves original fetchedAt, and adds a clear retained indicator.
new=[]
old=[dict(bands[0])]
count=retain_prior(new,old,stamp,120,('country','role','grade','source'))
assert count==1 and new[0]['cacheStatus']=='retained_previous' and new[0]['fetchedAt']==stamp
with TemporaryDirectory() as t:
    old_file=Path(t)/'automatic_market.json'
    old_file.write_text(json.dumps({'salaryRecords':old,'vacancyRecords':[]}))
    before=json.loads(old_file.read_text())
    assert before['salaryRecords'][0]['median']==72000
print('PASS: provider response shapes, source-country validation, salary text, filters, outage preservation')
