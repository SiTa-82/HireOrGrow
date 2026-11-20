"""Functional regression test for v0.9.11 financial assumptions and rate trends."""
import json
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args): pass

def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
 Thread(target=server.serve_forever,daemon=True).start()
 errors=[]
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   page=browser.new_page(viewport={'width':1440,'height':1040},device_scale_factor=1)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('https://api.frankfurter.dev/**',lambda route:route.fulfill(content_type='application/json',body=json.dumps([
      {'date':'2026-11-17','base':'USD','quote':'EUR','rate':0.9},
      {'date':'2026-11-17','base':'USD','quote':'AMD','rate':385},
      {'date':'2026-11-17','base':'USD','quote':'GEL','rate':2.7},
      {'date':'2026-11-17','base':'USD','quote':'INR','rate':84}]),headers={'Access-Control-Allow-Origin':'*'}))
   # Localhost is blocked in some sandboxes. Supply page assets inline and route
   # public site data to the checked-in JSON fixtures (FX is mocked above).
   page.route('https://hireorgrow.example/data/**',lambda route:route.fulfill(
       content_type='application/json',body=(ROOT/'data'/route.request.url.split('/data/')[1].split('?')[0]).read_text('utf8')))
   page.route('https://hireorgrow.example/data/automatic_market.json*',lambda route:route.fulfill(content_type='application/json',body=json.dumps({
      'version':'0.9.11','generatedAt':'2026-11-18T14:00:00Z',
      'providers':{'salarybyrole':{'status':'ok','records':3},'yubhub':{'status':'ok','records':1}},
      'salaryRecords':[{'country':'netherlands','role':'devops-engineer','grade':'mid','source':'SalaryByRole (automated API)',
       'url':'https://salarybyrole.com/api/salary?role=devops-engineer&country=netherlands','type':'aggregated_api_estimate',
       'currency':'EUR','period':'year','basis':'unspecified','low':64000,'median':72000,'high':80000,
       'rangeLabel':'Source estimate','sample':None,'publishedDate':'2026','checkedDate':'2026-11-18',
       'fetchedAt':'2026-11-18T14:00:00Z','confidence':'provider_estimate','roleScope':'exact','note':'Test source only'}],
      'vacancyRecords':[{'country':'georgia','role':'devops-engineer','grade':'mid', 'title':'Mid-level DevOps Engineer',
       'company':'Example Employer','location':'Tbilisi','salaryText':'₾6,000–₾8,000 per month','period':'month',
       'source':'YubHub (employer job ad)','url':'https://jobs.example.com/posting',
       'observedDate':'2026-11-18','fetchedAt':'2026-11-18T14:00:00Z'}]
   })))
   html=(ROOT/'index.html').read_text('utf8')
   html=html.replace('<link href="./styles.css?v=0.9.11" rel="stylesheet"/>','<style>'+(ROOT/'styles.css').read_text('utf8')+'</style>')
   html=html.replace('<script src="./app.js?v=0.9.11"></script>','<script>'+(ROOT/'app.js').read_text('utf8')+'</script>')
   html=html.replace('<script src="./market.js?v=0.9.11"></script>','<script>'+(ROOT/'market.js').read_text('utf8')+'</script>')
   html=html.replace('http-equiv="Content-Security-Policy"','http-equiv="Test-Only-CSP"')
   html=html.replace('<head>','<head><base href="https://hireorgrow.example/">')
   page.set_content(html,wait_until='domcontentloaded')
   assert '0.9.11' in page.title()
   # The Blue Lagoon hero and HireOrGrow logo must stay together above navigation.
   assert page.locator('header.site-hero .logo').inner_text().startswith('HireOrGrow')
   assert page.locator('header.site-hero').evaluate('(el) => !!(el.compareDocumentPosition(document.querySelector(".product-nav")) & Node.DOCUMENT_POSITION_FOLLOWING)')
   assert page.locator('#decision .compare-top').count()==0
   assert page.locator('#tab-guide').count()==1
   assert page.locator('#financial-assumptions-panel').evaluate('(e) => !e.open')
   assert page.locator('#decision-chart').is_visible()
   assert page.locator('#decision-chart .decision-chart-card').count()==3
   # In the decision-first layout financial controls are intentionally below charts and collapsed.
   assert page.locator('.decision-calculators-section').evaluate('(e) => e.compareDocumentPosition(document.querySelector(".financial-assumptions")) & Node.DOCUMENT_POSITION_FOLLOWING')
   page.locator('#open-financial-assumptions').click()
   assert page.locator('#financial-assumptions-panel').evaluate('(e) => e.open')
   # Do not silently assume a candidate exists: unassessed paths are excluded.
   assert page.locator('#fin-promotion-available').input_value()=='unknown'
   assert page.locator('#fin-reskill-available').input_value()=='unknown'
   page.wait_for_function("document.querySelector('#t-winner').textContent.length > 2",timeout=15000)
   assert 'Only assessed feasible scenario' in page.locator('#t-winner').text_content()
   assert 'Not assessed' in page.locator('#t-breakdown').text_content() or 'not assessed' in page.locator('#t-breakdown').text_content()
   # Existing regression tests below use the two demo candidates explicitly.
   page.locator('#fin-promotion-available').select_option('yes')
   page.locator('#fin-reskill-available').select_option('yes')
   assert page.locator('#tab-decision').get_attribute('aria-selected')=='true'
   assert page.locator('#tab-decision .top-nav-symbol svg').count()==1
   assert page.locator('#tab-market .top-nav-symbol svg').count()==1
   assert page.locator('#tab-decision .top-nav-symbol').get_attribute('aria-hidden')=='true'
   assert page.locator('#decision-chart .decision-chart-card').count()==3
   assert page.locator('#decision-chart .decision-chart-icon').count()==0
   assert page.locator('#tab-market strong').text_content()=='Salary Benchmarks'
   assert page.locator('.chart-disclaimer').count()==1
   assert page.locator('.decision-calculators-section > .chart-disclaimer').count()==1
   assert page.locator('.financial-assumptions .chart-disclaimer').count()==0
   assert page.locator('.chart-disclaimer').evaluate('(e) => !!(e.compareDocumentPosition(document.querySelector(".financial-assumptions")) & Node.DOCUMENT_POSITION_FOLLOWING)')
   assert page.locator('.comparison-lead .chart-disclaimer').evaluate('(e) => e.compareDocumentPosition(document.querySelector("#decision-chart")) & Node.DOCUMENT_POSITION_PRECEDING')
   assert 'Sets the country for salary evidence' in page.locator('.location-hint').text_content()
   assert page.locator('#decision-role option').count()==43
   assert page.locator('#decision-role optgroup').count()==0
   assert page.locator('#decision-role').input_value()=='devops-engineer'
   page.wait_for_function("document.querySelector('#fin-market').value !== ''",timeout=15000)
   assert page.locator('#fin-market').input_value()=='3300'  # Armenia Senior NET is used AS IS
   assert page.locator('#fin-internal').input_value()=='3300'  # Mirrors source, marked NET proxy
   assert page.locator('#fin-raise').input_value()=='287.1'
   assert page.locator('#fin-training').input_value()=='1023'
   assert page.locator('#fin-period').input_value()=='monthly'
   assert 'Market Salary Rate / Month (USD)' in page.locator('#fin-market-label').inner_text()
   assert 'NET · SOURCE' in page.locator('#fin-market-basis').inner_text()
   assert 'NET · DEFAULT FROM MARKET' in page.locator('#fin-internal-basis').inner_text()
   assert 'salary basis: NET' in page.locator('#fin-status').inner_text()
   # Exact-grade NET and unspecified records also auto-fill; never become GROSS.
   page.evaluate("""() => {
     referenceRecords.push({country:'armenia',role:'devops-engineer',grade:'mid',basis:'net',roleScope:'exact',
       period:'month',low:2750,high:3250,median:3000,currency:'USD',source:'SYNTHETIC NET TEST',publishedDate:'2099-01-01'});
     refreshFinancialBenchmark({reset:true});
   }""")
   assert page.locator('#fin-market').input_value()=='3000'
   assert 'NET · SOURCE' in page.locator('#fin-market-basis').inner_text()
   assert 'Role & Level Match' in page.locator('#fin-source-review').inner_text()
   page.evaluate("""() => {
     referenceRecords.push({country:'armenia',role:'devops-engineer',grade:'mid',basis:'unspecified',roleScope:'exact',
       period:'month',low:3900,high:4100,median:4000,currency:'USD',source:'SYNTHETIC UNKNOWN TEST',publishedDate:'2100-01-01'});
     refreshFinancialBenchmark({reset:true});
   }""")
   assert page.locator('#fin-market').input_value()=='4000'
   assert 'NOT SPECIFIED · SOURCE' in page.locator('#fin-market-basis').inner_text()
   page.evaluate("""() => {
     referenceRecords=referenceRecords.filter(r=>!r.source.startsWith('SYNTHETIC '));
     refreshFinancialBenchmark({reset:true});
   }""")
   assert page.locator('#fin-market').input_value()=='3300'
   page.locator('#currency').select_option('RUB')
   assert page.locator('#fin-market').input_value()==''  # FX unavailable in test fixture
   assert 'FX unavailable' in page.locator('#fin-market-source').inner_text()
   page.locator('#currency').select_option('USD')
   assert page.locator('#fin-market').input_value()=='3300'
   assert page.locator('#decision-chart .decision-period-pill').all_text_contents()==['One-Time Cost','12-Month Total Cost','12-Month Incremental Cost']
   assert 'one-time' in page.locator('#decision-chart').inner_text()
   assert '12-month total' in page.locator('#decision-chart').inner_text()
   assert '12-month incremental' in page.locator('#decision-chart').inner_text()
   # v0.9.11: same-role NET, GROSS and unspecified salary auto-fill.
   assert 'Indicative · Level Mismatch' in page.locator('#fin-source-review').inner_text()
   assert page.locator('#fin-use-indicative').count()==0
   page.locator('#scenario-location').select_option('georgia')
   assert 'NOT SPECIFIED · SOURCE' in page.locator('#fin-market-basis').inner_text()
   assert 'Indicative · Level Mismatch' in page.locator('#fin-source-review').inner_text()
   assert float(page.locator('#fin-market').input_value())>2000
   page.locator('#scenario-location').select_option('slovakia')
   assert 'GROSS · SOURCE' in page.locator('#fin-market-basis').inner_text()
   assert 'Indicative · Level Mismatch' in page.locator('#fin-source-review').inner_text()
   assert float(page.locator('#fin-market').input_value())>3000
   page.locator('#decision-grade').select_option('junior')
   assert float(page.locator('#fin-market').input_value())>3000  # Misaligned grade still marked indicative
   page.locator('#scenario-location').select_option('portugal')
   page.locator('#decision-grade').select_option('mid')
   assert 'Role & Level Match' in page.locator('#fin-source-review').inner_text()
   assert 'GROSS · SOURCE' in page.locator('#fin-market-basis').inner_text()
   assert float(page.locator('#fin-market').input_value())>3000
   assert page.locator('#fin-use-indicative').count()==0
   page.locator('#scenario-location').select_option('india')
   assert page.locator('#fin-market').input_value()==''  # Broad-family CTC is NOT salary.
   assert 'Context Only' in page.locator('#fin-source-review').inner_text()
   assert 'CTC' in page.locator('#fin-market-source').inner_text()
   page.locator('#scenario-location').select_option('armenia')
   assert page.locator('#fin-market').input_value()=='3300'
   assert 'Enter a More Accurate Rate Manually' in page.locator('#fin-source-review').inner_text()
   page.locator('#fin-edit-manual').click()
   assert page.locator('#fin-market').evaluate('(e)=>document.activeElement===e')
   page.locator('#fin-market').fill('4300')
   assert page.locator('#fin-market').input_value()=='4300'
   assert 'Manual Estimate' in page.locator('#fin-source-review').inner_text()
   assert 'not specified' in page.locator('#fin-source-review').inner_text()
   assert 'MANUAL' in page.locator('#fin-status').inner_text()
   page.locator('#scenario-location').select_option('georgia')
   assert page.locator('#fin-market').input_value()!='4300'  # Manual Armenia rate cannot cross country boundaries.
   assert 'NOT SPECIFIED · SOURCE' in page.locator('#fin-market-basis').inner_text()
   page.locator('#scenario-location').select_option('armenia')
   page.locator('#fin-internal').fill('4000')  # Explicit stable baseline for independent cost-model tests
   assert page.locator('#fin-internal').input_value()=='4000'
   assert page.locator('#fin-raise').input_value()=='348'
   first_costs=page.locator('#decision-chart .decision-bar-money strong').all_text_contents()
   page.locator('#fin-period').select_option('annual')
   assert page.locator('#fin-internal').input_value()=='48000'
   assert page.locator('#fin-raise').input_value()=='4176'
   assert page.locator('#fin-training').input_value()=='1023'
   assert page.locator('#fin-market').input_value()=='39600'
   assert page.locator('#decision-chart .decision-bar-money strong').all_text_contents()==first_costs
   page.locator('#fin-period').select_option('monthly')
   assert page.locator('#fin-internal').input_value()=='4000'
   assert page.locator('#fin-raise').input_value()=='348'
   assert page.locator('#decision-chart .decision-bar-money strong').all_text_contents()==first_costs
   assert page.locator('#hire-external').text_content()=='$20,000'
   assert page.locator('#hire-internal').text_content()=='$11,223'
   assert page.locator('#r-keep').text_content()=='$53,199'
   assert page.locator('#r-replace').text_content().startswith('$')  # Rate is source-based, so legacy demo total is obsolete
   assert page.locator('#t-p-total').text_content().startswith('$')
   assert page.locator('#decision-chart .decision-bar-row').count()==9
   assert page.locator('#decision-chart .decision-bar-row--empty').count()==2
   assert page.locator('#decision-chart .decision-lowest-tag').count()==3
   # First and second colored bar tracks must align pixel-perfectly across
   # the three cards, even when Retain vs. Replace has no lead-time detail.
   for row_index in (0,1):
    tracks=page.locator(f'#decision-chart .decision-chart-card .decision-bar-row:nth-child({row_index+1}) .decision-bar-track')
    tops=tracks.evaluate_all('(es)=>es.map(e=>e.getBoundingClientRect().top)')
    assert len(tops)==3 and max(tops)-min(tops)<1,(row_index,tops)
   assert page.locator('#decision-chart .decision-chart-head h3').all_text_contents()==['External vs. Internal Hire','Retain vs. Replace','Hire, Promote, or Reskill']
   assert page.locator('#decision-chart .decision-chart-edit').count()==3
   assert all('Edit Assumptions' in x for x in page.locator('#decision-chart .decision-chart-edit').all_text_contents())
   assert '≈ 2.0 months to start' in page.locator('#decision-chart').inner_text()
   assert '≈ 1.0 months to start' in page.locator('#decision-chart').inner_text()
   assert '2.0 months to full productivity' in page.locator('#decision-chart').inner_text()
   assert '1.0 months to full productivity' in page.locator('#decision-chart').inner_text()
   assert '4.0 months to full productivity' in page.locator('#decision-chart').inner_text()

   # Three desktop cards share the same horizontal bands from heading to actions.
   for selector in ['.decision-chart-head','.decision-chart-bars','.decision-chart-summary','.decision-chart-note','.decision-chart-edit']:
    tops=[round(e['y'],1) for e in page.locator('#decision-chart .decision-chart-card '+selector).evaluate_all('(es)=>es.map(e=>e.getBoundingClientRect().toJSON())')]
    assert max(tops)-min(tops)<2,(selector,tops)
   assert page.locator('.decision-chart-edit').first.evaluate('(e)=>getComputedStyle(e).backgroundColor')!='rgba(0, 0, 0, 0)'

   page.locator('.financial-assumptions').screenshot(path=str(ROOT/'v097_period_switch.png'), animations='disabled')
   page.locator('#decision-chart').screenshot(path=str(ROOT/'v095_charts.png'), animations='disabled')
   page.screenshot(path=str(ROOT/'v09_dashboard.png'),full_page=False)
   assert page.locator('#hire-editor').is_visible()
   assert page.locator('#hire-editor').get_attribute('open') is None
   page.locator('[data-edit="hire"]').click()
   assert page.locator('#hire-editor').get_attribute('open') is not None
   page.locator('#he-recruit').fill('9000')
   assert page.locator('#hire-external').text_content()=='$23,000'
   assert '$23,000' in page.locator('#decision-chart').inner_text()
   page.locator('#fin-period').select_option('annual')
   # Readily available exact same-grade GROSS midpoint from Netherlands, with mocked FX.
   page.locator('#scenario-location').select_option('netherlands')
   page.wait_for_function("document.querySelector('#fin-market').value !== ''",timeout=15000)
   market_annual=float(page.locator('#fin-market').input_value())
   assert market_annual>50000,market_annual
   assert abs(float(page.locator('#r-newpay').input_value())-market_annual)<1
   page.locator('#fin-raise').fill('9000')
   assert page.locator('#r-raise').input_value()=='9000'
   page.locator('#fin-training').fill('3000')
   assert page.locator('#t-s-train').input_value()=='3000'
   # One-off training cost is never subject to the Monthly / Annual toggle.
   page.locator('#fin-period').select_option('monthly')
   assert page.locator('#fin-training').input_value()=='3000'
   page.locator('#fin-period').select_option('annual')
   assert page.locator('#fin-training').input_value()=='3000'
   # Monthly GROSS source is normalized to annual employer cost. Test fixture
   # stays in browser memory and is never written into public salary data.
   page.locator('#decision-grade').select_option('junior')
   page.locator('#decision-grade').select_option('mid')
   page.evaluate("""() => {
     referenceRecords.push({country:'netherlands', role:'devops-engineer',grade:'mid',basis:'gross',roleScope:'exact',
       period:'month',low:4500,high:5500,median:5000,currency:'EUR',source:'SYNTHETIC TEST RECORD',
       publishedDate:'2099-01-01',sample:40});
     refreshFinancialBenchmark({reset:true});
   }""")
   assert 'SYNTHETIC TEST RECORD' in page.locator('#fin-market-source').inner_text()
   assert page.locator('#fin-market').input_value()=='66667' or abs(float(page.locator('#fin-market').input_value())-66666.67)<1
   page.locator('#fin-period').select_option('monthly')
   assert abs(float(page.locator('#fin-market').input_value())-5555.56)<1
   expected_annual_cost=float(page.locator('#r-newpay').input_value())
   page.locator('#fin-period').select_option('annual')
   assert float(page.locator('#r-newpay').input_value())==expected_annual_cost
   # Restore real documents before continuing through role-sync tests.
   page.evaluate("""() => {
     referenceRecords=referenceRecords.filter(r=>r.source!=='SYNTHETIC TEST RECORD');
     refreshFinancialBenchmark({reset:true});
   }""")
   page.locator('#decision-role').select_option('bioinformatics-engineer')
   assert page.locator('#m-role').input_value()=='bioinformatics-engineer'
   assert page.locator('#r-role').input_value()=='Bioinformatics Engineer'
   assert page.locator('#role').input_value()=='Bioinformatics Engineer'
   assert page.locator('#t-role').input_value()=='Bioinformatics Engineer'
   page.locator('#tab-market').click()
   assert page.locator('#tab-market').get_attribute('aria-selected')=='true'
   assert 'active' in page.locator('#tab-market').get_attribute('class')
   assert page.locator('#market').is_visible()
   assert page.locator('#decision').is_hidden()
   page.wait_for_function("document.querySelector('#m-fetchstatus').textContent.includes('Public source snapshots:')",timeout=15000)
   assert page.locator('#rate-trends').count()==1
   assert page.locator('#m-compare-rows .market-mini-card').count()==3
   assert page.locator('#m-compare-rows').inner_text().count('No documented range')==3
   page.locator('#m-role').select_option('devops-engineer')
   # New source-backed markets: select global then inspect role- and grade-matched countries.
   page.locator('[data-preset="global"]').click()
   assert page.locator('#m-compare-rows .market-mini-card').count()==9
   assert 'Portugal' in page.locator('#m-compare-rows').inner_text()
   assert 'India' in page.locator('#m-compare-rows').inner_text()
   assert 'iTechScope' in page.locator('#m-compare-rows').inner_text()
   assert 'SalaryByRole' in page.locator('#m-results').inner_text() or 'SalaryByRole' in page.locator('#m-auto-status').inner_text()
   assert '₾6,000' in page.locator('#m-auto-results').inner_text()
   assert 'Realtime Recruitment' in page.locator('#m-compare-rows').inner_text()
   assert 'Tracking started' in page.locator('#m-trends-chart').inner_text()
   # Test a second observed record in memory ONLY; do not ship fabricated history.
   added=page.evaluate("""() => {
     const r=rateHistory.observations.find(x=>x.country==='netherlands'&&x.role==='devops-engineer'&&x.grade==='mid'&&x.kind==='curated');
     if(!r)return false;
     rateHistory.observations.push({...r,observedAt:'2026-12-02',low:r.low*1.05,high:r.high*1.05,median:r.median===null?null:r.median*1.05});
     renderMarket();return true;
   }""")
   assert added
   assert page.locator('#m-trends-chart svg').count()>0
   assert '+5.0% observed change' in page.locator('#m-trends-chart').inner_text()

   # Check market selection never leaks unrelated countries.
   page.locator('[data-preset="clear"]').click()
   page.locator('.m-country[value="armenia"]').check()
   assert page.locator('#m-compare-rows .market-mini-card').count()==1
   assert 'Georgia' not in page.locator('#m-compare-rows').inner_text()
   assert 'Tbilisi' not in page.locator('#m-auto-results').inner_text()
   page.locator('#tab-guide').click()
   assert page.locator('#guide').is_visible()
   assert page.locator('#market').is_hidden()
   assert page.locator('#guide-models').is_visible()
   page.locator('[data-open-tab="decision"]').click()
   assert page.locator('#decision').is_visible()
   assert page.locator('#tab-guide').get_attribute('aria-selected')=='false'
   page.locator('#tab-decision').click()
   assert page.locator('#decision-role').input_value()=='devops-engineer'
   page.locator('#currency').select_option('EUR')
   assert '€' in page.locator('#decision-chart').inner_text()
   # Responsive: three comparison groups stack and no horizontal page overflow.
   page.set_viewport_size({'width':390,'height':850})
   page.wait_for_timeout(150)
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'), 'Horizontal overflow on mobile'
   assert not errors,errors
   print('PASS: 43 roles, 3 interactive charts, cost calculations, sync, FX-independent decision UI, market data, responsive layout')
   page.screenshot(path=str(ROOT/'v09_preview.png'),full_page=True)
   browser.close()
 finally:server.shutdown()

if __name__=='__main__':main()
