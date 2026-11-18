#!/usr/bin/env python3
"""Refresh public Georgian vacancy evidence for HireOrGrow.

Reads the crawler-friendly findjobs.ge JSON pages (never requests private/employee data).
Runs on GitHub Actions; DOES NOT update Armenia or Slovakia survey figures.
Safe to publish: only title, pay, company, URL, date, grade and city.
"""
import argparse
import json
import logging
import re
import statistics
import time
import urllib.error
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

DOMAIN='https://findjobs.ge'
PAGES=DOMAIN+'/crawl/vacancies/en/{page}.json'
ROBOTS=DOMAIN+'/robots.txt'
AGENT='HireOrGrowResearchBot/0.8 (+https://github.com/SiTa-82/HireOrGrow)'
OUT=Path(__file__).resolve().parents[1]/'data'/'georgia_live.json'
MAX_PAGES=60
ROLE_PATTERNS={
 'devops-engineer':re.compile(r'\bdev[\s-]?ops\b',re.I),
 'software-engineer':re.compile(r'\bsoftware\s+(?:engineer|developer)\b',re.I),
 'cloud-architect':re.compile(r'\bcloud\s+architect\b',re.I),
 'data-scientist':re.compile(r'\bdata\s+scientist\b',re.I),
 'site-reliability-engineer':re.compile(r'\bsite\s+reliability\s+engineer\b|\bsre\b',re.I),
}
EXCLUDED_PERIOD=re.compile(r'\b(?:per|/|each)\s*(?:hour|hr|day|shift|week|year|job)\b|\b(?:hourly|daily|weekly|annually|per project|from)\b',re.I)
EXPECTED_CITIES={'tbilisi','batumi','kutaisi','rustavi','other','zugdidi','poti','marneuli','telavi','gori','akhaltsikhe'}

def now_utc():return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')

def role_name(title):
 for slug,rx in ROLE_PATTERNS.items():
  if rx.search(title):return slug
 return None

def grade_name(title):
 if re.search(r'\b(?:senior|sr\.?|principal|staff|lead)\b',title,re.I):return 'senior'
 if re.search(r'\b(?:junior|jr\.?|intern|trainee)\b',title,re.I):return 'junior'
 if re.search(r'\b(?:middle|mid[\s-]?level|mid)\b',title,re.I):return 'mid'
 return 'unspecified'

def salary_job(job):
 if not isinstance(job,dict):return None
 title=str(job.get('title') or '').strip()[:200]
 slug=role_name(title)
 if not slug:return None
 if str(job.get('currency') or '').upper()!='GEL':return None
 # A regional job board may include global remote jobs. Exclude these from local statistics.
 city_key=str(job.get('cityKey') or '').lower()
 if city_key not in EXPECTED_CITIES:return None
 # No guessed conversions from shift/hour/year / ambiguous 'from' ads.
 pay=str(job.get('pay') or '')
 if EXCLUDED_PERIOD.search(pay):return None
 try:
  lo=float(job.get('salaryMin')); hi=float(job.get('salaryMax') if job.get('salaryMax') is not None else lo)
 except (ValueError,TypeError):return None
 if not(400<=lo<=hi<=70000):return None
 # If max is blank, only trust an unambiguous single-number salary expression.
 if job.get('salaryMax') is None and not re.fullmatch(r'\s*[₾GELgel\s]*\d[\d,\.\s]*\s*',pay):return None
 url=str(job.get('url') or '')
 if not url.startswith('https://findjobs.ge/'):return None
 return {'title':title,'company':str(job.get('company') or 'Not specified')[:120],
         'url':url,'city':str(job.get('city') or 'Georgia')[:80],
         'grade':grade_name(title),'min':round(lo),'max':round(hi),
         'postedAt':str(job.get('postedAt') or '')[:10]}

