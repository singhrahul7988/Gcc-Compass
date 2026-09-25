from pathlib import Path
import json
from playwright.sync_api import sync_playwright

out = Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True, exist_ok=True)
base = 'http://127.0.0.1:5173/#build'

def summary(page):
    return page.evaluate("""() => ({
      route: document.querySelector('.build-hero-copy h2')?.textContent?.trim(),
      rationale: document.querySelector('.build-hero-description')?.textContent?.trim(),
      costMetric: document.querySelectorAll('.build-metric strong')[1]?.textContent?.trim(),
      city: document.querySelector('.build-hero-context')?.textContent?.trim(),
      selected: [...document.querySelectorAll('.build-route-card > button.selected')].map(x => x.textContent?.trim()),
      tableRows: document.querySelectorAll('.build-assumptions-table tbody tr').length,
      pageWidth: document.documentElement.scrollWidth,
      viewport: innerWidth
    })""")

def select_city(page, city):
    page.locator('#build-city').click()
    page.locator('.build-city-option').filter(has_text=city).click()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 900}, accept_downloads=True)
    page.goto(base, wait_until='networkidle')
    page.screenshot(path=str(out / 'before-default-wide.png'), full_page=True)
    screenshots = [('assumptions', 'before-default-wide.png')]
    for name, tab in [('cost', 'Cost breakdown'), ('timeline', 'Timeline view'), ('sources', 'Source references')]:
        page.get_by_role('tab', name=tab).click()
        file = f'before-{name}-wide.png'
        page.screenshot(path=str(out / file), full_page=True)
        screenshots.append((name, file))
    page.get_by_role('button', name='View as table').click()
    page.screenshot(path=str(out / 'before-table-wide.png'), full_page=True)
    page.get_by_role('button', name='View as cards').click()
    page.get_by_role('tab', name='Key assumptions').click()
    scenarios = {'default': summary(page)}
    actions = {
        'city_hyderabad': lambda: select_city(page, 'Hyderabad'),
        'small_team_40': lambda: page.locator('#build-team-size').fill('40'),
        'large_team_600': lambda: page.locator('#build-team-size').fill('600'),
        'urgent_timeline': lambda: page.get_by_role('button', name='< 3 months').click(),
        'long_timeline': lambda: page.get_by_role('button', name='12+ months').click(),
        'ai_mix_60': lambda: page.locator('.build-mix-row input[type=range]').nth(1).fill('60'),
        'partner_unchecked': lambda: page.locator('.build-check-row input').nth(0).uncheck(),
        'office_checked': lambda: page.locator('.build-check-row input').nth(1).check(),
        'scale_checked': lambda: page.locator('.build-check-row input').nth(2).check(),
        'ip_checked': lambda: page.locator('.build-check-row input').nth(3).check(),
        'control_priority': lambda: page.get_by_role('button', name='More control').click(),
    }
    for name, action in actions.items():
        page.reload(wait_until='domcontentloaded')
        action()
        scenarios[name] = summary(page)
    page.reload(wait_until='domcontentloaded')
    page.get_by_role('button', name='Select EOR').click()
    scenarios['select_eor_card'] = summary(page)
    page.get_by_role('button', name='Get recommendation').click()
    scenarios['get_recommendation'] = summary(page)
    page.get_by_role('button', name='Close details').click()
    scenarios['closed_details_visible'] = page.locator('.build-details').is_visible()
    page.get_by_role('button', name='Show assumptions and sources').click()
    scenarios['reopened_details_visible'] = page.locator('.build-details').is_visible()
    page.get_by_role('button', name='View all sources').click()
    scenarios['view_all_sources_tab'] = page.get_by_role('tab', name='Source references').get_attribute('aria-selected')
    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile.goto(base, wait_until='networkidle')
    mobile.screenshot(path=str(out / 'before-default-mobile.png'), full_page=True)
    report = {'screenshots': screenshots, 'scenarios': scenarios, 'mobileWidth': mobile.evaluate('document.documentElement.scrollWidth')}
    (out / 'before-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    browser.close()
