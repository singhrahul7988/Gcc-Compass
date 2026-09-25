from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
 for w in (1440,390):
  page=b.new_page(viewport={'width':w,'height':900},device_scale_factor=1)
  page.goto('http://127.0.0.1:5173/');page.get_by_role('button',name='City Compare').click();page.wait_for_timeout(650)
  page.locator('.city-map-card').screenshot(path=f'artifacts/city-map-final-default-{w}.png')
  print('default',w,page.evaluate('''() => ({doc:document.documentElement.scrollWidth,viewport:innerWidth,controls:[...document.querySelectorAll('.city-map-card .leaflet-control-zoom a')].map(x=>x.getAttribute('aria-label')),visibleLabels:[...document.querySelectorAll('.compare-map-marker b')].filter(x=>getComputedStyle(x).display!=='none').length})'''))
  if w==1440:
   box=page.locator('.compare-map-marker.blue').bounding_box();page.mouse.move(box['x']+9,box['y']+9)
   page.mouse.wheel(0,-160);page.wait_for_timeout(500);page.mouse.wheel(0,-160);page.wait_for_timeout(650)
   page.locator('.city-map-card').screenshot(path='artifacts/city-map-final-zoomed.png')
   print('zoomed',page.evaluate('''() => ({visibleLabels:[...document.querySelectorAll('.compare-map-marker b')].filter(x=>getComputedStyle(x).display!=='none').length,labelFont:getComputedStyle(document.querySelector('.compare-map-marker.show-label b')).fontSize})'''))
  page.close()
 b.close()
