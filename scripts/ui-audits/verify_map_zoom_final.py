from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
 page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.goto('http://127.0.0.1:5173/');page.get_by_role('button',name='City Compare').click();page.wait_for_timeout(1000)
 m=page.locator('.city-map-card');m.screenshot(path='artifacts/city-map-default-final.png')
 def state(label):
  print(label,page.evaluate('''() => ({labelClasses:document.querySelectorAll('.compare-map-marker.show-label').length,visibleLabels:[...document.querySelectorAll('.compare-map-marker b')].filter(x=>getComputedStyle(x).display!=='none').length,tileSrc:document.querySelector('.city-map-card .leaflet-tile-loaded')?.getAttribute('src'),zoomInVisible:getComputedStyle(document.querySelector('.leaflet-control-zoom-in')).visibility})'''))
 state('default')
 for n in range(1,4):
  page.locator('.city-map-card .leaflet-control-zoom-in').click();page.wait_for_timeout(550);state(f'click{n}')
 m.screenshot(path='artifacts/city-map-zoomed-final.png')
 page.locator('.city-map-card .leaflet-control-zoom-out').click();page.wait_for_timeout(550);state('zoomout')
 rect=m.bounding_box();page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);page.mouse.wheel(0,-500);page.wait_for_timeout(650);state('wheelin')
 b.close()
