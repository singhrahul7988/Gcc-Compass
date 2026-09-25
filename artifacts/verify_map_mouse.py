from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
 page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.goto('http://127.0.0.1:5173/');page.get_by_role('button',name='City Compare').click();page.wait_for_timeout(700)
 m=page.locator('.compare-map-marker.blue').bounding_box();print('marker',m)
 page.mouse.move(m['x']+m['width']/2,m['y']+m['height']/2)
 page.mouse.wheel(0,-160);page.wait_for_timeout(700)
 print('afterwheel',page.evaluate('''() => ({label:document.querySelectorAll('.compare-map-marker.show-label').length,tile:document.querySelector('.city-map-card .leaflet-tile-loaded')?.getAttribute('src')})'''))
 page.mouse.wheel(0,-160);page.wait_for_timeout(700)
 print('afterwheel2',page.evaluate('''() => ({label:document.querySelectorAll('.compare-map-marker.show-label').length,tile:document.querySelector('.city-map-card .leaflet-tile-loaded')?.getAttribute('src')})'''))
 page.locator('.city-map-card').screenshot(path='artifacts/city-map-mouse-zoom.png')
 b.close()
