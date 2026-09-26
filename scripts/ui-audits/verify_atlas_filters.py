from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 900}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(800)
    selects = page.locator('.atlas-select-filter select')
    city_options = selects.nth(0).locator('option').count()
    sector_options = selects.nth(1).locator('option').count()
    function_options = selects.nth(2).locator('option').count()
    status_options = selects.nth(3).locator('option').count()
    selects.nth(0).select_option('Hyderabad')
    filtered_text = page.locator('.atlas-table-toolbar span').inner_text()
    page.locator('.atlas-more-button').click()
    cleared_text = page.locator('.atlas-table-toolbar span').inner_text()
    print({
      'city_options': city_options,
      'sector_options': sector_options,
      'function_options': function_options,
      'status_options': status_options,
      'after_city_filter': filtered_text,
      'after_clear': cleared_text,
    })
    browser.close()
