from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts/build-vs-buy')
out.mkdir(parents=True, exist_ok=True)
def select_city(page, city):
    page.locator('#build-city').click()
    page.locator('.build-city-option').filter(has_text=city).click()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 1024}, device_scale_factor=1, accept_downloads=True)
    page.goto('http://127.0.0.1:5173/#build', wait_until='networkidle')
    page.screenshot(path=str(out / 'final-desktop.png'), full_page=True)
    print('desktop', page.evaluate("""() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      controlsBottom: Math.round(document.querySelector('.build-controls').getBoundingClientRect().bottom),
      detailsBottom: Math.round(document.querySelector('.build-details').getBoundingClientRect().bottom),
      assumptionRows: document.querySelectorAll('.build-assumptions-table tbody tr').length
    })"""))
    assert page.locator('.build-assumptions-table tbody tr').count() == 5
    select_city(page, 'Hyderabad')
    page.locator('#build-team-size').fill('40')
    assert 'EOR' in page.locator('.build-hero-copy h2').inner_text()
    page.locator('#build-team-size').fill('400')
    page.get_by_role('button', name='More control').click()
    page.get_by_role('button', name='12+ months').click()
    assert 'Direct entity' in page.locator('.build-hero-copy h2').inner_text()
    assert 'Baseline route' in page.locator('.build-metrics').inner_text()
    page.get_by_role('button', name='View as table').click()
    assert page.locator('.build-route-table').is_visible()
    page.get_by_role('tab', name='Cost breakdown').click()
    assert page.locator('.build-cost-list').is_visible()
    page.get_by_role('tab', name='Source references').click()
    assert page.locator('.build-source-list').is_visible()
    with page.expect_download() as download_info:
        page.get_by_role('button', name='Download assumptions').click()
    print('download', download_info.value.suggested_filename)
    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
    mobile.goto('http://127.0.0.1:5173/#build', wait_until='networkidle')
    mobile.screenshot(path=str(out / 'final-mobile.png'), full_page=True)
    print('mobile', mobile.evaluate("""() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      controlsWidth: Math.round(document.querySelector('.build-controls').getBoundingClientRect().width),
      cardCount: document.querySelectorAll('.build-route-card').length
    })"""))
    browser.close()
