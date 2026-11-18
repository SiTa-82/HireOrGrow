"""HireOrGrow 0.8 static-site smoke test. Public data is in repo; external FX response is mocked."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k): super().__init__(*a,directory=str(ROOT),**k)
 def log_message(self,*a): pass

def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
 Thread(target=server.serve_forever,daemon=True).start()
 base=f'http://127.0.0.1:{server.server_port}/'
 try:
  with sync_playwright() as p:
   path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None
   browser=p.chromium.launch(headless=True,executable_path=path,args=['--no-sandbox'] if path else [])
   page=browser.new_page(viewport={'width':1420,'height':1050})
   errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda q:requests.append(q.url))
   page.route('https://api.frankfurter.dev/**',lambda route:route.fulfill(content_type='application/json',body=json.dumps([
      {'date':'2026-11-17','base':'USD','quote':'EUR','rate':0.9},
      {'date':'2026-11-17','base':'USD','quote':'AMD','rate':385},
      {'date':'2026-11-17','base':'USD','quote':'GEL','rate':2.7}
   ]),headers={'Access-Control-Allow-Origin':'*'}))
   # Sandbox environments may block 127.0.0.1. Inline only test assets and
   # route the public JSON files; production still deploys external files.
   page.route('https://hireorgrow.example/data/salary_references.json',lambda route:route.fulfill(content_type='application/json',body=(ROOT/'data'/'salary_references.json').read_text('utf8')))
   page.route('https://hireorgrow.example/data/georgia_live.json',lambda route:route.fulfill(content_type='application/json',body=(ROOT/'data'/'georgia_live.json').read_text('utf8')))
   content=(ROOT/'index.html').read_text('utf8')
   content=content.replace('<link href="./styles.css" rel="stylesheet"/>','<style>'+ (ROOT/'styles.css').read_text('utf8') +'</style>')
   content=content.replace('<script src="./app.js"></script>','<script>'+(ROOT/'app.js').read_text('utf8')+'</script>')
   content=content.replace('<script src="./market.js"></script>','<script>'+(ROOT/'market.js').read_text('utf8')+'</script>')
   content=content.replace('http-equiv="Content-Security-Policy"','http-equiv="Test-Only-CSP"')
   content=content.replace('<head>','<head><base href="https://hireorgrow.example/">')
   page.set_content(content,wait_until='load')
   assert 'HireOrGrow 0.8.1' in page.title(),page.title()
   assert page.locator('#tab-market').get_attribute('aria-selected')=='true'
   assert page.locator('.benchmark-zone').count()==1 and page.locator('.calculators-zone').count()==1
   assert page.locator('#hire-external').inner_text()=='$20,000'
   page.locator('#tab-replace').click()
   assert '$53,000' in page.locator('#r-keep').inner_text()
   page.locator('#tab-talent').click()
   assert '$71,500' in page.locator('#t-p-total').inner_text()
   page.locator('#tab-market').click()
   page.wait_for_function("document.querySelector('#m-fetchstatus').textContent.includes('Public source snapshots:')",timeout=20000)
   assert page.locator('.m-country:checked').count()==3
   assert page.locator('.reference').count()==3
   assert page.locator('#m-compare-rows tr').count()==3
   page.locator('.country-source-group summary').first.click()
   text=page.locator('#m-compare-rows').inner_text()
   assert 'ITA Jobs' in text and 'Fairpay' in text and 'Platy.sk' in text,text[:2000]
   assert 'NET' in text and 'GROSS' in text
   assert 'Different level' in text
   assert 'Collection blocked' in page.locator('#m-georgia-results').inner_text()
   # Regression: when only Armenia is selected, no Georgian cards, vacancy panel,
   # or Georgia-specific source details must be visible or copied to reports.
   page.locator('.market-country-picker summary').click()
   page.locator('.m-country[value="georgia"]').uncheck()
   page.locator('.m-country[value="slovakia"]').uncheck()
   assert page.locator('.m-country:checked').count()==1
   assert page.locator('#m-compare-rows tr').count()==1
   assert 'Armenia' in page.locator('#m-compare-rows').inner_text()
   assert 'Georgia' not in page.locator('#m-compare-rows').inner_text()
   assert 'Georgia' not in page.locator('#m-results').inner_text()
   assert page.locator('#m-georgia-panel').is_hidden()
   assert 'Georgia' not in page.locator('#m-interpretation').inner_text()
   assert 'Georgia' not in page.locator('#m-fetchstatus').inner_text()
   assert 'Georgia job feed' not in page.evaluate('marketReport')
   # No selections should show neither evidence nor country-specific panels.
   page.locator('.m-country[value="armenia"]').uncheck()
   assert page.locator('#m-georgia-panel').is_hidden()
   assert page.locator('#m-compare-rows tr').count()==1  # empty-state row
   assert 'Select markets' in page.locator('#m-compare-rows').inner_text()
   page.locator('[data-preset="priority"]').click()
   assert page.locator('#m-georgia-panel').is_visible()
   count=len(requests)
   page.locator('#manual-rate-card summary').click()
   page.locator('#m-historical').fill('42000')
   assert len(requests)==count,'Manual rate unexpectedly initiated an HTTP request'
   assert not any('42000' in x for x in requests)
   assert not any('salarybyrole.com' in x for x in requests)
   page.locator('#m-home').select_option('slovakia')
   page.locator('#m-history-cur').select_option('EUR')
   assert 'Context only' in page.locator('#m-ceo').inner_text()
   page.locator('[data-preset="eu"]').click()
   assert page.locator('.m-country:checked').count()==4
   assert set(page.locator('.m-country:checked').evaluate_all('(xs)=>xs.map(x=>x.value)'))=={'portugal','finland','netherlands','slovakia'}
   assert not page.locator('.m-country[value="armenia"]').is_checked()
   page.locator('[data-preset="priority"]').click()
   assert page.locator('.m-country:checked').count()==3
   page.locator('[data-preset="global"]').click()
   assert page.locator('.m-country:checked').count()==9
   page.locator('[data-preset="india"]').click()
   assert page.locator('.m-country:checked').count()==1
   assert page.locator('.m-country[value="india"]').is_checked()
   page.locator('[data-preset="us"]').click()
   assert page.locator('.m-country[value="united-states"]').is_checked()
   page.locator('[data-preset="priority"]').click()
   # Simulate successful scheduled collection with an honest *small sample*.
   test_feed={'version':'0.8','provider':'findjobs.ge','sourceUrl':'https://findjobs.ge/crawl/en/',
    'status':'ok','generatedAt':'2026-11-18T08:00:00Z', 'roles':{
      'devops-engineer':{'sampleCount':2,'verifiedMedian':None,'verifiedMedianCount':0,
      'vacancies':[{'title':'DevOps Engineer','company':'Example','city':'Tbilisi','grade':'unspecified','min':5000,'max':6000,'postedAt':'2026-11-18',
       'url':'https://findjobs.ge/en/vacancy/EXAMPLE-devops'},
       {'title':'Senior DevOps Engineer','company':'Sample','city':'Tbilisi','grade':'senior','min':6000,'max':7500,'postedAt':'2026-11-18',
       'url':'https://findjobs.ge/en/vacancy/SAMPLE-devops'}]}}}
   page.unroute('https://hireorgrow.example/data/georgia_live.json')
   page.route('https://hireorgrow.example/data/georgia_live.json',lambda r:r.fulfill(content_type='application/json',body=json.dumps(test_feed)))
   page.locator('#m-refresh').click()
   page.wait_for_function("document.querySelector('#m-georgia-count').textContent.includes('2 salary-posted ads')",timeout=12000)
   assert 'Sample too small' in page.locator('#m-georgia-results').inner_text()
   assert 'Mid-level' in page.locator('#m-result-title').inner_text()
   assert 'No grade-exact job ads found' in page.locator('#m-georgia-results').inner_text()
   assert not errors,errors

   browser.close()
   print('PASS: market vs calculators, 9 markets, 4 EU markets, 3 source cards, source attribution, no rate leak, financial calculators and small-sample safeguards')
 finally:server.shutdown();server.server_close()
if __name__=='__main__':main()
