"""v0.9.11: candidate feasibility + readiness + time-to-money behavior.
Tests use only synthetic/browser-local data.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

def cash(raw):
    return float(raw.replace('$','').replace(',','').replace('€','').strip())

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1200,'height':900})
        errors=[]
        page.on('pageerror', lambda err: errors.append(str(err)))
        # Block external calls. Populate the HTML with the project's own assets.
        html=(ROOT/'index.html').read_text('utf8')
        html=html.replace('<link href="./styles.css?v=0.9.11" rel="stylesheet"/>','<style>'+(ROOT/'styles.css').read_text('utf8')+'</style>')
        html=html.replace('<script src="./app.js?v=0.9.11"></script>','<script>'+(ROOT/'app.js').read_text('utf8')+'</script>')
        html=html.replace('<script src="./market.js?v=0.9.11"></script>','<script>'+(ROOT/'market.js').read_text('utf8')+'</script>')
        html=html.replace('http-equiv="Content-Security-Policy"','http-equiv="Test-Only-CSP"')
        html=html.replace('<head>','<head><base href="https://hireorgrow.example/">')
        page.route('https://hireorgrow.example/data/**',lambda route:route.fulfill(content_type='application/json',body=(ROOT/'data'/route.request.url.split('/data/')[1].split('?')[0]).read_text('utf8')))
        page.route('https://api.frankfurter.dev/**',lambda route:route.abort())
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_function('document.querySelector("#t-winner").textContent.includes("Only assessed")',timeout=15000)
        assert page.locator('#fin-promotion-available').input_value()=='unknown'
        assert page.locator('#fin-reskill-available').input_value()=='unknown'
        assert page.locator('#t-p-total').text_content()=='—'
        assert page.locator('#t-s-total').text_content()=='—'
        assert page.locator('#hire-internal').text_content()=='—'
        assert 'Only Assessed Feasible Option' in page.locator('#decision-chart').text_content()
        assert 'Candidate not assessed' in page.locator('#t-breakdown').text_content()
        assert 'Not included in cost ranking' in page.locator('#decision-chart').text_content()
        # Setup-first UI: inputs open immediately, comparison appears after the user requests it.
        assert page.locator('#financial-assumptions-panel #fin-promotion-available').is_visible()
        assert page.locator('#financial-assumptions-panel #scenario-location').count()==1
        assert page.locator('#decision-results').is_hidden()
        page.locator('#view-comparison').click()
        assert page.locator('#decision-results').is_visible()
        page.locator('#fin-promotion-available').select_option('no')
        page.locator('#fin-reskill-available').select_option('no')
        assert 'No suitable candidate' in page.locator('#t-breakdown').text_content()
        assert 'Only assessed feasible scenario' in page.locator('#t-winner').text_content()
        page.locator('#fin-promotion-available').select_option('yes')
        assert page.locator('#t-p-total').text_content().startswith('$')
        assert page.locator('#t-s-total').text_content()=='—'
        assert page.locator('#hire-internal').text_content().startswith('$')
        page.locator('#fin-reskill-available').select_option('yes')
        assert page.locator('#t-s-total').text_content().startswith('$')
        page.locator('#fin-raise').fill('500')
        old=float(page.locator('#t-p-old').input_value())
        assert float(page.locator('#t-p-new').input_value())-old==6000
        page.locator('#fin-training').fill('12000')
        assert page.locator('#t-p-train').input_value()=='12000'
        assert page.locator('#t-s-train').input_value()=='12000'
        page.locator('#fin-promotion-months').fill('3')
        assert page.locator('#t-p-delay').input_value()=='3'
        assert '3.0 months to full productivity' in page.locator('#decision-chart').text_content()
        page.locator('#talent-editor').evaluate('(el)=>el.open=true')
        page.locator('#t-p-delay').fill('2')
        assert page.locator('#fin-promotion-months').input_value()=='2'
        page.locator('#t-p-ramp-months').fill('1')
        assert '3.0 months to full productivity' in page.locator('#decision-chart').text_content()
        page.locator('#fin-reskill-months').fill('5')
        assert page.locator('#t-s-delay').input_value()=='5'
        assert '5.0 months to full productivity' in page.locator('#decision-chart').text_content()
        before_e=cash(page.locator('#t-e-total').text_content())
        before_p=cash(page.locator('#t-p-total').text_content())
        page.locator('#fin-delay-impact').fill('2000')
        assert 'including $4,000 time impact' in page.locator('#t-breakdown').text_content()
        assert 'including $6,000 time impact' in page.locator('#t-breakdown').text_content()
        # Default external loss = $6,000 vacancy + $3,000 ramp. Shared 2mo*2000 replaces both.
        assert cash(page.locator('#t-e-total').text_content())==before_e-5000
        # Promotion old target-role loss = $3,000. New 3mo*2000 replaces it, keeping previous-role loss.
        assert cash(page.locator('#t-p-total').text_content())==before_p+3000
        # Time impact is capped by the selected horizon, does not go negative / imply readiness.
        page.locator('#fin-reskill-months').fill('30')
        assert 'not fully productive within the selected horizon' in page.locator('#t-narrative').text_content()
        assert page.locator('#t-s-total').text_content()=='—'
        assert 'Not productive within 12-month horizon' in page.locator('#t-breakdown').text_content()
        page.locator('#fin-delay-impact').fill('')
        assert 'not monetized automatically' in page.locator('#t-narrative').text_content()
        page.locator('#fin-promotion-available').select_option('no')
        assert page.locator('#t-p-total').text_content()=='—'
        assert 'Promotion excluded' in page.locator('#t-narrative').text_content()
        page.set_viewport_size({'width':390,'height':850})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+2'), 'Mobile horizontal overflow'
        assert not errors, errors
        print('PASS: candidate feasibility, raise/training, month sync, time-cost replacement, horizon cap, mobile')
        browser.close()

if __name__=='__main__':
    main()
