"""Functional regression test for v0.9 consolidated decision comparison."""
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
   html=(ROOT/'index.html').read_text('utf8')
   html=html.replace('<link href="./styles.css?v=0.9.2" rel="stylesheet"/>','<style>'+(ROOT/'styles.css').read_text('utf8')+'</style>')
   html=html.replace('<script src="./app.js?v=0.9.2"></script>','<script>'+(ROOT/'app.js').read_text('utf8')+'</script>')
   html=html.replace('<script src="./market.js?v=0.9.2"></script>','<script>'+(ROOT/'market.js').read_text('utf8')+'</script>')
   html=html.replace('http-equiv="Content-Security-Policy"','http-equiv="Test-Only-CSP"')
   html=html.replace('<head>','<head><base href="https://hireorgrow.example/">')
   page.set_content(html,wait_until='domcontentloaded')
   assert '0.9.2' in page.title()
   assert page.locator('#tab-decision').get_attribute('aria-selected')=='true'
   assert page.locator('#decision-chart .decision-chart-card').count()==3
   assert page.locator('#decision-chart .decision-chart-icon').count()==0
   assert page.locator('#tab-market strong').text_content()=='Salary Benchmarks'
   assert page.locator('.chart-disclaimer').count()==1
   assert page.locator('.comparison-lead .chart-disclaimer').evaluate('(e) => e.compareDocumentPosition(document.querySelector("#decision-chart")) & Node.DOCUMENT_POSITION_FOLLOWING')
   assert 'Sets the country context' in page.locator('.location-hint').text_content()
   assert page.locator('#decision-role option').count()==43
   assert page.locator('#decision-role optgroup').count()==0
   assert page.locator('#decision-role').input_value()=='devops-engineer'
   assert page.locator('#hire-external').text_content()=='$20,000'
   assert page.locator('#hire-internal').text_content()=='$11,200'
   assert page.locator('#r-keep').text_content()=='$53,000'
   assert page.locator('#r-replace').text_content()=='$74,000'
   assert page.locator('#t-p-total').text_content()=='$71,500'
   assert page.locator('#decision-chart .decision-bar-row').count()==7
   assert page.locator('#decision-chart .decision-lowest-tag').count()==3
   page.screenshot(path=str(ROOT/'v09_dashboard.png'),full_page=False)
   assert page.locator('#hire-editor').is_visible()
   assert page.locator('#hire-editor').get_attribute('open') is None
   page.locator('[data-edit="hire"]').click()
   assert page.locator('#hire-editor').get_attribute('open') is not None
   page.locator('#he-recruit').fill('9000')
   assert page.locator('#hire-external').text_content()=='$23,000'
   assert '$23,000' in page.locator('#decision-chart').inner_text()
   page.locator('#decision-role').select_option('bioinformatics-engineer')
   assert page.locator('#m-role').input_value()=='bioinformatics-engineer'
   assert page.locator('#r-role').input_value()=='Bioinformatics Engineer'
   assert page.locator('#role').input_value()=='Bioinformatics Engineer'
   assert page.locator('#t-role').input_value()=='Bioinformatics Engineer'
   page.locator('#tab-market').click()
   assert page.locator('#market').is_visible()
   assert page.locator('#decision').is_hidden()
   page.wait_for_function("document.querySelector('#m-fetchstatus').textContent.includes('Public source snapshots:')",timeout=15000)
   assert page.locator('#m-compare-rows .market-mini-card').count()==3
   assert page.locator('#m-compare-rows').inner_text().count('No documented range')==3
   page.locator('#m-role').select_option('devops-engineer')
   # New source-backed markets: select global then inspect role- and grade-matched countries.
   page.locator('[data-preset="global"]').click()
   assert page.locator('#m-compare-rows .market-mini-card').count()==9
   assert 'Portugal' in page.locator('#m-compare-rows').inner_text()
   assert 'India' in page.locator('#m-compare-rows').inner_text()
   assert 'iTechScope' in page.locator('#m-compare-rows').inner_text()
   assert 'Realtime Recruitment' in page.locator('#m-compare-rows').inner_text()
   # Check market selection never leaks unrelated countries.
   page.locator('[data-preset="clear"]').click()
   page.locator('.m-country[value="armenia"]').check()
   assert page.locator('#m-compare-rows .market-mini-card').count()==1
   assert 'Georgia' not in page.locator('#m-compare-rows').inner_text()
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
