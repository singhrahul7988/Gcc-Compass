from pathlib import Path
import json
from playwright.sync_api import sync_playwright

out = Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True, exist_ok=True)
base = 'http://127.0.0.1:5173/#build'

def state(page):
    return page.evaluate("""() => ({
      route: document.querySelector('.build-hero-copy h2')?.textContent?.trim(),
      cost: document.querySelectorAll('.build-metric strong')[1]?.textContent?.trim(),
      factors: document.querySelector('.build-reasons > div:first-child')?.textContent?.trim(),
      cityFit: document.querySelector('.build-reasons > div:last-child')?.textContent?.trim(),
      exploration: document.querySelector('.build-exploration')?.textContent?.trim() || null,
      pageWidth: document.documentElement.scrollWidth,
      viewport: innerWidth
    })""")

def reset(page):
    page.goto('about:blank')
    page.goto(base, wait_until='networkidle')
    return state(page)

def select_city(page, city):
    page.locator('#build-city').click()
    page.locator('.build-city-option').filter(has_text=city).click()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 900}, accept_downloads=True)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    states = {'default': reset(page)}
    page.screenshot(path=str(out / 'after-default-wide.png'), full_page=True)
    assert 'BOT' in states['default']['route']
    assert states['default']['cost'] == 'Add pricing'

    select_city(page, 'Hyderabad')
    states['city_hyderabad'] = state(page)
    page.screenshot(path=str(out / 'after-hyderabad-wide.png'), full_page=True)
    assert 'Hyderabad' in states['city_hyderabad']['cityFit']
    assert states['city_hyderabad']['cityFit'] != states['default']['cityFit']
    assert page.locator('.build-skyline').evaluate('(el) => getComputedStyle(el).backgroundImage.includes("hyderabad")')
    select_city(page, 'Chennai')
    assert page.locator('.build-skyline.abstract').count() == 1
    page.screenshot(path=str(out / 'after-chennai-wide.png'), full_page=True)

    reset(page)
    page.locator('#build-team-size').fill('40')
    states['small_team_40'] = state(page)
    assert 'EOR' in states['small_team_40']['route']
    assert '40 people' in states['small_team_40']['factors']

    reset(page)
    page.locator('#build-team-size').fill('600')
    page.get_by_role('button', name='12+ months').click()
    page.get_by_role('button', name='More control').click()
    states['large_long_control'] = state(page)
    assert 'Direct entity' in states['large_long_control']['route']

    reset(page)
    page.get_by_role('button', name='< 3 months').click()
    states['urgent'] = state(page)
    assert 'EOR' in states['urgent']['route']

    reset(page)
    page.get_by_role('button', name='6 – 12 months').click()
    assert '6–12 month target' in state(page)['factors']
    reset(page)
    page.locator('#build-team-size').fill('300')
    assert '300 people' in state(page)['factors']
    reset(page)
    page.locator('.build-mix-row input[type=range]').nth(0).fill('80')
    assert '80% Engineering / Product' in state(page)['cityFit']
    reset(page)
    page.locator('.build-mix-row input[type=range]').nth(2).fill('50')
    assert '50% G&A / Support' in state(page)['cityFit']
    reset(page)
    page.locator('.build-mix-row input[type=range]').nth(1).fill('60')
    states['ai_mix_60'] = state(page)
    assert '60% Data / AI' in states['ai_mix_60']['cityFit']
    assert states['ai_mix_60']['cityFit'] != states['default']['cityFit']

    for name, index, checked, phrase in [
        ('partner_off', 0, False, 'did not select partner'),
        ('office_on', 1, True, 'immediate physical office'),
        ('scale_on', 2, True, '500+ growth plan'),
        ('ip_on', 3, True, 'IP-sensitive work'),
    ]:
        reset(page)
        checkbox = page.locator('.build-check-row input').nth(index)
        checkbox.check() if checked else checkbox.uncheck()
        states[name] = state(page)
        assert phrase.lower() in (states[name]['factors'] + states[name]['cityFit']).lower(), name

    reset(page)
    page.get_by_role('button', name='More control').click()
    states['control_priority'] = state(page)
    assert 'long-term control' in states['control_priority']['factors']

    reset(page)
    page.get_by_role('button', name='Explore Direct Entity').click()
    assert 'Exploring Direct entity' in state(page)['exploration']
    page.get_by_role('button', name='View recommended route').click()
    assert state(page)['exploration'] is None
    reset(page)
    page.get_by_role('button', name='Explore EOR').click()
    states['explore_eor'] = state(page)
    assert 'Exploring EOR' in states['explore_eor']['exploration']
    assert 'BOT' in states['explore_eor']['route'], states['explore_eor']
    page.get_by_role('button', name='Return to suggestion').click()
    assert state(page)['exploration'] is None
    page.get_by_role('button', name='Explore EOR').click()
    page.locator('#build-team-size').fill('40')
    assert state(page)['exploration'] is None
    page.get_by_role('button', name='View recommended route').click()
    assert 'EOR' in state(page)['route']

    reset(page)
    page.get_by_role('button', name='View as table').click()
    assert page.locator('.build-route-table').is_visible()
    page.screenshot(path=str(out / 'after-table-wide.png'), full_page=True)
    page.locator('.build-table-select').nth(0).click()
    assert 'Exploring EOR' in state(page)['exploration']
    page.get_by_role('button', name='View as cards').click()
    assert page.locator('.build-route-cards').is_visible()

    page.get_by_role('tab', name='Timeline view').click()
    assert page.get_by_text('Potential fit').count() >= 1
    assert page.get_by_text('Likely misses target').count() >= 1
    page.screenshot(path=str(out / 'after-timeline-wide.png'), full_page=True)
    page.get_by_role('button', name='< 3 months').click()
    assert page.get_by_text('Likely misses target').count() >= 2

    page.get_by_role('tab', name='Source references').click()
    source_links = page.locator('.build-source-links a')
    assert source_links.count() >= 3
    assert all(link.startswith('http') for link in source_links.evaluate_all('(links) => links.map(x => x.href)'))
    source_count = source_links.count()
    page.screenshot(path=str(out / 'after-sources-wide.png'), full_page=True)
    page.get_by_role('tab', name='Key assumptions').click()
    assert page.locator('.build-assumptions-table tbody tr').count() >= 5
    page.get_by_role('button', name='View sources').first.click()
    assert page.get_by_role('tab', name='Source references').get_attribute('aria-selected') == 'true'

    reset(page)
    page.get_by_role('tab', name='Cost breakdown').click()
    page.screenshot(path=str(out / 'after-cost-empty-wide.png'), full_page=True)
    page.get_by_role('spinbutton', name='BOT annual cost per person in lakh').fill('30')
    page.get_by_role('spinbutton', name='DIRECT annual cost per person in lakh').fill('40')
    assert page.locator('.build-quote-total strong').nth(1).inner_text() == '₹60.00 Cr'
    assert page.locator('.build-quote-total strong').nth(2).inner_text() == '₹80.00 Cr'
    assert '25% below direct' == state(page)['cost']
    page.get_by_role('spinbutton', name='EOR annual cost per person in lakh').fill('15')
    states['cheaper_eor_quote'] = state(page)
    assert 'EOR' in states['cheaper_eor_quote']['route']
    assert 'entered Year 1 pricing' in states['cheaper_eor_quote']['factors']
    page.get_by_role('spinbutton', name='EOR annual cost per person in lakh').fill('35')
    assert 'BOT' in state(page)['route']
    page.get_by_role('spinbutton', name='DIRECT annual cost per person in lakh').fill('10')
    assert 'misses your target' in state(page)['cityFit']
    assert 'BOT' in state(page)['route']
    page.get_by_role('spinbutton', name='DIRECT annual cost per person in lakh').fill('40')
    page.screenshot(path=str(out / 'after-cost-filled-wide.png'), full_page=True)
    page.locator('#build-team-size').fill('100')
    assert page.locator('.build-quote-total strong').nth(1).inner_text() == '₹30.00 Cr'
    assert page.locator('.build-quote-total strong').nth(2).inner_text() == '₹40.00 Cr'
    page.get_by_role('spinbutton', name='BOT one-time setup in lakh').fill('50')
    assert page.locator('.build-quote-total strong').nth(1).inner_text() == '₹30.50 Cr'
    with page.expect_download() as download_info:
        page.get_by_role('button', name='Download scenario').click()
    download = download_info.value
    csv = Path(download.path()).read_text(encoding='utf-8-sig')
    assert 'Hyderabad' not in csv
    assert '"Year 1 team size","100"' in csv
    assert '"BOT annual per person (₹ lakh)","30"' in csv
    assert '"BOT Year 1 total (₹ crore)","30.50"' in csv
    states['download'] = {'name': download.suggested_filename, 'size': len(csv)}
    page.get_by_role('button', name='Reset pricing').click()
    assert state(page)['cost'] == 'Add pricing'
    assert page.locator('.build-quote-total strong').nth(1).inner_text() == 'Add pricing'

    page.get_by_role('button', name='Close details').click()
    assert not page.locator('.build-details').is_visible()
    page.get_by_role('button', name='Show assumptions and sources').click()
    assert page.locator('.build-details').is_visible()
    page.get_by_role('tab', name='Key assumptions').click()
    page.screenshot(path=str(out / 'after-assumptions-wide.png'), full_page=True)

    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, accept_downloads=True)
    mobile.goto(base, wait_until='networkidle')
    mobile.screenshot(path=str(out / 'after-default-mobile.png'), full_page=True)
    states['mobile'] = state(mobile)
    assert states['mobile']['pageWidth'] <= states['mobile']['viewport']
    mobile.get_by_role('tab', name='Cost breakdown').click()
    mobile.screenshot(path=str(out / 'after-cost-mobile.png'), full_page=True)
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    report = {'states': states, 'consoleErrors': errors, 'sourceLinkCount': source_count}
    (out / 'after-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    browser.close()


