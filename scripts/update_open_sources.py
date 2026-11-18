#!/usr/bin/env python3
"""Refresh optional, licensed/open salary evidence (no internal rates, no scraping).

Sources:
- SalaryByRole free salary API: source-supplied bands for supported countries.
- YubHub public jobs API: individual employer-posted salary offers only.

Fails closed: if API fails, publish a clear source status, never a made-up wage.
No user information, secret or employee records are included.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
OUTPUT = BASE / 'data' / 'automatic_market.json'
NOW = lambda: datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
COUNTRIES = {'armenia':'AM','georgia':'GE','kazakhstan':'KZ','portugal':'PT',
             'finland':'FI','netherlands':'NL','slovakia':'SK','united-states':'US','india':'IN'}
# SalaryByRole published list includes the 3 markets below; other markets are not presumed supported.
SALARYBYROLE_COUNTRIES = ('netherlands','united-states','india')
# Query only genuinely matching titles. Never map unrelated roles to 'Software Engineer'.
SALARYBYROLE_ROLES = (
 'software-engineer','devops-engineer','data-scientist','data-analyst',
 'data-engineer','business-analyst','machine-learning-engineer','cloud-architect',
 'qa-engineer','python-developer','java-developer','frontend-developer',
 'backend-engineer','solution-architect','site-reliability-engineer')
# A bounded subset of roles for vacancy evidence, avoiding spam/API overload.
JOBS_ROLES = {
 'devops-engineer':r'\bdev[ -]?ops\b',
 'backend-engineer':r'\bback[ -]?end\b',
 'data-engineer':r'\bdata engineer\b',
 'data-scientist':r'\bdata scientist\b',
 'qa-automation-engineer':r'\b(?:qa|test) automation\b|\bsdet\b',
 'python-developer':r'\bpython (?:developer|engineer)\b',
 'business-analyst':r'\bbusiness analyst\b',
 'cloud-engineer':r'\bcloud engineer\b',
}
AGENT = 'HireOrGrowPublicResearch/0.9.3 (+https://github.com/SiTa-82/HireOrGrow)'


def get_json(url, *, timeout=12):
    req = urllib.request.Request(url, headers={'User-Agent':AGENT,'Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=timeout) as response:
        if response.status != 200:
            raise ValueError(f'HTTP {response.status}')
        raw=response.read(1_500_001)
    if len(raw)>1_500_000:raise ValueError('Response too large')
    return json.loads(raw)


def is_valid_currency(s):
    return isinstance(s,str) and bool(re.fullmatch(r'[A-Z]{3}',s))


def clean_number(n):
    if isinstance(n,bool):return None
    try:
        v=float(n)
        if 1<=v<=50_000_000 and v< float('inf'):return round(v,2)
    except (TypeError,ValueError,OverflowError):pass
    return None


def salarybyrole_record(payload, expected_role, expected_country, fetched):
    """Reject mismatched countries/roles; treat pay basis as UNKNOWN.

    Docs: /api/salary?role=...&country=... -> {role,country,salaries:[...]}
    """
    if not isinstance(payload,dict):return []
    role=payload.get('role') or {}; country=payload.get('country') or {}
    if not isinstance(role,dict) or not isinstance(country,dict):return []
    if role.get('slug')!=expected_role or country.get('slug')!=expected_country:return []
    data=payload.get('salaries')
    if not isinstance(data,list):return []
    result=[]
    for row in data:
        if not isinstance(row,dict):continue
        grade=row.get('experience_level')
        if grade not in ('junior','mid','senior'):continue
        low=clean_number(row.get('min')); high=clean_number(row.get('max'));med=clean_number(row.get('median'))
        curr=str(row.get('currency') or '').upper()
        if not is_valid_currency(curr) or low is None or high is None or low>high:continue
        if med is not None and not(low<=med<=high):continue
        year=row.get('year')
        if not isinstance(year,int) or not(2020<=year<=2100):continue
        result.append({
            'country':expected_country,'role':expected_role,'grade':grade,
            'roleScope':'exact','source':'SalaryByRole (automated API)',
            'url':'https://salarybyrole.com/api/salary?'+urllib.parse.urlencode({'role':expected_role,'country':expected_country}),
            'type':'aggregated_api_estimate', 'currency':curr, 'period':'year',
            'basis':'unspecified','low':low,'median':med,'high':high,
            'rangeLabel':'Source-reported annual estimate; not an employer quote',
            'sample':None,'publishedDate':str(year), 'checkedDate':fetched[:10],
            'fetchedAt':fetched,'dataYear':year,
            'note':'Automated provider estimate. Underlying sample and NET/GROSS basis are not specified by the API. Not a local job offer or full employer cost.',
            'confidence':'provider_estimate','license':'CC BY 4.0 (SalaryByRole)'
        })
    return result


def read_yubhub_jobs(payload):
    """Support documented list-like and API-envelope shapes; fail closed otherwise."""
    if isinstance(payload,list):return payload
    if isinstance(payload,dict):
        for key in ('jobs','results','items'):
            if isinstance(payload.get(key),list):return payload[key]
        inside=payload.get('data')
        if isinstance(inside,list):return inside
        if isinstance(inside,dict):
            for key in ('jobs','results','items'):
                if isinstance(inside.get(key),list):return inside[key]
    raise ValueError('Unrecognized YubHub response schema')


def _country_code(job):
    values=[job.get('countryCode'),job.get('country_code'),job.get('country')]
    loc=job.get('location')
    if isinstance(loc,dict):values += [loc.get('countryCode'),loc.get('country_code'),loc.get('country')]
    for v in values:
        if isinstance(v,dict):v=v.get('code') or v.get('iso2')
        if isinstance(v,str) and len(v.strip())==2:return v.strip().upper()
    return None


def _job_salary(job):
    """Keep employer-disclosed text when API has no numeric salary fields.

    YubHub's documented public /search actually exposes salary_range as a
    human-readable string (e.g. GBP 55K–58K). Do NOT interpret it as net,
    gross, or annual unless period is explicit in that string.
    """
    raw=job.get('salary_range')
    if isinstance(raw,str):
        text=' '.join(raw.split())[:180]
        if not re.search(r'\d',text) or not re.search(r'(?:[$€£₹₾₸֏]|\b(?:USD|EUR|GBP|INR|GEL|CAD|PLN|KZT|AMD)\b)',text,re.I):
            return None
        # Rejection: mixed compensations, commission or daily/hourly rates.
        if re.search(r'\b(?:equity only|commission only|per hour|/hour|hourly|per day|daily|/day)\b',text,re.I):
            return None
        period='year' if re.search(r'\b(?:per annum|per year|annual|yearly)\b|/yr\b',text,re.I) else 'month' if re.search(r'\b(?:per month|monthly)\b|/mo\b',text,re.I) else 'unspecified'
        return {'salaryText':text,'period':period}
    sal=job.get('salary')
    if not isinstance(sal,dict):return None
    lo=clean_number(next((sal[k] for k in ('min','minimum','minSalary') if k in sal),None))
    hi=clean_number(next((sal[k] for k in ('max','maximum','maxSalary') if k in sal),None))
    cur=sal.get('currency');period=sal.get('period')
    if lo is None or hi is None or lo>hi or not is_valid_currency(cur):return None
    if period not in ('year','month'):return None
    return {'salaryText':f'{lo:g}–{hi:g} {cur} per {period}','period':period}


def job_record(job,role,country,fetched):
    if not isinstance(job,dict):return None
    code=_country_code(job)
    if code and code!=COUNTRIES[country]:return None
    title=str(job.get('title') or '')[:160]
    if not re.search(JOBS_ROLES[role],title,re.I):return None
    salary=_job_salary(job)
    if not salary:return None
    url=job.get('source_url') or job.get('applyUrl') or job.get('apply_url') or job.get('url') or job.get('link')
    if not isinstance(url,str) or not url.startswith('https://'):return None
    loc=job.get('location')
    if isinstance(loc,dict): loc_text=str(loc.get('city') or loc.get('name') or country)
    else:loc_text=str(loc or country)
    # Dates of indexing are not necessarily dates when a vacancy was posted.
    pub=job.get('datePosted') or job.get('postedAt')
    pub=str(pub)[:10] if pub else None
    observed=None
    enriched=job.get('enriched_at')
    if isinstance(enriched,(int,float)) and enriched>10**12:
        try:observed=datetime.fromtimestamp(enriched/1000,timezone.utc).date().isoformat()
        except (ValueError,OverflowError,OSError):pass
    if not observed:observed=str(job.get('firstSeen') or job.get('first_seen') or fetched)[:10]
    try:
        age=(datetime.fromisoformat(fetched[:10]).date()-datetime.fromisoformat(observed).date()).days
    except ValueError:return None
    if age < -2 or age>60:return None
    g=str(job.get('experience_level') or '').lower()
    if g in ('entry','junior','intern'): grade='junior'
    elif g in ('mid','middle'): grade='mid'
    elif g in ('senior','staff','lead','principal'): grade='senior'
    else: grade='junior' if re.search(r'\b(?:junior|jr|intern)\b',title,re.I) else 'senior' if re.search(r'\b(?:senior|sr|lead|principal|staff)\b',title,re.I) else 'mid' if re.search(r'\b(?:mid|middle)\b',title,re.I) else 'unspecified'
    return {'country':country,'role':role,'grade':grade,'title':title,
        'company':str(job.get('company') or 'Not supplied')[:100],
        'location':loc_text[:120], 'url':url,
        'salaryText':salary['salaryText'],'period':salary['period'],
        'publishedDate':pub,'observedDate':observed,
        'fetchedAt':fetched,'source':'YubHub (employer job ad)',
        'countryMatch':'job_country' if code else 'provider_country_filter',
        'basis':'unspecified','license':'CC BY 4.0 (YubHub)'}

def _empty_status(fetched,extra=None):
    return {'attemptedAt':fetched,'status':'unavailable','records':0,'checked':0,'failed':0,**(extra or {})}


def collect_salarybyrole(fetched,fetcher=get_json, sleep=lambda n:time.sleep(n), roles=SALARYBYROLE_ROLES):
    out=[];errors=[];calls=0;success=0
    for country in SALARYBYROLE_COUNTRIES:
        for role in roles:
            url='https://salarybyrole.com/api/salary?'+urllib.parse.urlencode({'role':role,'country':country})
            calls+=1
            try:
                batch=salarybyrole_record(fetcher(url),role,country,fetched)
                # 404 / empty payload is normal for an unsupported role.
                out.extend(batch);success+=1
            except Exception as ex:
                if len(errors)<12:errors.append(f'{country}/{role}: {type(ex).__name__}')
            sleep(0.7)
    return out,{'attemptedAt':fetched,'status':'ok' if out else 'unavailable',
        'records':len(out),'checked':calls,'responses':success,'failed':calls-success,
        'coveredCountries':list(SALARYBYROLE_COUNTRIES), 'errors':errors,
        'license':'CC BY 4.0', 'terms':'https://salarybyrole.com/data/api'}


def collect_yubhub(fetched,fetcher=get_json,sleep=lambda n:time.sleep(n),countries=COUNTRIES,roles=JOBS_ROLES):
    out=[];errors=[];calls=0;success=0
    for country,code in countries.items():
        for role in roles:
            # Public read-only endpoint. Do NOT use the blocked findjobs.ge crawler.
            q=role.replace('-',' ')
            url='https://api.yubhub.co/search?'+urllib.parse.urlencode({'q':q,'country':code,'perPage':50,'page':1})
            calls+=1
            try:
                jobs=read_yubhub_jobs(fetcher(url))
                success+=1
                seen=set()
                for job in jobs:
                    r=job_record(job,role,country,fetched)
                    if r and r['url'] not in seen:
                        seen.add(r['url']);out.append(r)
                        if len(seen)>=12:break
            except Exception as ex:
                if len(errors)<12:errors.append(f'{country}/{role}: {type(ex).__name__}')
            # 30 req/min service limit. 2.1 sec > limit buffer, no uncontrolled retries.
            sleep(2.1)
    return out,{'attemptedAt':fetched,'status':'ok' if success else 'unavailable',
        'records':len(out),'checked':calls,'responses':success,'failed':calls-success,
        'errors':errors,'license':'CC BY 4.0', 'terms':'https://yubhub.co/api/'}


def retain_prior(fresh, old, fetched, max_age_days, key_fields):
    """Add prior records only when current source has no replacement for that key.

    Old records are labelled retained; their original fetchedAt is untouched.
    If no safe previous snapshot is available, nothing is invented.
    """
    import copy
    seen={tuple(row.get(k) for k in key_fields) for row in fresh}
    kept=0
    for row in old:
        if not isinstance(row,dict):continue
        if row.get('country') not in COUNTRIES:continue
        if row.get('role') not in set(SALARYBYROLE_ROLES)|set(JOBS_ROLES):continue
        date=row.get('fetchedAt')
        if not isinstance(date,str):continue
        try:age=(datetime.fromisoformat(fetched[:10]).date()-datetime.fromisoformat(date[:10]).date()).days
        except ValueError:continue
        if not 0<=age<=max_age_days:continue
        key=tuple(row.get(k) for k in key_fields)
        if key in seen:continue
        # Retain only previously validated sources, never import arbitrary data.
        if not (str(row.get('source','')).startswith('SalaryByRole') or str(row.get('source','')).startswith('YubHub')):continue
        if not isinstance(row.get('url'),str) or not row['url'].startswith('https://'):continue
        if str(row.get('source')).startswith('YubHub') and not isinstance(row.get('salaryText'),str):continue
        record=copy.deepcopy(row);record['cacheStatus']='retained_previous';fresh.append(record);seen.add(key);kept+=1
    return kept


def get_old_data(output,prior_url=None):
    # Existing published snapshot may have more recent data than the baseline
    # checked into GitHub; failures do not affect salary_references.json.
    if prior_url:
        try:
            from urllib.parse import urlsplit
            if urlsplit(prior_url).hostname!='sita-82.github.io':raise ValueError('Non-approved prior snapshot hostname')
            old=get_json(prior_url,timeout=8)
            if isinstance(old,dict) and isinstance(old.get('salaryRecords'),list) and isinstance(old.get('vacancyRecords'),list):return old
        except Exception as ex:
            print(f'[HireOrGrow] Previous public snapshot not accessible: {type(ex).__name__}',file=sys.stderr)
    try:
        old=json.loads(Path(output).read_text('utf8'))
        if isinstance(old,dict) and isinstance(old.get('salaryRecords'),list) and isinstance(old.get('vacancyRecords'),list):return old
    except Exception:pass
    return {'salaryRecords':[],'vacancyRecords':[]}


def run(mode='all',output=OUTPUT,fixtures=None,prior_url=None):
    fetched=NOW();salary=[];jobs=[]
    old=get_old_data(output,prior_url) if not fixtures else {'salaryRecords':[],'vacancyRecords':[]}
    p1=_empty_status(fetched,{'status':'not_run'});p2=_empty_status(fetched,{'status':'not_run'})
    if fixtures:
        source=json.loads(Path(fixtures).read_text('utf8'))
        def lookup(url):
            if url in source:return source[url]
            raise ValueError('Fixture has no response for URL')
        fx=lambda n:None
    else:lookup=get_json;fx=lambda n:time.sleep(n)
    if mode in ('all','salary'):
        salary,p1=collect_salarybyrole(fetched,lookup,fx,roles=('devops-engineer',) if fixtures else SALARYBYROLE_ROLES)
    if mode in ('all','jobs'):
        jobs,p2=collect_yubhub(fetched,lookup,fx,
            countries={'armenia':'AM'} if fixtures else COUNTRIES,
            roles={'devops-engineer':JOBS_ROLES['devops-engineer']} if fixtures else JOBS_ROLES)
    if not fixtures:
        kept_s=retain_prior(salary,old.get('salaryRecords',[]),fetched,120,('country','role','grade','source'))
        kept_j=retain_prior(jobs,old.get('vacancyRecords',[]),fetched,30,('country','role','url'))
        p1['retainedPrevious']=kept_s;p2['retainedPrevious']=kept_j
    countryCounts={country:{'salaryBands':sum(r['country']==country for r in salary),
                           'salaryPostedVacancies':sum(j['country']==country for j in jobs)} for country in COUNTRIES}
    data={'version':'0.9.3','generatedAt':fetched,
          'note':'Automatic provider estimates and employer-posted pay. Historic public benchmarks are retained in separate salary_references.json. Provider contact time is not source publication time; retained records keep their original fetchedAt.',
          'providers':{'salarybyrole':p1,'yubhub':p2},
          'countryCounts':countryCounts,'salaryRecords':salary,'vacancyRecords':jobs}
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f"[HireOrGrow] SalaryByRole: {p1['status']} / {len(salary)} bands; YubHub: {p2['status']} / {len(jobs)} salary-disclosing vacancies")
    return data


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--mode',choices=['all','salary','jobs'],default='all')
    p.add_argument('--output',type=Path,default=OUTPUT)
    p.add_argument('--fixtures',type=Path)
    p.add_argument('--prior-url',help='Previously published HireOrGrow auto snapshot for retaining valid records')
    a=p.parse_args()
    run(a.mode,a.output,a.fixtures,a.prior_url)

if __name__=='__main__':main()
