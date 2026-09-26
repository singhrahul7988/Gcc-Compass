from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    for width in (320, 390, 800, 1280, 1536, 1920):
        page = browser.new_page(viewport={'width': width, 'height': 900})
        page.goto('http://127.0.0.1:5173/#build', wait_until='networkidle')
        result = page.evaluate("""() => {
          const r = el => el.getBoundingClientRect();
          const collides = (a,b) => Math.max(0, Math.min(a.right,b.right)-Math.max(a.left,b.left)) * Math.max(0, Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)) > 0;
          const segments = [...document.querySelectorAll('.build-segments button')].map(r);
          const nav = document.querySelector('.topbar nav');
          return {
            width: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            segmentCollisions: segments.some((a,i)=>segments.slice(i+1).some(b=>collides(a,b))),
            mixCollisions: [...document.querySelectorAll('.build-mix-row')].some(row=>collides(r(row.querySelector('.build-mix-row-heading')),r(row.querySelector('input')))),
            routeButtonOverflow: [...document.querySelectorAll('.build-route-card')].some(card=>r(card.querySelector('button')).bottom > r(card).bottom+1),
            navOverflow: nav.scrollWidth > nav.clientWidth,
            heroTitleTrustCollision: collides(r(document.querySelector('.build-hero-copy h2')),r(document.querySelector('.build-hero-trust')))
          };
        }""")
        print(result)
        if width == 1280:
            page.screenshot(path='artifacts/build-vs-buy/refinement-2-1280.png', full_page=True)
        page.close()
    browser.close()
