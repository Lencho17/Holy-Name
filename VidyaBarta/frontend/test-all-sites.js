import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  
  const sites = [
    { name: 'SaaS Website', url: 'http://localhost:5173/' },
    { name: 'Student Portal', url: 'http://localhost:5173/?site=student' },
    { name: 'Employee Hub', url: 'http://localhost:5173/?site=employee' },
    { name: 'School Site', url: 'http://localhost:5173/?test_domain=holynameschool.vidyabarta.com' }
  ];

  for (const site of sites) {
    console.log(`\n--- Testing ${site.name} ---`);
    const page = await browser.newPage();
    
    let hasError = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore specific Vite / React dev warnings that show as errors
        if (msg.text().includes('Failed to load resource: the server responded with a status of 404') && msg.text().includes('favicon.ico')) return;
        
        console.error(`[ERROR] ${msg.text()}`);
        hasError = true;
      } else if (msg.type() === 'warning') {
        console.log(`[WARN] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.error(`[PAGE ERROR] ${err.toString()}`);
      hasError = true;
    });

    try {
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 15000 });
      const title = await page.title();
      console.log(`Title: ${title}`);
      
      // Look for a fallback UI ErrorBoundary
      const errorBoundaryText = await page.evaluate(() => {
        const h2 = document.querySelector('h2');
        return h2 && h2.innerText.includes('Something went wrong') ? 'ErrorBoundary triggered' : null;
      });
      if (errorBoundaryText) {
        console.error(`[ERROR] ${errorBoundaryText}`);
        hasError = true;
      }
      
      if (!hasError) {
        console.log(`✅ ${site.name} loaded successfully without errors.`);
      } else {
        console.log(`❌ ${site.name} had errors.`);
      }
    } catch (e) {
      console.error(`[EXCEPTION] ${e.message}`);
    }
    await page.close();
  }

  await browser.close();
})();