def compute(pages):
 seen=set();roles={key:[] for key in ROLE_PATTERNS};total=0
 for page in pages:
  if not isinstance(page,dict) or not isinstance(page.get('jobs'),list):raise ValueError('Unexpected source JSON schema: missing jobs[]')
  for job in page['jobs']:
   total+=1
   if not isinstance(job,dict):continue
   ref=str(job.get('ref') or job.get('url') or '')
   if not ref or ref in seen:continue
   seen.add(ref)
   item=salary_job(job)
   if item:
    slug=role_name(item['title'])
    roles[slug].append(item)
 out={}
 for slug,jobs in roles.items():
  midpoints=sorted((x['min']+x['max'])/2 for x in jobs)
  if not jobs:continue
  # Only calculate a coarse ALL-GRADE median if >= 8 salary-posted postings.
  valid=len(midpoints)>=8
  out[slug]={'sampleCount':len(jobs),'sampleDefinition':'Local live job ads with stated monthly GEL pay; all seniority levels',
   'verifiedMedian':round(statistics.median(midpoints)) if valid else None,
   'verifiedMedianCount':len(midpoints) if valid else 0,
   'vacancies':sorted(jobs,key=lambda x:x['postedAt'],reverse=True)[:50]}
 return {'version':'0.8','provider':'findjobs.ge','sourceUrl':DOMAIN+'/crawl/en/',
  'generatedAt':now_utc(),'status':'ok','totalListingsScanned':total,
  'note':'Open vacancies only; source salary basis gross/net unknown; no grade-specific market median.',
  'roles':out}

def read_source_json(url):
 request=urllib.request.Request(url,headers={'User-Agent':AGENT,'Accept':'application/json'})
 with urllib.request.urlopen(request,timeout=25) as response:
  if response.status!=200:raise RuntimeError('Non-200 response')
  raw=response.read(2_500_001)
  if len(raw)>2_500_000:raise ValueError('Page JSON too large')
  return json.loads(raw)

def remote_pages():
 robots=urllib.robotparser.RobotFileParser(ROBOTS)
 robots.read()
 if not robots.can_fetch(AGENT,PAGES.format(page=1)):
  raise PermissionError('robots.txt does not grant this crawler access; collection skipped')
 first=read_source_json(PAGES.format(page=1))
 pages=int(first.get('pages') or 0)
 if not 1<=pages<=MAX_PAGES:raise ValueError(f'Unexpected page count: {pages}')
 yield first
 for p in range(2,pages+1):
  url=PAGES.format(page=p)
  if not robots.can_fetch(AGENT,url):raise PermissionError('robots.txt disallows '+url)
  time.sleep(0.3)  # Source refreshes hourly; this workflow runs at most once a weekday.
  yield read_source_json(url)

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--fixture',help='Optional array of page JSON objects; for automated tests only')
 parser.add_argument('--output',type=Path,default=OUT)
 opts=parser.parse_args()
 try:
  if opts.fixture:
   pages=json.loads(Path(opts.fixture).read_text('utf8'))
  else:
   pages=list(remote_pages())
  result=compute(pages)
 except Exception as exc:
  # Fail closed: no made-up live figures. Public salary references remain usable.
  result={'version':'0.8','provider':'findjobs.ge','sourceUrl':DOMAIN+'/crawl/en/',
          'generatedAt':None,'lastAttemptAt':now_utc(),'status':'blocked' if isinstance(exc,PermissionError) else 'unavailable',
          'note':'Scheduled collection failed; no live vacancy median is displayed.',
          'errorType':type(exc).__name__, 'roles':{}}
  logging.error('Collection failed: %s',exc)
  if isinstance(exc,PermissionError):print('::warning title=Source access denied::Respecting robots.txt; no Georgia vacancy data collected.')
 opts.output.parent.mkdir(parents=True,exist_ok=True)
 opts.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
 print('Georgia snapshot:',result['status'],'roles:',','.join(result['roles']))
 if result['status']!='ok' and opts.fixture:return 1
 return 0

if __name__=='__main__':raise SystemExit(main())
