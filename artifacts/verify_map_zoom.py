from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
 for width in (1440,390):
  page=b.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
  page.goto('http://127.0.0.1:5173/');page.get_by_role('button',name='City Compare').click();page.wait_for_timeout(1200)
  m=page.locator('.city-map-card');m.screenshot(path=f'artifacts/city-map-default-{width}.png')
  print('default',width,page.evaluate('''() => ({control:!!document.querySelector('.city-map-card .leaflet-control-zoom'),zoomedLabels:document.querySelectorAll('.compare-map-marker.show-label').length,shownLabels:[...document.querySelectorAll('.compare-map-marker b')].filter(x=>getComputedStyle(x).display!=='none').length,tiles:document.querySelectorAll('.city-map-card .leaflet-tile-loaded').length,mapWidth:Math.round(document.querySelector('.city-map-card').getBoundingClientRect().width)})'''))
  page.locator('.city-map-card .leaflet-control-zoom-in').click();page.wait_for_timeout(180)
  page.locator('.city-map-card .leaflet-control-zoom-in').click();page.wait_for_timeout(700)
  m.screenshot(path=f'artifacts/city-map-zoomed-{width}.png')
  print('zoomed',width,page.evaluate('''() => ({zoomedLabels:document.querySelectorAll('.compare-map-marker.show-label').length,shownLabels:[...document.querySelectorAll('.compare-map-marker b')].filter(x=>getComputedStyle(x).display!=='none').length,tiles:document.querySelectorAll('.city-map-card .leaflet-tile-loaded').length})'''))
  page.close()
 b.close()
