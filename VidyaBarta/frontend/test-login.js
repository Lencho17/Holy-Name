import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.url(), response.status());
    }
  });

  await page.goto('http://localhost:5173/login');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
