from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts/city-map')
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        headless=True,
    )
    for width in [1920, 1180, 900, 390, 320]:
        page = browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:5173/#cities=', wait_until='networkidle')
        map_card = page.locator('.city-map-card')
        hint = page.get_by_role('button', name='Click to zoom')
        credit = page.locator('.city-map-credit')
        map_box, hint_box, credit_box = map_card.bounding_box(), hint.bounding_box(), credit.bounding_box()
        assert hint_box['x'] + hint_box['width'] + 6 <= credit_box['x'], (width, hint_box, credit_box)
        assert map_box['x'] <= hint_box['x'] and credit_box['x'] + credit_box['width'] <= map_box['x'] + map_box['width']
        assert max(hint_box['y'] + hint_box['height'], credit_box['y'] + credit_box['height']) <= map_box['y'] + map_box['height']
        assert credit.get_attribute('href') == 'https://www.openstreetmap.org/copyright'
        assert 'OpenStreetMap contributors' in credit.inner_text()
        assert not errors, errors
        map_card.screenshot(path=str(out / f'map-footer-{width}.png'))
        if width == 390:
            hint.click()
            page.wait_for_timeout(600)
            hint.click()
            page.wait_for_function("document.querySelectorAll('.compare-map-marker.show-label').length > 0")
            assert page.locator('.compare-map-marker.show-label').count() > 0
        print(width, {'map': round(map_box['width']), 'gap': round(credit_box['x'] - hint_box['x'] - hint_box['width'])})
        page.close()
    browser.close()
