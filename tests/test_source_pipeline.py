"""Fully offline tests for Georgia source normalization (no actual salary claims)."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update_georgia import compute,salary_job,grade_name

def job(ref,title,mi,ma,city='tbilisi',pay='₾6000–8000'):
 return {'ref':ref,'title':title,'company':'Example Company','url':f'https://findjobs.ge/en/vacancy/{ref}-example',
   'city':'Tbilisi','cityKey':city,'currency':'GEL','salaryMin':mi,'salaryMax':ma,
   'pay':pay,'postedAt':'2026-11-18T00:00:00Z'}

items=[job('a','DevOps Engineer',6000,8000),job('b','Senior DevOps Engineer',9000,11000),
 job('c','Junior DevOps Engineer',1200,1600),job('d','Software Engineer',3000,5000),
 job('e','DevOps Engineer',50,60,pay='₾50–60 per hour'),
 job('f','DevOps Engineer',5000,7000,city='remote'),
 job('g','DevOps Engineer',None,None),job('h','SRE',6000,8000)]
result=compute([{'jobs':items,'pages':1}])
assert result['status']=='ok'
assert result['roles']['devops-engineer']['sampleCount']==3
assert result['roles']['devops-engineer']['verifiedMedian'] is None
assert result['roles']['site-reliability-engineer']['sampleCount']==1
assert result['roles']['devops-engineer']['vacancies'][1]['grade']=='senior'
assert salary_job(job('x','DevOps Engineer',50,80,pay='₾50–80 per day')) is None
assert grade_name('Mid-level DevOps Engineer')=='mid'
print('PASS: source normalization, deduplication, role/grade matching, pay period and small-sample safety')
