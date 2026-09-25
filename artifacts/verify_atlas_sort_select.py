from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 1000}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(800)
    page.locator('.atlas-table-toolbar select').select_option('Confidence')
    metrics = page.evaluate("""
    () => {
      const s = document.querySelector('.atlas-table-toolbar select');
      const r = s.getBoundingClientRect();
      return {value: s.value, width: Math.round(r.width), right: Math.round(r.right), toolbarRight: Math.round(document.querySelector('.atlas-table-toolbar').getBoundingClientRect().right)};
    }
    """)
    print(metrics)
    browser.close()
